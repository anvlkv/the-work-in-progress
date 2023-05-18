use ges::prelude::*;
use utils::{Destination, Entry, Feed, Pipe, PipeStateManager, PipeVisitor, Preview};

#[test]
fn it_should_play_single_entry() {
    ges::init().expect("Failed to initialize GES.");
    Preview::run(move || {
        let feed = Entry::from("tests/fixtures/short.mp4");

        let mut pipe = Pipe::default();

        feed.visit(&mut pipe)
            .expect("Failed to create pipeline from feed.");

        pipe.pipeline_to_dot_file("tests/out/graphs/entry.dot")
            .expect("Failed to write dot file.");

        match Preview.play(pipe) {
            Ok(_) => {}
            Err(err) => {
                panic!("{}", err)
            }
        };
    });
}

#[test]
fn it_should_play_feed() {
    ges::init().expect("Failed to initialize GES.");
    Preview::run(move || {
        let files = vec!["tests/fixtures/short.mp4", "tests/fixtures/short.mp4"];

        let feed = Feed::new(files);

        let mut pipe = Pipe::default();

        feed.visit(&mut pipe)
            .expect("Failed to create pipeline from feed.");

        pipe.pipeline_to_dot_file("tests/out/graphs/feed.dot")
            .expect("Failed to write dot file.");

        match Preview.play(pipe) {
            Ok(_) => {}
            Err(err) => {
                panic!("{}", err)
            }
        };
    });
}

#[test]
fn it_should_concat_clips() {
    ges::init().expect("Failed to initialize GES.");
    Preview::run(move || {
        let files = vec![
            "tests/fixtures/short.mp4",
            "tests/fixtures/repeat.mp4",
            "tests/fixtures/short.mp4",
            "tests/fixtures/repeat.mp4",
        ];

        let feed = Feed::new(files);

        let dest = Destination::from("tests/out/concat.mkv");
        let mut pipe = Pipe::default();
        feed.visit(&mut pipe)
            .expect("Failed to create pipeline from feed.");

        dest.visit(&mut pipe)
            .expect("Failed to create pipeline from feed.");

        pipe.pipeline_to_dot_file("tests/out/graphs/concat.dot")
            .expect("Failed to write dot file.");

        let state_manager = PipeStateManager::new(pipe);
        state_manager.play().expect("Failed to play pipe");
    })
}
