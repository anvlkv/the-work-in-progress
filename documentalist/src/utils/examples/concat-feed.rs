use utils::{Destination, Feed, FromSrcPipe, Pipe, PipeStateManager, Preview, ToSinkPipe};

fn main() {
    gst::init().expect("Failed to initialize GStreamer.");

    let files = vec![
        "tests/fixtures/short.mp4",
        "tests/fixtures/repeat.mp4",
    ];

    let feed = Feed::new(files);

    let dest = Destination::from("examples/out/concat.mp4");
    let mut pipe = feed
        .to_sink_pipe(Pipe::default())
        .expect("Failed to create pipeline from feed.");

    pipe = dest
        .from_src_pipe(pipe)
        .expect("Failed to create pipeline from feed.");

    pipe.debug_to_dot_file("examples/out/graphs/concat.dot")
        .expect("Failed to write dot file.");

    Preview::run(move || {
        let state_manager = PipeStateManager::new(pipe);
        let p = state_manager.play().expect("Failed to play pipe");
        p.debug_to_dot_file("examples/out/graphs/concat-after.dot")
            .expect("Failed to write dot file.");
    })
}
