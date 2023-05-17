use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};

use crate::{Connector, FromSrcPipe, Pipe, Port};
use anyhow::Result;
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
/// let dest: Destination = "/path/to/video.mkv".try_into().expect("cannot create destination");
///
/// assert_eq!(dest.0, "/path/to/video.mkv");
///
/// let mut pipe = Pipe::default();
///
/// pipe = dest.from_src_pipe(pipe).expect("Failed to create pipeline from feed.");
///
/// assert_eq!(pipe.pipeline.children().len(), 6);
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
    ///  "/path/to/video.mkv".to_string(),
    ///  "audio/x-vorbis",
    ///  "video/x-theora",
    ///  "video/x-matroska"
    /// );
    ///
    /// assert_eq!(destination.0, "/path/to/video.mkv");
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

        let audio_profile = gst_pbutils::EncodingAudioProfile::builder(
            &gst::Caps::builder(audio_profile_name).build(),
        )
        .presence(0)
        .build();

        let video_profile = gst_pbutils::EncodingVideoProfile::builder(
            &gst::Caps::builder(video_profile_name).build(),
        )
        .presence(0)
        .build();

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

    /// Creates a new destination from a path with encoding profiles.
    /// The container profile is determined by the file extension.
    /// Currently supported container profiles are: mp4, mkv, avi, ogg, webm
    /// The audio and video profiles are determined by the container profile.
    /// Currently supported audio profiles are: vorbis, opus, mp3, aac
    /// Currently supported video profiles are: theora, vp8, vp9, h264, h265
    ///
    /// # Arguments
    /// * `path` - The path to the video file.
    ///
    fn new_with_extension(path: &str) -> Result<Self> {
        let extension = std::path::Path::new(path)
            .extension()
            .ok_or_else(|| anyhow::anyhow!("No extension found for path {}", path))?
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Failed to convert extension to str"))?;

        let (audio_profile_name, video_profile_name, container_profile_name) = match extension {
            "mp4" => ("audio/mpeg", "video/x-h264", "video/x-quicktime"),
            "mkv" => ("audio/x-vorbis", "video/x-theora", "video/x-matroska"),
            "avi" => ("audio/x-vorbis", "video/x-theora", "video/x-avi"),
            "ogg" => ("audio/x-vorbis", "video/x-theora", "video/x-ogg"),
            "webm" => ("audio/x-opus", "video/x-vp9", "video/x-webm"),
            _ => {
                return Err(anyhow::anyhow!(
                    "Unsupported extension {} for path {}",
                    extension,
                    path
                ))
            }
        };

        let audio_profile = gst_pbutils::EncodingAudioProfile::builder(
            &gst::Caps::builder(audio_profile_name).build(),
        )
        .presence(0)
        .build();

        let video_profile = gst_pbutils::EncodingVideoProfile::builder(
            &gst::Caps::builder(video_profile_name).build(),
        )
        .presence(0)
        .build();

        let container_profile = gst_pbutils::EncodingContainerProfile::builder(
            &gst::Caps::builder(container_profile_name).build(),
        )
        .name("container")
        .add_profile(video_profile)
        .add_profile(audio_profile)
        .build();

        Ok(Self(path.to_string(), container_profile))
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
        Self::new_with_extension(path).unwrap()
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
                audio_identity.sync_state_with_parent()?;
                video_identity.sync_state_with_parent()?;
                (video_identity, audio_identity)
            }
        };

        pipe.pipeline.add(&filesink)?;
        gst::Element::link_many(&[&encodebin, &filesink])?;

        {
            // let template = encodebin
            //     .pad_template("audio_%u")
            //     .expect("No audio pad template");

            // let enc_sink_pad = gst::Pad::from_template(&template, Some("audio_0"));
            // encodebin.add_pad(&enc_sink_pad).expect("Failed to add audio pad");
            let enc_sink_pad = encodebin
                .request_pad_simple("audio_%u")
                .expect("Could not get audio pad from encodebin");

            let queue = gst::ElementFactory::make("queue")
                .name(format!("audio_queue_{}", name))
                .build()?;
            let src_pad = a_id_el.static_pad("src").unwrap();
            let queue_sink_pad = queue.static_pad("sink").unwrap();
            let queue_src_pad = queue.static_pad("src").unwrap();
            pipe.pipeline.add(&queue)?;
            queue.sync_state_with_parent()?;

            src_pad.link(&queue_sink_pad)?;
            queue_src_pad.link(&enc_sink_pad)?;
        }

        {
            // let template = encodebin
            //     .pad_template("video_%u")
            //     .expect("No video pad template");

            // let enc_sink_pad = gst::Pad::from_template(&template, Some("video_0"));
            // encodebin.add_pad(&enc_sink_pad).expect("Failed to add video pad");

            let enc_sink_pad = encodebin
                .request_pad_simple("video_%u")
                .expect("Could not get video pad from encodebin");

            let queue = gst::ElementFactory::make("queue")
                .name(format!("video_queue_{}", name))
                .build()?;
            let src_pad = v_id_el.static_pad("src").unwrap();
            let queue_sink_pad = queue.static_pad("sink").unwrap();
            let queue_src_pad = queue.static_pad("src").unwrap();
            pipe.pipeline.add(&queue)?;
            queue.sync_state_with_parent()?;

            src_pad.link(&queue_sink_pad)?;
            queue_src_pad.link(&enc_sink_pad)?;
        }
        encodebin.sync_state_with_parent()?;
        filesink.sync_state_with_parent()?;

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
        let destination = Destination::from("/path/to/video.mkv");

        assert_eq!(destination.0, "/path/to/video.mkv");
    }

    #[test]
    fn it_should_create_pipeline_from_mkv_destination() {
        gst::init().expect("Failed to initialize GStreamer.");

        let destination = Destination::from("/path/to/video.mkv");

        let mut pipe = Pipe::default();

        pipe = destination
            .from_src_pipe(pipe)
            .expect("Failed to create pipeline from destination.");

        assert_eq!(pipe.pipeline.children().len(), 6);
    }

    // #[test]
    // fn it_should_create_pipeline_with_mp4_destination() {
    //     gst::init().expect("Failed to initialize GStreamer.");

    //     let destination = Destination::from("/path/to/video.mp4");

    //     let mut pipe = Pipe::default();

    //     pipe = destination
    //         .from_src_pipe(pipe)
    //         .expect("Failed to create pipeline from destination.");

    //     assert_eq!(pipe.pipeline.children().len(), 6);
    // }

    // #[test]
    // fn it_should_create_pipeline_with_avi_destination() {
    //     gst::init().expect("Failed to initialize GStreamer.");

    //     let destination = Destination::from("/path/to/video.avi");

    //     let mut pipe = Pipe::default();

    //     pipe = destination
    //         .from_src_pipe(pipe)
    //         .expect("Failed to create pipeline from destination.");

    //     assert_eq!(pipe.pipeline.children().len(), 6);
    // }
    // #[test]
    // fn it_should_create_pipeline_with_ogg_destination() {
    //     gst::init().expect("Failed to initialize GStreamer.");

    //     let destination = Destination::from("/path/to/video.ogg");

    //     let mut pipe = Pipe::default();

    //     pipe = destination
    //         .from_src_pipe(pipe)
    //         .expect("Failed to create pipeline from destination.");

    //     assert_eq!(pipe.pipeline.children().len(), 6);
    // }

    // #[test]
    // fn it_should_create_pipeline_with_webm_destination() {
    //     gst::init().expect("Failed to initialize GStreamer.");

    //     let destination = Destination::from("/path/to/video.webm");

    //     let mut pipe = Pipe::default();

    //     pipe = destination
    //         .from_src_pipe(pipe)
    //         .expect("Failed to create pipeline from destination.");

    //     assert_eq!(pipe.pipeline.children().len(), 6);
    // }
}
