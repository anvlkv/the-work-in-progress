use super::{file_location::FileLocation, Timeline, TimelineMarker};
use byte_slice_cast::*;
use ges::{
    glib,
    gst::{self, prelude::*},
    gst_base::subclass::prelude::*,
    prelude::*,
};
use gst_audio::subclass::prelude::*;
use gst_video::{subclass::prelude::*, video_frame::Readable, VideoFrame};
use once_cell::sync::Lazy;

use std::fs::File;
use std::io::Write;
use std::sync::Mutex;

use url::Url;

const DEFAULT_LOCATION: Option<FileLocation> = None;

#[derive(Default, Debug)]
enum State {
    #[default]
    Stopped,
    Started {
        file: File,
        position: u64,
        timeline: Timeline,
    },
}

#[derive(Debug)]
struct Settings {
    location: Option<FileLocation>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            location: DEFAULT_LOCATION,
        }
    }
}

mod imp {
    use super::*;

    #[derive(Debug, Default)]
    pub struct TimelineSink(Mutex<State>, Mutex<Settings>);

    impl TimelineSink {
        fn set_location(&self, location: Option<FileLocation>) -> Result<(), glib::Error> {
            let Self(state, settings) = self;
            let state = state.lock().unwrap();
            if let State::Started { .. } = *state {
                return Err(glib::Error::new(
                    gst::URIError::BadState,
                    "Changing the `location` property on a started `filesink` is not supported",
                ));
            }

            let mut settings = settings.lock().unwrap();
            settings.location = location;

            Ok(())
        }
    }

    pub static CAT: Lazy<gst::DebugCategory> = Lazy::new(|| {
        gst::DebugCategory::new(
            "rstimelinesink",
            gst::DebugColorFlags::empty(),
            Some("Timeline Sink (rs)"),
        )
    });

    #[glib::object_subclass]
    impl ObjectSubclass for TimelineSink {
        const NAME: &'static str = "TimeLineSink";
        type Type = super::TimelineSink;
        type ParentType = gst_base::BaseSink;
        type Interfaces = (gst::URIHandler,);
    }

    impl URIHandlerImpl for TimelineSink {
        const URI_TYPE: gst::URIType = gst::URIType::Sink;

        fn protocols() -> &'static [&'static str] {
            &["file"]
        }

        fn uri(&self) -> Option<String> {
            let settings = self.1.lock().unwrap();

            // Conversion to Url already checked while building the `FileLocation`
            settings.location.as_ref().map(|location| {
                Url::from_file_path(location)
                    .expect("FileSink::get_uri couldn't build `Url` from `location`")
                    .into()
            })
        }

        fn set_uri(&self, uri: &str) -> Result<(), glib::Error> {
            // Special case for "file://" as this is used by some applications to test
            // with `gst_element_make_from_uri` if there's an element that supports the URI protocol

            if uri != "file://" {
                let file_location = FileLocation::try_from_uri_str(uri)?;
                self.set_location(Some(file_location))
            } else {
                Ok(())
            }
        }
    }

    impl ObjectImpl for TimelineSink {
        fn properties() -> &'static [glib::ParamSpec] {
            static PROPERTIES: Lazy<Vec<glib::ParamSpec>> = Lazy::new(|| {
                vec![glib::ParamSpecString::builder("location")
                    .nick("File Location")
                    .blurb("Location of the file to write")
                    .build()]
            });

            PROPERTIES.as_ref()
        }

        fn set_property(&self, _id: usize, value: &glib::Value, pspec: &glib::ParamSpec) {
            match pspec.name() {
                "location" => {
                    let res = match value.get::<Option<String>>() {
                        Ok(Some(location)) => FileLocation::try_from_path_str(location)
                            .and_then(|file_location| self.set_location(Some(file_location))),
                        Ok(None) => self.set_location(None),
                        Err(_) => unreachable!("type checked upstream"),
                    };

                    if let Err(err) = res {
                        gst::error!(CAT, imp: self, "Failed to set property `location`: {}", err);
                    }
                }
                _ => unimplemented!(),
            };
        }

        fn property(&self, _id: usize, pspec: &glib::ParamSpec) -> glib::Value {
            match pspec.name() {
                "location" => {
                    let settings = self.1.lock().unwrap();
                    let location = settings
                        .location
                        .as_ref()
                        .map(|location| location.to_string());

                    location.to_value()
                }
                _ => unimplemented!(),
            }
        }
    }

    impl GstObjectImpl for TimelineSink {}

    impl ElementImpl for TimelineSink {
        fn metadata() -> Option<&'static gst::subclass::ElementMetadata> {
            static ELEMENT_METADATA: Lazy<gst::subclass::ElementMetadata> = Lazy::new(|| {
                gst::subclass::ElementMetadata::new(
                    "TimeLineSink (rs)",
                    "Sink/Audio/Video",
                    "writes documentalist timeline to a file",
                    "twopack.gallery <packtwo@twopack.gallery>",
                )
            });

            Some(&*ELEMENT_METADATA)
        }


        fn pad_templates() -> &'static [gst::PadTemplate] {
            static PAD_TEMPLATES: Lazy<Vec<gst::PadTemplate>> = Lazy::new(|| {
                let audio_caps = gst::Caps::builder("audio/x-raw").build();
                let video_caps = gst::Caps::builder("video/x-raw").build();

                vec![
                    gst::PadTemplate::new(
                        "video_%u",
                        gst::PadDirection::Sink,
                        gst::PadPresence::Always,
                        &video_caps,
                    )
                    .unwrap(),
                    gst::PadTemplate::new(
                        "audio_%u",
                        gst::PadDirection::Sink,
                        gst::PadPresence::Always,
                        &audio_caps,
                    )
                    .unwrap(),
                ]
            });

            PAD_TEMPLATES.as_ref()
        }

        

        // fn request_new_pad(
        //         &self,
        //         templ: &gst::PadTemplate,
        //         name: Option<&str>,
        //         caps: Option<&gst::Caps>,
        //     ) -> Option<gst::Pad> {
        //     gst::debug!(CAT, imp: self, "Requesting pad {:?}", templ);

        //     templ.name()
            
        // }
    }

    impl BaseSinkImpl for TimelineSink {
        fn start(&self) -> Result<(), gst::ErrorMessage> {
            let Self(state, settings) = self;
            let mut state = state.lock().unwrap();
            if let State::Started { .. } = *state {
                unreachable!("FileSink already started");
            }

            let settings = settings.lock().unwrap();
            let location = settings.location.as_ref().ok_or_else(|| {
                gst::error_msg!(
                    gst::ResourceError::Settings,
                    ["File location is not defined"]
                )
            })?;

            let file = File::create(location).map_err(|err| {
                gst::error_msg!(
                    gst::ResourceError::OpenWrite,
                    [
                        "Could not open file {} for writing: {}",
                        location,
                        err.to_string(),
                    ]
                )
            })?;
            gst::debug!(CAT, imp: self, "Opened file {:?}", file);

            *state = State::Started {
                file,
                position: 0,
                timeline: Timeline::default(),
            };
            gst::info!(CAT, imp: self, "Started");

            Ok(())
        }
    }
}

glib::wrapper! {
    pub struct TimelineSink(ObjectSubclass<imp::TimelineSink>) @extends gst_base::BaseSink, gst::Element, gst::Object;
}
