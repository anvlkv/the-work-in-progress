use crate::Pipe;
use gst::prelude::*;

/// Manages the state of a pipeline.
///
pub struct PipeStateManager(Pipe);

impl PipeStateManager {
    pub fn new(pipeline: Pipe) -> Self {
        Self(pipeline)
    }

    pub fn play(self) -> Result<Pipe, anyhow::Error> {
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
                _ => println!("Message {:?}", msg),
            }
        }
        pipe.pipeline.set_state(gst::State::Null)?;
        Ok(self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_pipe_state_manager() {
        gst::init().expect("Failed to initialize GStreamer.");

        let pipe = Pipe::default();
        let _ = PipeStateManager::new(pipe);
    }

    // #[test]
    // fn it_should_play_and_pause_a_pipe() {
    //     gst::init().expect("Failed to initialize GStreamer.");

    //     let pipe = Pipe::default();
    //     let psm = PipeStateManager::new(pipe);
    //     // psm.play().expect("Failed to play pipe");
    // }
}
