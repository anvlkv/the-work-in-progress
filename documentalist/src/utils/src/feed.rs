use anyhow::Result;
use crate::{Pipe, PipeVisitor, Entry};
use ges::prelude::*;

/// Represents a feed of entries.
///
/// # Examples
///
/// ```
/// use utils::{Feed, Pipe, PipeVisitor};
/// use ges::prelude::*;
/// 
/// ges::init().expect("Failed to initialize GES.");
/// 
/// let feed = Feed::new(vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4#t=10,20"]);
/// 
/// let mut pipe = Pipe::default();
/// 
/// feed.visit(&mut pipe).expect("Failed to visit pipe.");
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
}

impl PipeVisitor for Feed {
    fn visit_layer_name(&self, name: &str, pipe: &mut Pipe) -> Result<()> {
        let mut duration = pipe.layers.get(name).unwrap().duration().clone();
        for entry in &self.0 {
            entry.clip.set_start(duration);
            let entry_duration = entry.clip.duration();
            duration += entry_duration;
            entry.visit_layer_name(name, pipe)?;
        }

        Ok(())
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_feed() {
        ges::init().expect("Failed to initialize GStreamer.");
        
        let feed = Feed::new(vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4#t=10,20"]);
        assert_eq!(feed.0.len(), 2);
    }

    #[test]
    fn it_should_visit_pipe() {
        ges::init().expect("Failed to initialize GStreamer.");

        let mut pipe = Pipe::default();
        let feed = Feed::new(vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4#t=10,20"]);
        feed.visit(&mut pipe).expect("Failed to visit pipe.");

        let clips = pipe.layers.get("default").unwrap().clips();

        assert_eq!(clips.len(), 2);

        let clip_0 = clips.get(0).unwrap();

        assert_eq!(clip_0.start(), gst::ClockTime::from_useconds(0));

        let clip_1 = clips.get(1).unwrap();

        assert_eq!(clip_1.inpoint(), gst::ClockTime::from_useconds(10));
        assert_eq!(clip_1.start(), clip_0.duration());
        assert_eq!(clip_1.duration(), gst::ClockTime::from_useconds(20));

    }
}
