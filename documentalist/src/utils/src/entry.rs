use crate::{error::DiscovererError, Connector, Pipe, ToSinkPipe};
use anyhow::{Error, Result};
use gst::prelude::*;
use gst_pbutils::{prelude::*, DiscovererInfo, DiscovererStreamInfo};
use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

fn gst_element_type(bin: &gst::Element, src_pad: &gst::Pad) -> (bool, bool) {
    let media_type = src_pad.current_caps().and_then(|caps| {
        caps.structure(0).map(|s| {
            let name = s.name();
            (name.starts_with("video/"), name.starts_with("audio/"))
        })
    });

    match media_type {
        None => {
            gst::element_warning!(
                bin,
                gst::CoreError::Negotiation,
                (
                    "Failed to get media type from pad {} of {}",
                    src_pad.name(),
                    bin.name()
                )
            );

            panic!(
                "Failed to get media type from pad {} of {}",
                src_pad.name(),
                bin.name()
            );
        }
        Some(media_type) => media_type,
    }
}

/// Represents a video clip with it's start and end time.
///
/// # Examples
///
/// ```
/// use utils::Entry;
///
/// let entry = Entry::from("/path/to/video.mp4");
///
/// assert_eq!(entry.0, "/path/to/video.mp4");
///
/// ```
#[derive(Clone, Debug, Hash)]
pub struct Entry(
    /// The path to the video file.
    pub String,
    std::time::Instant,
);

impl Entry {
    fn as_absolute_path(&self) -> String {
        let path = std::path::Path::new(&self.0);
        let absolute_path = path.canonicalize().unwrap();
        format!("file://{}", absolute_path.to_str().unwrap())
    }

    pub fn discover(&self) -> Result<DiscovererInfo> {
        let discoverer = gst_pbutils::Discoverer::new(gst::ClockTime::from_seconds(15))?;

        let info = discoverer.discover_uri(&self.as_absolute_path())?;

        Ok(info)
    }

    pub fn print_discoverer_info(&self) -> Result<()> {
        let info = self.discover()?;

        print_discoverer_info(&info)?;

        Ok(())
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


impl<'a> From<&'a str> for Entry {
    /// Creates a new entry from a path.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    ///
    fn from(path: &'a str) -> Self {
        Self(path.to_string(), std::time::Instant::now())
    }
}

impl ToSinkPipe for Entry {
    fn to_sink_pipe(self, mut pipe: Pipe) -> Result<Pipe> {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        let name = format!("entry_{:x}", hasher.finish());

        let filesrc = gst::ElementFactory::make("filesrc")
            .name(format!("filesrc_{}", name))
            .property("location", &self.0)
            .build()?;
        let tag = gst::ElementFactory::make("taginject")
            .name(format!("taginject_{}", name))
            .property("tags", &self.0)
            .build()?;
        let decodebin = gst::ElementFactory::make("decodebin")
            .name(format!("decodebin_{}", name))
            .build()?;
        let audio_identity = gst::ElementFactory::make("identity")
            .name(format!("audio_identity_{}", name))
            .build()?;
        let video_identity = gst::ElementFactory::make("identity")
            .name(format!("video_identity_{}", name))
            .build()?;

        pipe.pipeline.add_many(&[&filesrc, &tag, &decodebin, &audio_identity, &video_identity])?;
        gst::Element::link_many(&[&filesrc, &tag, &decodebin])?;
        
        for el in [&audio_identity, &video_identity, &filesrc, &tag, &decodebin]{
            el.sync_state_with_parent()?;
        }

        let audio_identity_weak = audio_identity.downgrade();
        let video_identity_weak = video_identity.downgrade();
        let pipe_weak = pipe.pipeline.downgrade();

        decodebin.connect_pad_added(move |decodebin, decodebin_src_pad| {
            let audio_identity = audio_identity_weak.upgrade().expect("failed to upgrade weak ref");
            let video_identity = video_identity_weak.upgrade().expect("failed to upgrade weak ref");
            let pipeline = pipe_weak.upgrade().expect("failed to upgrade weak ref");

            let (is_video, is_audio) = gst_element_type(decodebin, decodebin_src_pad);

            let (queue, convert, id) = {
                if is_audio {
                    let q = gst::ElementFactory::make("queue")
                        .name(format!("audio_queue_{}", name))
                        .build()
                        .expect("Failed to create queue");
                    let c = gst::ElementFactory::make("audioconvert")
                        .build()
                        .expect("Failed to create audioconvert");
                    (q, c, audio_identity)
                } else if is_video {
                    let q = gst::ElementFactory::make("queue")
                        .name(format!("video_queue_{}", name))
                        .build()
                        .expect("Failed to create queue");
                    let c = gst::ElementFactory::make("videoconvert")
                        .build()
                        .expect("Failed to create videoconvert");
                    (q, c, video_identity)
                } else {
                    panic!("Unexpected pad type");
                }
            };

            let sink_pad = queue
                .static_pad("sink")
                .expect("Failed to get static sink pad from identity");

            pipeline
                .add_many(&[&queue, &convert])
                .expect("Failed to add queue and convert to pipeline");
            gst::Element::link_many(&[&queue, &convert, &id])
                .expect("Failed to link queue, convert and identity");

            decodebin_src_pad.link(&sink_pad).expect(
                format!(
                    "Failed to link decodebin to queue audio[{}] video[{}] pad [{}]",
                    is_audio,
                    is_video,
                    decodebin_src_pad.name()
                )
                .as_str(),
            );
            for el in &[&queue, &convert, &id] {
                el.sync_state_with_parent()
                    .expect("Failed to sync element with parent");
            }

        });

        let connector: Connector = Connector::new(video_identity, audio_identity);

        if let Some(port) = pipe.sink_port.take() {
            port.connect(&connector)?;
        } else {
            pipe.src_connector = Some(connector);
        }

        Ok(pipe)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_entry_from_path() {
        let entry = Entry::from("/path/to/video.mp4");

        assert_eq!(entry.0, "/path/to/video.mp4");
    }

    #[test]
    fn it_should_create_pipeline_from_entry() {
        gst::init().expect("Failed to initialize GStreamer.");

        let entry = Entry::from("tests/fixtures/short_silent.mp4");

        let mut pipe = Pipe::default();

        pipe = entry
            .to_sink_pipe(pipe)
            .expect("Failed to create pipeline from entry.");
        assert_eq!(pipe.pipeline.children().len(), 5);
    }

    #[test]
    fn it_should_print_discoverer_info() {
        gst::init().expect("Failed to initialize GStreamer.");

        let entry = Entry::from("tests/fixtures/short.mp4");

        entry
            .print_discoverer_info()
            .expect("Failed to print discoverer info.");
    }
}
