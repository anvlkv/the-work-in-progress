use anyhow::Result;
use gst::prelude::*;
use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

use crate::{Connector, Entry, Pipe, ToSinkPipe};

/// Represents a feed of video clips.
///
/// # Examples
///
/// ```
/// use utils::{Feed, ToSinkPipe, Pipe};
/// use std::convert::TryInto;
/// use gst::prelude::*;
///
/// gst::init().expect("Failed to initialize GStreamer.");
///
/// let mut feed = Feed::new(vec!["/path/to/video1.mp4", "/path/to/video2.mp4"]);
///
/// feed.add("/path/to/video3.mp4");
///
/// assert_eq!(feed.0.len(), 3);
///
/// let mut pipe = Pipe::default();
///
/// pipe = feed.to_sink_pipe(pipe).expect("Failed to create pipeline from feed.");
///
/// assert_eq!(pipe.pipeline.children().len(), 18);
///
///
/// ```
#[derive(Clone, Debug, Hash)]
pub struct Feed(
    /// The entries.
    pub Vec<Entry>,
);

impl Feed {
    /// Creates a new feed from a list of paths.
    ///
    /// # Arguments
    ///
    /// * `paths` - The paths to the video files.
    ///
    pub fn new(paths: Vec<&str>) -> Self {
        Self(paths.into_iter().map(|path| path.into()).collect())
    }

    /// Adds a path to the feed.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    ///
    pub fn add(&mut self, path: &str) -> &mut Entry {
        self.0.push(path.into());
        self.0.last_mut().unwrap()
    }
}

impl ToSinkPipe for Feed {
    fn to_sink_pipe(self, mut pipe: Pipe) -> Result<Pipe> {
        let name = {
            let mut hasher = DefaultHasher::new();
            self.hash(&mut hasher);
            format!("feed_{:x}", hasher.finish())
        };
        let entries = self.0.clone();
        let v_concat = gst::ElementFactory::make("concat")
            .name(format!("video_{}", name))
            .build()?;
        let a_concat = gst::ElementFactory::make("concat")
            .name(format!("audio_{}", name))
            .build()?;
        let synchronizer = gst::ElementFactory::make("streamsynchronizer")
            .name(format!("synchronizer_{}", name))
            .build()?;
        let video_identity = gst::ElementFactory::make("identity")
            .name(format!("video_identity_{}", name))
            .build()?;
        let audio_identity = gst::ElementFactory::make("identity")
            .name(format!("audio_identity_{}", name))
            .build()?;

        pipe.pipeline.add_many(&[
            &v_concat,
            &a_concat,
            &synchronizer,
            &video_identity,
            &audio_identity,
        ])?;

        v_concat.link_pads(Some("src"), &synchronizer, Some("sink_0"))?;
        a_concat.link_pads(Some("src"), &synchronizer, Some("sink_1"))?;
        synchronizer.link_pads(Some("src_0"), &video_identity, Some("sink"))?;
        synchronizer.link_pads(Some("src_1"), &audio_identity, Some("sink"))?;
        v_concat.sync_state_with_parent()?;
        a_concat.sync_state_with_parent()?;
        synchronizer.sync_state_with_parent()?;

        for entry in entries {
            pipe = entry.to_sink_pipe(pipe)?;
            if let Some(connector) = pipe.src_connector.as_ref() {
                connector.connect_elements(&v_concat, &a_concat)?;
            }
        }

        pipe.src_connector = Some(Connector::new(
            video_identity,
            audio_identity,
        ));

        Ok(pipe)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_feed() {
        let feed = Feed::new(vec!["/path/to/video1.mp4", "/path/to/video2.mp4"]);
        assert_eq!(feed.0.len(), 2);
    }

    #[test]
    fn it_should_link_from_pipe() {
        gst::init().expect("Failed to initialize GStreamer.");

        let feed = Feed::new(vec!["/path/to/video1.mp4", "/path/to/video2.mp4"]);
        let pipe = feed
            .to_sink_pipe(Pipe::default())
            .expect("Failed to link from pipe.");
        assert_eq!(pipe.pipeline.children().len(), 15);
    }
}
