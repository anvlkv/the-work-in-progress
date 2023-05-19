use std::collections::HashMap;

use ges::prelude::*;

use anyhow::Result;

/// Represents a GStreamer Editing Services (GES) pipeline.
#[derive(Debug)]
pub struct Pipe {
    pub pipeline: ges::Pipeline,
    pub layers: HashMap<String, ges::Layer>,
    pub tracks: (Option<ges::AudioTrack>, Option<ges::VideoTrack>),
}

impl Pipe {
    pub fn new() -> Result<Self> {
        // Begin by creating a timeline with audio and video tracks
        let timeline = ges::Timeline::new_audio_video();
        // Create a new layer that will contain our timed clips.
        let default_layer = timeline.append_layer();

        let pipeline = ges::Pipeline::new();
        pipeline.set_timeline(&timeline)?;
        let mut layers = HashMap::new();
        layers.insert("default".to_string(), default_layer);
        let tracks = {
            let audio_track = timeline
                .tracks()
                .into_iter()
                .find(|track| track.track_type() == ges::TrackType::AUDIO)
                .map(|track| track.downcast::<ges::AudioTrack>().unwrap());
            let video_track = timeline
                .tracks()
                .into_iter()
                .find(|track| track.track_type() == ges::TrackType::VIDEO)
                .map(|track| track.downcast::<ges::VideoTrack>().unwrap());
            (audio_track, video_track)
        };

        Ok(Self {
            pipeline,
            layers,
            tracks,
        })
    }

    pub fn pipeline_to_dot_file(&self, path: &str) -> anyhow::Result<()> {
        let dot_data = self
            .pipeline
            .debug_to_dot_data(gst::DebugGraphDetails::all());
        let mut file = std::fs::File::create(path)?;
        std::io::Write::write_all(&mut file, dot_data.as_bytes())?;

        Ok(())
    }

    pub fn add_layer(&mut self, name: &str) -> Result<&mut ges::Layer> {
        let layer = self.pipeline.timeline().unwrap().append_layer();
        self.layers.insert(name.to_string(), layer);

        Ok(self.layers.get_mut(name).unwrap())
    }
}

pub trait PipeVisitor {
    fn visit_layer_name(&self, name: &str, pipe: &mut Pipe) -> Result<()>;

    fn visit(&self, pipe: &mut Pipe) -> Result<()> {
        self.visit_layer_name("default", pipe)
    }
}

impl Into<ges::Pipeline> for Pipe {
    fn into(self) -> ges::Pipeline {
        self.pipeline
    }
}

impl Default for Pipe {
    fn default() -> Self {
        Self::new().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_pipeline() {
        gst::init().expect("Failed to initialize GStreamer.");
        ges::init().expect("Failed to initialize GES.");

        let pipe = Pipe::new().expect("Failed to create pipeline.");

        assert_eq!(pipe.pipeline.children().len(), 2);
        assert_eq!(pipe.layers.len(), 1);
        assert!(pipe.tracks.0.is_some());
        assert!(pipe.tracks.1.is_some());

        pipe.pipeline_to_dot_file("tests/out/graphs/pipe.dot")
            .expect("Failed to write dot file.");
    }
}
