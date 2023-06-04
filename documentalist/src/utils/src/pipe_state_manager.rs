use crate::Pipe;
use ges::prelude::*;
use anyhow::Result;

/// Manages the state of a pipeline.
///
pub struct PipeStateManager<'a>(&'a Pipe);

impl<'a> PipeStateManager<'a> {
    pub fn new(pipeline: &'a Pipe) -> Self {
        Self(pipeline)
    }

    pub fn play(self) -> Result<()> {
        let pipe = &self.0;
        pipe.pipeline.set_state(gst::State::Playing)?;
        use gst::MessageView;
        let bus = pipe
            .pipeline
            .bus()
            .expect("Pipeline without bus. Shouldn't happen!");
        for msg in bus.iter_timed(gst::ClockTime::NONE) {
            match msg.view() {
                MessageView::Eos(..) => {
                    // pipeline.pipeline.set_state(gst::State::Null).expect("Unable to set the pipeline to the `Null` state");
                    break;
                }
                MessageView::Error(err) => {
                    // pipeline.pipeline.set_state(gst::State::Null).expect("Unable to set the pipeline to the `Null` state");
                    // self.0.pipeline_to_dot_file("tests/out/graphs/play-err.dot")
                    //     .expect("Failed to write dot file.");
                    panic!(
                        "Error from {:?}: {:?}",
                        err.src().map(|s| s.path_string()),
                        err.error()
                    );
                }
                _ => {}
            }
        }
        pipe.pipeline.set_state(gst::State::Null)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_pipe_state_manager() {
        ges::init().expect("Failed to initialize GStreamer.");

        let pipe = Pipe::default();
        let _ = PipeStateManager::new(&pipe);
    }
}
