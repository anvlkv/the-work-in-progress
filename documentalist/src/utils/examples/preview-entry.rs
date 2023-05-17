use utils::{Entry, Pipe, Preview, ToSinkPipe};

fn main() {
    gst::init().expect("Failed to initialize GStreamer.");

    let entry = Entry::from("tests/fixtures/short.mp4");

    let mut pipe = Pipe::default();

    pipe = entry
        .to_sink_pipe(pipe)
        .expect("Failed to create pipeline from entry.");


    pipe.pipeline_to_dot_file("examples/out/graphs/preview-entry-before.dot")
        .expect("Failed to write dot file.");

    Preview::run(move || match Preview.play(pipe) {
        Ok(pipe) => {
            pipe.pipeline_to_dot_file("examples/out/graphs/preview-entry-after.dot")
                .expect("Failed to write dot file.");
        }
        Err(err) => {
            // pipe.pipeline_to_dot_file("examples/out/graphs/preview-entry-err.dot")
            //     .expect("Failed to write dot file.");
            panic!("{}", err)
        }
    });
}
