use std::collections::HashMap;

use crate::{
    as_absolute_path_uri, error::DiscovererError, Anchored, Continuous, Effect, EffectParser, Pipe,
    PipeVisitor, TimeCompressionEffect, TimedEffects, TimelineElement, TrimEffect, VolumeEffect,
};
use anyhow::{Error, Result};
use ges::prelude::*;
use gst_pbutils::{DiscovererInfo, DiscovererStreamInfo};
use serde::Deserialize;
use serde_yaml::Value;

/// Represents a video clip with it's start and end time.
///
/// # Examples
///
/// ```
/// use utils::{Entry, Pipe, PipeVisitor};
/// use ges::prelude::*;
///
/// ges::init().expect("Failed to initialize GES.");
///
/// let entry = Entry::from("tests/fixtures/short.mp4");
/// let entry = Entry::from("tests/fixtures/short.mp4#t=10,20");
/// let entry = Entry::from("tests/fixtures/short.mp4#t=10");
/// let mut entry = Entry::from("tests/fixtures/short.mp4#t=,10");
///
/// let mut pipe = Pipe::default();
///
/// entry.visit(&mut pipe).expect("Failed to visit pipe.");
///
///
/// ```

pub struct Entry {
    /// The path to the video file.
    pub path: String,
    /// The GES clip
    pub clip: ges::UriClip,
    /// all effects applied to this entry
    pub effects: TimedEffects<Entry>,
}

impl Entry {
    pub fn new(path: &str, trim_start: Option<u64>, trim_end: Option<u64>) -> Self {
        let clip = ges::UriClip::new(&path).unwrap();

        let start = trim_start.map(|s| gst::ClockTime::from_nseconds(s));
        let end = trim_end.map(|s| gst::ClockTime::from_nseconds(s));
        if let Some(start) = start {
            clip.set_inpoint(start);
        }
        if let Some(end) = end {
            clip.set_duration(end);
        }
        clip.set_meta("entry", Some(&glib::Value::from(path)));
        Self {
            path: path.to_string(),
            clip,
            effects: TimedEffects::default(),
        }
    }

    pub fn discover(&self) -> Result<DiscovererInfo> {
        let discoverer = gst_pbutils::Discoverer::new(gst::ClockTime::from_seconds(15))?;
        let path = &self.path;
        let info = discoverer.discover_uri(path)?;

        Ok(info)
    }

    pub fn print_discoverer_info(&self) -> Result<()> {
        let info = self.discover()?;

        print_discoverer_info(&info)?;

        Ok(())
    }
}

impl<'a> From<&'a str> for Entry {
    /// Creates a new entry from a path.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    ///
    /// parses start and end time from path
    /// e.g. /path/to/video.mp4#t=10,20
    ///                           ^ ^
    ///                      start | end
    /// e.g. /path/to/video.mp4#t=10
    ///                           ^
    ///                     start |     
    /// e.g. /path/to/video.mp4#t=,10
    ///                            ^
    ///                        end |
    ///                           
    fn from(path: &'a str) -> Self {
        let (path, trim) = {
            let mut trim = (None, None);
            let mut hash = path.split("#t=");
            let path = as_absolute_path_uri(&hash.next().unwrap());
            if let Some(time) = hash.next() {
                let mut time = time.split(",");
                let start = time
                    .next()
                    .filter(|s| !s.is_empty())
                    .map(|s| s.parse::<u64>().unwrap());
                let end = time.next().map(|s| s.parse::<u64>().unwrap());
                trim = (start, end);
            }
            (path, trim)
        };
        Self::new(path.as_str(), trim.0, trim.1)
    }
}

impl PipeVisitor for Entry {
    fn visit_layer_name(&mut self, name: &str, pipe: &mut Pipe) -> Result<()> {
        let layer = pipe.layers.get(name).unwrap();
        layer.add_clip(&self.clip)?;
        {
            let effects = std::mem::replace(&mut self.effects, TimedEffects::default());
            effects.apply(self, pipe, name)?;
            self.effects = effects;
        }

        Ok(())
    }
}

impl Anchored for Entry {
    fn start(&self) -> gst::ClockTime {
        self.clip.start()
    }

    fn set_start(&mut self, start: gst::ClockTime) {
        self.clip.set_start(start);
    }
}

impl Continuous for Entry {
    fn duration(&self) -> gst::ClockTime {
        self.clip.duration()
    }

    fn set_duration(&mut self, duration: gst::ClockTime) {
        self.clip.set_duration(duration);
    }

    fn set_inpoint(&mut self, inpoint: gst::ClockTime) {
        self.clip.set_inpoint(inpoint);
    }
}

impl TimelineElement for Entry {}

impl<'de> Deserialize<'de> for Entry {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let yaml = Value::deserialize(deserializer)?;
        match yaml {
            Value::Mapping(m) => {
                assert_eq!(m.len(), 1);
                let (path, effects) = m.into_iter().next().unwrap();
                let path = match path {
                    Value::String(s) => s,
                    _ => return Err(serde::de::Error::custom("expected a string")),
                };
                let mut entry = Entry::from(path.as_str());
                match effects {
                    Value::Mapping(m) => {
                        for m in m.into_iter() {
                            let effects: TimedEffects<Entry> = serde_yaml::from_value(
                                Value::Mapping(serde_yaml::Mapping::from_iter(vec![m])),
                            )
                            .map_err(|e| serde::de::Error::custom(e.to_string()))?;

                            entry.effects.extend(effects);
                        }
                    }
                    Value::Null => {}
                    _ => return Err(serde::de::Error::custom("expected a sequence")),
                }

                Ok(entry)
            }
            _ => Err(serde::de::Error::custom("expected a mapping")),
        }
    }
}

impl<'de> Deserialize<'de> for TimedEffects<Entry> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let yaml = Value::deserialize(deserializer)?;
        let mut effects = TimedEffects::default();
        if let Value::Mapping(map) = yaml {
            assert_eq!(map.len(), 1);
            let (timestamp, value) = map.into_iter().next().unwrap();
            if TimedEffects::<Entry>::is_timestamp(&timestamp) {
                let timestamp = TimedEffects::<Entry>::parse_timestamp(&timestamp).unwrap();
                if let Value::Mapping(effects_map) = value {
                    for (effect_name, effect_value) in effects_map.into_iter() {
                        let effect_mapping =
                            Value::Mapping(serde_yaml::Mapping::from_iter(vec![(
                                effect_name,
                                effect_value,
                            )]));
                        let mut running_effects: HashMap<&str, &mut Box<dyn Effect<Entry>>> =
                            HashMap::new();
                        match effect_mapping {
                            trim if TrimEffect::can_parse(&trim) => {
                                let effect = TrimEffect::parse(&trim, &timestamp);
                                let mut box_ef: Box<dyn Effect<Entry>> = Box::new(effect);
                                let mut previous_effect = match effect {
                                    TrimEffect::Start(_, _) => {
                                        running_effects.insert("trim_start", &mut box_ef)
                                    }
                                    TrimEffect::End(_, _) => {
                                        running_effects.insert("trim_end", &mut box_ef)
                                    }
                                };
                                if let Some(ef) = previous_effect.as_mut() {
                                    ef.set_duration(Some(timestamp - ef.start()));
                                }
                                effects.add(box_ef);
                            }
                            vol if VolumeEffect::can_parse(&vol) => {
                                let effect = VolumeEffect::parse(&vol, &timestamp);
                                let mut box_ef: Box<dyn Effect<Entry>> = Box::new(effect);
                                let mut previous_effect =
                                    running_effects.insert("vol", &mut box_ef);
                                if let Some(ef) = previous_effect.as_mut() {
                                    ef.set_duration(Some(timestamp - ef.start()));
                                }
                                effects.add(box_ef);
                            }
                            tc if TimeCompressionEffect::can_parse(&tc) => {
                                let effect = TimeCompressionEffect::parse(&tc, &timestamp);
                                let mut box_ef: Box<dyn Effect<Entry>> = Box::new(effect);
                                let mut previous_effect = running_effects.insert("tc", &mut box_ef);
                                if let Some(ef) = previous_effect.as_mut() {
                                    ef.set_duration(Some(timestamp - ef.start()));
                                }
                                effects.add(box_ef);
                            }
                            ev => {
                                return Err(serde::de::Error::custom(format!(
                                    "expected entry effect, got {:#?}",
                                    ev
                                )))?
                            }
                        }
                    }
                    Ok(effects)
                } else {
                    Err(serde::de::Error::custom("expected a mapping"))?
                }
            } else {
                Err(serde::de::Error::custom("expected timestamp"))?
            }
        } else {
            Err(serde::de::Error::custom("expected mapping"))?
        }
    }
}

fn print_tags(info: &DiscovererInfo) {
    println!("Tags:");

    let tags = info.tags();
    match tags {
        Some(taglist) => {
            println!("  {taglist}"); // FIXME use an iterator
        }
        None => {
            println!("  no tags");
        }
    }
}

fn print_stream_info(stream: &DiscovererStreamInfo) {
    println!("Stream: ");
    // println!("  Stream id: {}", stream.id());
    let caps_str = match stream.caps() {
        Some(caps) => caps.to_string(),
        None => String::from("--"),
    };
    println!("  Format: {caps_str}");
}

fn print_discoverer_info(info: &DiscovererInfo) -> Result<(), Error> {
    println!("URI: {}", info.uri());
    println!("Duration: {}", info.duration().display());
    print_tags(info);
    print_stream_info(
        &info
            .stream_info()
            .ok_or(DiscovererError("Error while obtaining stream info"))?,
    );

    let children = info.stream_list();
    println!("Children streams:");
    for child in children {
        print_stream_info(&child);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_entry_from_path() {
        ges::init().expect("Failed to initialize GES.");

        let entry = Entry::from("tests/fixtures/short.mp4");

        assert_eq!(entry.path, as_absolute_path_uri("tests/fixtures/short.mp4"));

        let entry = Entry::from("tests/fixtures/short.mp4#t=10,20");

        assert_eq!(
            (entry.clip.inpoint(), entry.clip.duration()),
            (
                gst::ClockTime::from_nseconds(10),
                gst::ClockTime::from_nseconds(20)
            )
        );

        let entry = Entry::from("tests/fixtures/short.mp4#t=10");

        assert_eq!(
            (entry.clip.inpoint(), entry.clip.duration()),
            (
                gst::ClockTime::from_nseconds(10),
                gst::ClockTime::from_nseconds(3000000000)
            )
        );

        let entry = Entry::from("tests/fixtures/short.mp4#t=,10");

        assert_eq!(
            (entry.clip.inpoint(), entry.clip.duration()),
            (
                gst::ClockTime::from_nseconds(0),
                gst::ClockTime::from_nseconds(10)
            )
        );
    }

    #[test]
    fn it_should_visit_pipe() {
        ges::init().expect("Failed to initialize GES.");

        let mut entry = Entry::from("tests/fixtures/short.mp4");

        let mut pipe = Pipe::default();

        entry.visit(&mut pipe).expect("Failed to visit pipe.");

        assert_eq!(pipe.pipeline.children().len(), 2);
        assert_eq!(pipe.layers.len(), 1);
        let default_layer = pipe.layers.get("default").unwrap();
        assert_eq!(default_layer.clips().len(), 1);
    }

    #[test]
    fn it_should_get_duration() {
        ges::init().expect("Failed to initialize GES.");

        let mut entry = Entry::from("tests/fixtures/short.mp4");
        let mut pipe = Pipe::default();
        entry.visit(&mut pipe).expect("Failed to visit pipe.");

        assert_eq!(entry.duration(), gst::ClockTime::from_nseconds(3000000000));
    }
}
