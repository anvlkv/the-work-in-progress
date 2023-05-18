use utils::{Destination, Feed, Pipe, PipeVisitor, PipeStateManager};

/// concatenate the contents of two feeds

fn main() {
    ges::init().expect("Failed to initialize GStreamer.");

    let feed_1 = Feed::new(vec![
        "tests/fixtures/short.mp4#t=10000,3000000",
        "tests/fixtures/repeat.mp4",
    ]);
    let feed_2 = Feed::new(vec![
        "tests/fixtures/repeat.mp4#t=10000,3000000",
        "tests/fixtures/short_silent.mp4",
    ]);
    let mut pipe = Pipe::default();

    feed_1.visit(&mut pipe).expect("Failed to visit pipe.");

    feed_2.visit(&mut pipe).expect("Failed to visit pipe.");

    let dest = Destination::from("examples/out/concat.mp4");
    dest.visit(&mut pipe).expect("Failed to visit pipe.");

    PipeStateManager::new(pipe).play().expect("Failed to play pipe.");
}
