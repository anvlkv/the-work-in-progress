use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

use crate::{Connector, FromSrcPipe, Pipe, Port};
use anyhow::{Result};
use gst::prelude::*;
use gst_pbutils::{self, prelude::*};

/// Represents a destination video clip.
///
/// # Examples
///
/// ```
/// use utils::{Destination, FromSrcPipe, Pipe};
/// use gst::prelude::*;
///
/// gst::init().expect("Failed to initialize GStreamer.");
///
/// let dest: Destination = "/path/to/video.mp4".try_into().expect("cannot create destination");
///
/// assert_eq!(dest.0, "/path/to/video.mp4");
///
/// let mut pipe = Pipe::default();
///
/// pipe = dest.from_src_pipe(pipe).expect("Failed to create pipeline from feed.");
///
/// assert_eq!(pipe.pipeline.children().len(), 4);
///
/// ```
#[derive(Clone, Debug, Hash)]
pub struct Destination(
    /// The path to the video file.
    pub String,
    /// container profile
    gst_pbutils::EncodingContainerProfile,
);

impl Destination {
    /// Creates a new destination from a path with encoding profiles.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    /// * `audio_profile_name` - The name of the audio profile.
    /// * `video_profile_name` - The name of the video profile.
    /// * `container_profile_name` - The name of the container profile.
    ///
    /// # Examples
    ///
    /// ```
    /// use utils::Destination;
    ///
    /// gst::init().expect("Failed to initialize GStreamer.");
    ///
    /// let destination = Destination::new(
    ///  "/path/to/video.mp4".to_string(),
    ///  "audio/x-vorbis",
    ///  "video/x-theora",
    ///  "video/x-matroska"
    /// );
    ///
    /// assert_eq!(destination.0, "/path/to/video.mp4");
    /// ```
    ///
    pub fn new(
        path: String,
        audio_profile_name: &str,
        video_profile_name: &str,
        container_profile_name: &str,
    ) -> Self {
        // To tell the encodebin what we want it to produce, we create an EncodingProfile
        // https://gstreamer.freedesktop.org/data/doc/gstreamer/head/gst-plugins-base-libs/html/GstEncodingProfile.html
        // This profile consists of information about the contained audio and video formats
        // as well as the container format we want everything to be combined into.

        // Every audio stream piped into the encodebin should be encoded using vorbis.
        let audio_profile = gst_pbutils::EncodingAudioProfile::builder(
            &gst::Caps::builder(audio_profile_name).build(),
        )
        .presence(0)
        .build();

        // Every video stream piped into the encodebin should be encoded using theora.
        let video_profile = gst_pbutils::EncodingVideoProfile::builder(
            &gst::Caps::builder(video_profile_name).build(),
        )
        .presence(0)
        .build();

        // All streams are then finally combined into a matroska container.
        let container_profile = gst_pbutils::EncodingContainerProfile::builder(
            &gst::Caps::builder(container_profile_name).build(),
        )
        .name("container")
        .add_profile(video_profile)
        .add_profile(audio_profile)
        .build();
        Self(path, container_profile)
    }

    fn configure_encodebin(&self, bin: &gst::Element) {
        bin.set_property("profile", &self.1);
    }
}

impl<'a> From<&'a str> for Destination {
    /// Creates a new destination from a path.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    ///
    fn from(path: &'a str) -> Self {
        Self::new(
            path.to_string(),
            "audio/x-vorbis",
            "video/x-theora",
            "video/x-matroska",
        )
    }
}

impl FromSrcPipe for Destination {
    fn from_src_pipe(self, mut pipe: Pipe) -> Result<Pipe> {
        let name = {
            let mut hasher = DefaultHasher::new();
            self.hash(&mut hasher);
            format!("destination_{:x}", hasher.finish())
        };

        let encodebin = gst::ElementFactory::make("encodebin")
            .name(format!("encodebin_{}", name))
            .build()?;

        self.configure_encodebin(&encodebin);

        pipe.pipeline.add(&encodebin)?;

        let filesink = gst::ElementFactory::make("filesink")
            .name(format!("filesink_{}", name))
            .property("location", &self.0)
            .build()?;

        pipe.pipeline.add(&filesink)?;
        gst::Element::link_many(&[&encodebin, &filesink])?;

        let (v_id_el, a_id_el) = {
            if let Some(Connector(v_id_el, a_id_el)) = pipe.src_connector.take() {
                (v_id_el, a_id_el)
            } else {
                let audio_identity = gst::ElementFactory::make("identity")
                    .name(format!("audio_identity_{}", name))
                    .build()?;
                let video_identity = gst::ElementFactory::make("identity")
                    .name(format!("video_identity_{}", name))
                    .build()?;
                pipe.pipeline
                    .add_many(&[&audio_identity, &video_identity])?;

                (video_identity, audio_identity)
            }
        };
        let encodebin_d = encodebin.downgrade();
        a_id_el.connect_pad_added(move |el, src_pad| {
            let encodebin = match encodebin_d.upgrade() {
                Some(encodebin) => encodebin,
                None => return,
            };
            let sink_pad = encodebin.static_pad("sink_1").unwrap();
            if sink_pad.is_linked() {
                return;
            }
            src_pad.link(&sink_pad).unwrap();
            el.sync_state_with_parent().unwrap();
        });

        let encodebin_d = encodebin.downgrade();
        v_id_el.connect_pad_added(move |el, src_pad| {
            let encodebin = match encodebin_d.upgrade() {
                Some(encodebin) => encodebin,
                None => return,
            };
            let sink_pad = encodebin.static_pad("sink_0").unwrap();
            if sink_pad.is_linked() {
                return;
            }
            src_pad.link(&sink_pad).unwrap();
            el.sync_state_with_parent().unwrap();
        });

        pipe.sink_port = Some(Port::new(v_id_el, a_id_el));

        Ok(pipe)
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_destination_from_path() {
        gst::init().expect("Failed to initialize GStreamer.");
        let destination = Destination::from("/path/to/video.mp4");

        assert_eq!(destination.0, "/path/to/video.mp4");
    }

    #[test]
    fn it_should_create_pipeline_from_destination() {
        gst::init().expect("Failed to initialize GStreamer.");

        let destination = Destination::from("/path/to/video.mp4");

        let mut pipe = Pipe::default();

        pipe = destination
            .from_src_pipe(pipe)
            .expect("Failed to create pipeline from destination.");

        assert_eq!(pipe.pipeline.children().len(), 4);
    }
}