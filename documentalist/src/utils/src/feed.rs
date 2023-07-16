use crate::{
    Anchored, Continuous, Effect, Entry, Pipe, PipeVisitor, TimelineContainer, TimelineElement,
};
use anyhow::Result;
use ges::prelude::*;
use serde::Deserialize;

/// Represents a feed of entries.
///
/// # Examples
///
/// ```
/// use utils::{Feed, Pipe, PipeVisitor};
/// use ges::prelude::*;
///
/// ges::init().expect("Failed to initialize GES.");
///
/// let mut feed = Feed::new(vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4#t=10,20"]);
///
/// let mut pipe = Pipe::default();
///
/// feed.visit(&mut pipe).expect("Failed to visit pipe.");
///
/// ```
pub struct Feed(
    /// The entries.
    pub Vec<Entry>,
    /// group of all clips
    pub ges::Group,
);

impl Feed {
    /// Creates a new feed from a list of paths.
    ///
    /// # Arguments
    ///
    /// * `paths` - The paths to the video files.
    ///
    pub fn new(paths: Vec<&str>) -> Self {
        Self(
            paths.into_iter().map(|path| path.into()).collect(),
            ges::Group::new(),
        )
    }
}

impl PipeVisitor for Feed {
    fn visit_layer_name(&mut self, name: &str, pipe: &mut Pipe) -> Result<()> {
        let mut duration = self.1.start();
        for entry in self.0.iter_mut() {
            entry.set_start(duration);
            let entry_duration = entry.clip.duration();
            duration += entry_duration;
            entry.visit_layer_name(name, pipe)?;
            self.1.add(&entry.clip)?;
        }
        Ok(())
    }
}

impl Anchored for Feed {
    fn start(&self) -> gst::ClockTime {
        self.1.start()
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        self.1.set_start(start);
    }
}

impl Continuous for Feed {
    fn duration(&self) -> gst::ClockTime {
        self.0
            .iter()
            .fold(gst::ClockTime::default(), |acc, e| acc + e.duration())
    }

    fn set_duration(&mut self, duration: gst::ClockTime) {
        self.1.set_duration(duration);
    }

    fn set_inpoint(&mut self, inpoint: gst::ClockTime) {
        self.1.set_inpoint(inpoint);
    }
}

impl TimelineElement for Feed {}

impl TimelineContainer for Feed {}

impl<'de> Deserialize<'de> for Feed {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let yaml = serde_yaml::Value::deserialize(deserializer)?;
        let mut feed = Self::new(vec![]);
        let mut un_ended_effects: Vec<Box<dyn Effect<Entry>>> = vec![];
        match yaml {
            serde_yaml::Value::Mapping(m) => {
                assert_eq!(m.len(), 1);
                let (k, entries) = m.iter().next().unwrap();
                assert_eq!(k.as_str().unwrap(), "feed");
                match entries {
                    serde_yaml::Value::Mapping(m) => {
                        for (k, v) in m {
                            let entry_mapping = serde_yaml::Value::Mapping(
                                serde_yaml::Mapping::from_iter(vec![(k.clone(), v.clone())]),
                            );

                            let mut entry: Entry =
                                serde_yaml::from_value(entry_mapping).map_err(|e| {
                                    serde::de::Error::custom(format!(
                                        "failed to parse entry: {}",
                                        e
                                    ))
                                })?;

                            entry
                                .effects
                                .prepend(crate::TimedEffects(std::sync::Mutex::new(
                                    un_ended_effects,
                                )));

                            un_ended_effects = entry
                                .effects
                                .0
                                .lock()
                                .unwrap()
                                .iter()
                                .filter_map(|e| e.spill_over_effect())
                                .collect();

                            println!("un_ended_effects: {}", un_ended_effects.len());

                            feed.0.push(entry);
                        }
                        Ok(feed)
                    }
                    _ => Err(serde::de::Error::custom("expected entries mapping"))?,
                }
            }
            _ => Err(serde::de::Error::custom("expected feed mapping"))?,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_feed() {
        ges::init().expect("Failed to initialize GStreamer.");

        let feed = Feed::new(vec![
            "tests/fixtures/short.mp4",
            "tests/fixtures/short.mp4#t=10,20",
        ]);
        assert_eq!(feed.0.len(), 2);
    }

    #[test]
    fn it_should_visit_pipe() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut pipe = Pipe::default();
        let mut feed = Feed::new(vec![
            "tests/fixtures/short.mp4",
            "tests/fixtures/short.mp4#t=10,20",
            "tests/fixtures/short.mp4",
            "tests/fixtures/short.mp4",
            "tests/fixtures/short.mp4",
        ]);
        feed.visit(&mut pipe).expect("Failed to visit pipe.");

        let clips = pipe.layers.get("default").unwrap().clips();

        assert_eq!(clips.len(), 5);

        let clip_0 = clips.get(0).unwrap();

        assert_eq!(clip_0.start(), gst::ClockTime::from_nseconds(0));

        let clip_1 = clips.get(1).unwrap();

        assert_eq!(clip_1.inpoint(), gst::ClockTime::from_nseconds(10));
        assert_eq!(clip_1.start(), clip_0.duration());
        assert_eq!(clip_1.duration(), gst::ClockTime::from_nseconds(20));
    }
}
