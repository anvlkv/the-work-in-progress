use ges::prelude::*;
use utils::{as_absolute_path_uri, Destination, Feed, Pipe, PipeStateManager, PipeVisitor};

/// concatenate the contents of two feeds

fn main() {
    ges::init().expect("Failed to initialize GStreamer.");

    let mut feed_1 = Feed::new(vec![
        "tests/fixtures/short.mp4#t=10000,3000000",
        "tests/fixtures/repeat.mp4",
    ]);
    let mut feed_2 = Feed::new(vec![
        "tests/fixtures/repeat.mp4#t=10000,3000000",
        "tests/fixtures/long.mp4#t=10000,300000000",
        "tests/fixtures/short_silent.mp4",
    ]);
    let mut pipe = Pipe::default();

    feed_1.visit(&mut pipe).expect("Failed to visit pipe.");

    feed_2.visit(&mut pipe).expect("Failed to visit pipe.");

    let mut dest = Destination::from("examples/out/concat.mp4");
    dest.visit(&mut pipe).expect("Failed to visit pipe.");

    PipeStateManager::new(&pipe)
        .play()
        .expect("Failed to play pipe.");

    pipe.pipeline_to_dot_file("examples/out/graphs/concat.dot")
        .expect("Failed to write dot file.");

    // save timeline to file

    let timeline = pipe
        .pipeline
        .timeline()
        .expect("Failed to get timeline from pipeline.");

    let formatter = ges::Formatter::default();
    timeline
        .save_to_uri(
            &as_absolute_path_uri("examples/out/concat.xml"),
            Some(&formatter),
            true,
        )
        .expect("Failed to save timeline to file.");
}
