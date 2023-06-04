use crate::{as_absolute_path_uri, Pipe, PipeVisitor};
use anyhow::Result;
use ges::prelude::*;

/// Represents a destination video clip.
///
/// # Examples
///
/// ```
/// use utils::{Destination, PipeVisitor, Pipe};
/// use ges::prelude::*;
///
/// ges::init().expect("Failed to initialize GStreamer.");
///
/// let mut dest: Destination = "tests/out/destination.mkv".try_into().expect("cannot create destination");
///
///
/// let mut pipe = Pipe::default();
///
/// dest.visit(&mut pipe).expect("Failed to create pipeline from feed.");
///
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
    /// The container profile is determined by the file extension.
    /// Currently supported container profiles are: mp4, mkv, ogg, webm
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

        let (audio_profile_caps, video_profile_caps, container_profile_caps) = match extension {
            "mp4" => (
                // FIXME: some suggest to set mpegversion=1 and layer=3 but its failing to set render settings
                gst::Caps::builder("audio/mpeg")
                // .field("mpegversion", "1")
                // .field("layer", "3")
                .build(),
                gst::Caps::builder("video/x-h264").build(),
                // FIXME: some suggest to set variant=iso but its failing to set render settings
                gst::Caps::builder("video/quicktime")
                // .field("variant", "iso")
                .build(),
            ),
            "mkv" => (
                gst::Caps::builder("audio/x-vorbis").build(),
                gst::Caps::builder("video/x-theora").build(),
                gst::Caps::builder("video/x-matroska").build(),
            ),
            "ogg" => (
                gst::Caps::builder("audio/x-vorbis").build(),
                gst::Caps::builder("video/x-theora").build(),
                gst::Caps::builder("application/ogg").build(),
            ),
            "webm" => (
                gst::Caps::builder("audio/x-opus").build(),
                gst::Caps::builder("video/x-vp9").build(),
                gst::Caps::builder("video/webm").build(),
            ),
            // FIXME: these are failing
            // "avi" => (
            //     gst::Caps::builder("audio/x-vorbis").build(),
            //     gst::Caps::builder("video/x-theora").build(),
            //     gst::Caps::builder("video/x-msvideo").build(),
            // ),
            // "ts" => (
            //     gst::Caps::builder("audio/x-ac3").build(),
            //     gst::Caps::builder("video/x-h264").build(),
            //     gst::Caps::builder("video/mpegts").build(),
            // ),
            _ => {
                return Err(anyhow::anyhow!(
                    "Unsupported extension {} for path {}",
                    extension,
                    path
                ))
            }
        };

        let audio_profile = gst_pbutils::EncodingAudioProfile::builder(
            &audio_profile_caps,
        )
        .build();

        let video_profile = gst_pbutils::EncodingVideoProfile::builder(
            &video_profile_caps,
        )
        .build();

        let container_profile = gst_pbutils::EncodingContainerProfile::builder(
            &container_profile_caps,
        )
        .name("container")
        .add_profile(video_profile)
        .add_profile(audio_profile)
        .build();


        Ok(Self(as_absolute_path_uri(path), container_profile))
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

impl PipeVisitor for Destination {
    fn visit_layer_name(&mut self, _: &str, pipe: &mut Pipe) -> Result<()> {
        pipe.pipeline.set_render_settings(&self.0, &self.1)?;
        pipe.pipeline.set_mode(ges::PipelineFlags::RENDER)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_destination_from_path() {
        ges::init().expect("Failed to initialize GStreamer.");
        let _ = Destination::from("tests/out/destination.mkv");
    }

    #[test]
    fn it_should_visit_pipeline_with_mkv_destination() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut destination = Destination::from("tests/out/destination.mkv");

        let mut pipe = Pipe::default();

        destination
            .visit(&mut pipe)
            .expect("Failed to create pipeline from destination.");
    }

    #[test]
    fn it_should_visit_pipeline_with_mp4_destination() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut destination = Destination::from("tests/out/destination.mp4");

        let mut pipe = Pipe::default();

        destination
            .visit(&mut pipe)
            .expect("Failed to create pipeline from destination.");
    }

    // #[test]
    // #[ignore]
    // fn it_should_visit_pipeline_with_avi_destination() {
    //     ges::init().expect("Failed to initialize GStreamer.");

    //     let mut destination = Destination::from("tests/out/destination.avi");

    //     let mut pipe = Pipe::default();

    //     destination
    //         .visit(&mut pipe)
    //         .expect("Failed to create pipeline from destination.");
    // }
    #[test]
    fn it_should_visit_pipeline_with_ogg_destination() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut destination = Destination::from("tests/out/destination.ogg");

        let mut pipe = Pipe::default();

        destination
            .visit(&mut pipe)
            .expect("Failed to create pipeline from destination.");
    }

    #[test]
    fn it_should_visit_pipeline_with_webm_destination() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut destination = Destination::from("tests/out/destination.webm");

        let mut pipe = Pipe::default();

        destination
            .visit(&mut pipe)
            .expect("Failed to create pipeline from destination.");
    }

    // #[test]
    // #[ignore]
    // fn it_should_visit_pipeline_with_ts_destination() {
    //     ges::init().expect("Failed to initialize GStreamer.");

    //     let mut destination = Destination::from("tests/out/destination.ts");

    //     let mut pipe = Pipe::default();

    //     destination
    //         .visit(&mut pipe)
    //         .expect("Failed to create pipeline from destination.");
    // }
}
