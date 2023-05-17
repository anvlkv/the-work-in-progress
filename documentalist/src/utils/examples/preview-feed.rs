use utils::{Feed, Pipe, Preview, ToSinkPipe};

fn main() {
    gst::init().expect("Failed to initialize GStreamer.");

    let files = vec![
        "tests/fixtures/short.mp4",
        "tests/fixtures/repeat.mp4",
        "tests/fixtures/repeat.mp4",
        // TODO!: it fails on silent videos
        // "tests/fixtures/short_silent.mp4",
    ];

    let feed = Feed::new(files);

    let mut pipe = Pipe::default();

    pipe = feed
        .to_sink_pipe(pipe)
        .expect("Failed to create pipeline from feed.");


    // pipe.pipeline_to_dot_file("examples/out/graphs/preview-feed-before.dot")
    //     .expect("Failed to write dot file.");

    Preview::run(move || match Preview.play(pipe) {
        Ok(pipe) => {
            pipe.pipeline_to_dot_file("examples/out/graphs/preview-feed-after.dot")
                .expect("Failed to write dot file.");
        }
        Err(err) => {
            // pipe.pipeline_to_dot_file("examples/out/graphs/preview-feed-err.dot")
            //     .expect("Failed to write dot file.");
            panic!("{}", err)
        }
    });
}
