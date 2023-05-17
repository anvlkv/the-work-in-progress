use gst::prelude::*;
use utils::{Destination, Entry, Feed, FromSrcPipe, Pipe, PipeStateManager, Preview, ToSinkPipe};

#[test]
fn it_should_play_single_entry() {
    gst::init().expect("Failed to initialize GStreamer.");

    let feed = Entry::from("tests/fixtures/short.mp4");

    let mut pipe = Pipe::default();

    pipe = feed
        .to_sink_pipe(pipe)
        .expect("Failed to create pipeline from feed.");

    assert_eq!(pipe.pipeline.children().len(), 5);

    pipe.pipeline_to_dot_file("tests/out/graphs/entry.dot")
        .expect("Failed to write dot file.");

    Preview::run(move || match Preview.play(pipe) {
        Ok(p) => {
            p.pipeline_to_dot_file("tests/out/graphs/entry-after.dot")
                .expect("Failed to write dot file.");
        }
        Err( (pipe, err)) => {
            pipe.pipeline_to_dot_file("tests/out/graphs/entry-err.dot")
                .expect("Failed to write dot file.");
            panic!("{}", err)
        }
    });
}

#[test]
fn it_should_play_feed() {
    gst::init().expect("Failed to initialize GStreamer.");

    let files = vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4"];

    let feed = Feed::new(files);

    let mut pipe = Pipe::default();

    pipe = feed
        .to_sink_pipe(pipe)
        .expect("Failed to create pipeline from feed.");

    pipe.pipeline_to_dot_file("tests/out/graphs/feed.dot")
        .expect("Failed to write dot file.");

    Preview::run(move || match Preview.play(pipe) {
        Ok(pipe) => {
            pipe.pipeline_to_dot_file("tests/out/graphs/preview-feed-after.dot")
                .expect("Failed to write dot file.");
        }
        Err((pipe, err)) => {
            pipe.pipeline_to_dot_file("tests/out/graphs/preview-feed-err.dot")
                .expect("Failed to write dot file.");
            panic!("{}", err)
        }
    });
}

#[test]
fn it_should_concat_clips() {
    gst::init().expect("Failed to initialize GStreamer.");

    let files = vec![
        "tests/fixtures/short.mp4",
        "tests/fixtures/repeat.mp4",
        "tests/fixtures/short.mp4",
        "tests/fixtures/repeat.mp4",
    ];

    let feed = Feed::new(files);

    let dest = Destination::from("tests/out/concat.mkv");
    let mut pipe = feed
        .to_sink_pipe(Pipe::default())
        .expect("Failed to create pipeline from feed.");

    pipe = dest
        .from_src_pipe(pipe)
        .expect("Failed to create pipeline from feed.");

    pipe.pipeline_to_dot_file("tests/out/graphs/concat.dot")
        .expect("Failed to write dot file.");

    Preview::run(move || {
        let state_manager = PipeStateManager::new(pipe);
        state_manager.play().expect("Failed to play pipe");
    })
}
