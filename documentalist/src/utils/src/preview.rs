use crate::{
    error::{ErrorMessage, ErrorValue},
    Pipe, PipeVisitor,
};
use anyhow::Result;
use ges::prelude::*;

/// Utility for previewing clips.
/// adds autoaudiosink and autovideosink to end of the pipeline.
///
pub struct Preview;

impl Preview {
    pub fn play(self, mut pipe: Pipe) -> Result<()> {
        self.visit(&mut pipe)?;

        pipe.pipeline.set_state(gst::State::Playing)?;

        let bus = pipe
            .pipeline
            .bus()
            .expect("Pipeline without bus. Shouldn't happen!");

        for msg in bus.iter_timed(gst::ClockTime::NONE) {
            use gst::MessageView;

            match msg.view() {
                MessageView::Eos(..) => break,
                MessageView::Error(err) => {
                    pipe.pipeline
                        .set_state(gst::State::Null)
                        .expect("Unable to set the pipeline to the `Null` state");

                    match err.details() {
                        Some(details) if details.name() == "error-details" => details
                            .get::<&ErrorValue>("error")
                            .unwrap()
                            .clone()
                            .0
                            .lock()
                            .unwrap()
                            .take()
                            .map(Result::Err)
                            .expect("error-details message without actual error"),

                        _ => Err(ErrorMessage {
                            src: msg
                                .src()
                                .map(|s| s.path_string())
                                .unwrap_or_else(|| glib::GString::from("UNKNOWN")),
                            error: err.error(),
                            debug: err.debug(),
                        }
                        .into()),
                    }?;
                }
                MessageView::StateChanged(s) => {
                    println!(
                        "State changed from {:?}: {:?} -> {:?} ({:?})",
                        s.src().map(|s| s.path_string()),
                        s.old(),
                        s.current(),
                        s.pending()
                    );
                }
                MessageView::Progress(p) => {
                    println!(
                        "Progress from {:?}: {:?}",
                        p.src().map(|s| s.path_string()),
                        p.message()
                    );
                }
                MessageView::StreamStatus(s) => {
                    println!(
                        "StreamStatus from {:?}: {:?}",
                        s.src().map(|s| s.path_string()),
                        s.message()
                    );
                }
                MessageView::Application(a) => {
                    println!(
                        "Application from {:?}: {:?}",
                        a.src().map(|s| s.path_string()),
                        a.message()
                    );
                }
                _ => (),
            }
        }

        pipe.pipeline.set_state(gst::State::Null)?;

        Ok(())
    }

    /// macOS has a specific requirement that there must be a run loop running on the main thread in
    /// order to open windows and use OpenGL, and that the global NSApplication instance must be
    /// initialized.

    /// On macOS this launches the callback function on a thread.
    /// On other platforms it's just executed immediately.
    #[cfg(not(target_os = "macos"))]
    pub fn run<T, F: FnOnce() -> T + Send + 'static>(main: F) -> T
    where
        T: Send + 'static,
    {
        main()
    }

    #[cfg(target_os = "macos")]
    pub fn run<T, F: FnOnce() -> T + Send + 'static>(main: F) -> T
    where
        T: Send + 'static,
    {
        use std::thread;

        use cocoa::appkit::NSApplication;

        unsafe {
            let app = cocoa::appkit::NSApp();
            let t = thread::spawn(|| {
                let res = main();

                let app = cocoa::appkit::NSApp();
                app.stop_(cocoa::base::nil);

                // Stopping the event loop requires an actual event
                let event = cocoa::appkit::NSEvent::otherEventWithType_location_modifierFlags_timestamp_windowNumber_context_subtype_data1_data2_(
                cocoa::base::nil,
                cocoa::appkit::NSEventType::NSApplicationDefined,
                cocoa::foundation::NSPoint { x: 0.0, y: 0.0 },
                cocoa::appkit::NSEventModifierFlags::empty(),
                0.0,
                0,
                cocoa::base::nil,
                cocoa::appkit::NSEventSubtype::NSApplicationActivatedEventType,
                0,
                0,
            );
                app.postEvent_atStart_(event, cocoa::base::YES);

                res
            });

            app.run();

            t.join().unwrap()
        }
    }
}

impl PipeVisitor for Preview {
    fn visit_layer_name(&self, _: &str, pipe: &mut Pipe) -> Result<()> {
        let v_sink = gst::ElementFactory::make("autovideosink")
            .name("v_sink")
            .build()?;
        let a_sink = gst::ElementFactory::make("autoaudiosink")
            .name("a_sink")
            .build()?;
        pipe.pipeline.set_video_sink(Some(&v_sink));
        pipe.pipeline.set_audio_sink(Some(&a_sink));
        let layer = pipe.layers.get("default").unwrap();
        
        // TODO: replace with global timeoverlay
        layer.clips().iter_mut().for_each(|clip| {
        let timeoverlay =
            ges::Effect::new("timeoverlay").expect("Failed to create timeoverlay effect.");
        TimelineElementExt::set_child_property(&timeoverlay, "time-mode", &1.into()).unwrap();
            clip.add(&timeoverlay).unwrap();
        });
        
        Ok(())
    }
}
