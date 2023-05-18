use crate::{error::DiscovererError, PipeVisitor, Pipe, as_absolute_path_uri};
use anyhow::{Error, Result};
use gst::prelude::*;
use ges::prelude::*;
use gst_pbutils::{DiscovererInfo, DiscovererStreamInfo};



/// Represents a video clip with it's start and end time.
///
/// # Examples
///
/// ```
/// use utils::{Entry, Pipe, PipeVisitor};
/// use ges::prelude::*;
///
/// ges::init().expect("Failed to initialize GES.");
/// 
/// let entry = Entry::from("tests/fixtures/short.mp4");
/// let entry = Entry::from("tests/fixtures/short.mp4#t=10,20");
/// let entry = Entry::from("tests/fixtures/short.mp4#t=10");
/// let entry = Entry::from("tests/fixtures/short.mp4#t=,10");
/// 
/// let mut pipe = Pipe::default();
/// 
/// entry.visit(&mut pipe).expect("Failed to visit pipe.");
///
/// 
/// ```
#[derive(Clone, Debug, Hash)]
pub struct Entry{
    /// The path to the video file.
    pub path: String,
    /// The start and end time of the clip.
    pub trim: (Option<u64>, Option<u64>),
    /// The GES clip
    pub clip: ges::UriClip,
}

impl Entry {
    pub fn new(path: &str, trim_start: Option<u64>, trim_end: Option<u64>) -> Self {
        let clip = ges::UriClip::new(&path).unwrap();
        let start = trim_start.map(|s| gst::ClockTime::from_useconds(s));
        let end = trim_end.map(|s| gst::ClockTime::from_useconds(s));
        if let Some(start) = start {
            clip.set_inpoint(start);
        }
        if let Some(end) = end {
            clip.set_duration(end);
        }
        Self {
            path: path.to_string(),
            trim: (trim_start, trim_end),
            clip,
        }
    }

    pub fn duration(&self) -> gst::ClockTime {
        // Retrieve the asset that was automatically used behind the scenes, to
        // extract the clip from.
        let asset = self.clip.asset().unwrap();
        let duration = asset
            .downcast::<ges::UriClipAsset>()
            .unwrap()
            .duration()
            .expect("unknown duration");
        duration
    }
    pub fn discover(&self) -> Result<DiscovererInfo> {
        let discoverer = gst_pbutils::Discoverer::new(gst::ClockTime::from_seconds(15))?;
        let path = &self.path;
        let info = discoverer.discover_uri(path)?;

        Ok(info)
    }

    pub fn print_discoverer_info(&self) -> Result<()> {
        let info = self.discover()?;

        print_discoverer_info(&info)?;

        Ok(())
    }
}

impl<'a> From<&'a str> for Entry {
    /// Creates a new entry from a path.
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the video file.
    ///
    /// parses start and end time from path
    /// e.g. /path/to/video.mp4#t=10,20
    ///                           ^ ^
    ///                      start | end
    /// e.g. /path/to/video.mp4#t=10
    ///                           ^
    ///                     start |     
    /// e.g. /path/to/video.mp4#t=,10
    ///                            ^
    ///                        end |
    ///                           
    fn from(path: &'a str) -> Self {
        let (path, trim) = {
            let mut trim = (None, None);
            let mut hash = path.split("#t=");
            let path = as_absolute_path_uri(&hash.next().unwrap());
            if let Some(time) = hash.next() {
                let mut time = time.split(",");
                let start = time
                    .next()
                    .filter(|s| !s.is_empty())
                    .map(|s| s.parse::<u64>().unwrap());
                let end = time.next().map(|s| s.parse::<u64>().unwrap());
                trim = (start, end);
            }
            (path, trim)
        };
        Self::new(
            path.as_str(),
            trim.0,
            trim.1,
        )
    }
}

impl PipeVisitor for Entry {
    fn visit_layer_name(&self, name: &str, pipe: &mut Pipe) -> Result<()> {
        let layer = pipe.layers.get(name).unwrap();
        layer.add_clip(&self.clip)?;
        Ok(())
    }
}



fn print_tags(info: &DiscovererInfo) {
    println!("Tags:");

    let tags = info.tags();
    match tags {
        Some(taglist) => {
            println!("  {taglist}"); // FIXME use an iterator
        }
        None => {
            println!("  no tags");
        }
    }
}

fn print_stream_info(stream: &DiscovererStreamInfo) {
    println!("Stream: ");
    // println!("  Stream id: {}", stream.id());
    let caps_str = match stream.caps() {
        Some(caps) => caps.to_string(),
        None => String::from("--"),
    };
    println!("  Format: {caps_str}");
}

fn print_discoverer_info(info: &DiscovererInfo) -> Result<(), Error> {
    println!("URI: {}", info.uri());
    println!("Duration: {}", info.duration().display());
    print_tags(info);
    print_stream_info(
        &info
            .stream_info()
            .ok_or(DiscovererError("Error while obtaining stream info"))?,
    );

    let children = info.stream_list();
    println!("Children streams:");
    for child in children {
        print_stream_info(&child);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_should_create_entry_from_path() {
        ges::init().expect("Failed to initialize GES.");

        let entry = Entry::from("tests/fixtures/short.mp4");

        assert_eq!(entry.path, as_absolute_path_uri("tests/fixtures/short.mp4"));

        let entry = Entry::from("tests/fixtures/short.mp4#t=10,20");

        assert_eq!(entry.trim, (Some(10), Some(20)));

        let entry = Entry::from("tests/fixtures/short.mp4#t=10");

        assert_eq!(entry.trim, (Some(10), None));

        let entry = Entry::from("tests/fixtures/short.mp4#t=,10");

        assert_eq!(entry.trim, (None, Some(10)));
    }

    #[test]
    fn it_should_visit_pipe() {
        ges::init().expect("Failed to initialize GES.");

        let entry = Entry::from("tests/fixtures/short.mp4");

        let mut pipe = Pipe::default();

        entry
            .visit(&mut pipe)
            .expect("Failed to visit pipe.");

        assert_eq!(pipe.pipeline.children().len(), 2);
        assert_eq!(pipe.layers.len(), 1);
        let default_layer = pipe.layers.get("default").unwrap();
        assert_eq!(default_layer.clips().len(), 1);

    }

    #[test]
    fn it_should_get_duration(){
        ges::init().expect("Failed to initialize GES.");

        let entry = Entry::from("tests/fixtures/short.mp4");

        assert_eq!(entry.duration(), gst::ClockTime::from_useconds(3000000));
    }

    // #[test]
    // fn it_should_print_discoverer_info() {

    //     let entry = Entry::from("tests/fixtures/short.mp4");

    //     entry
    //         .print_discoverer_info()
    //         .expect("Failed to print discoverer info.");

    // }
}
