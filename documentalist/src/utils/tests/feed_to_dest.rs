use gst::prelude::*;
use utils::{Destination, Feed, Entry, Preview, ToSinkPipe, Pipe, FromSrcPipe};


#[test]
fn it_should_play_single_entry() {
    gst::init().expect("Failed to initialize GStreamer.");

    let feed = Entry::from("tests/fixtures/short.mp4");

    let mut pipe = Pipe::default();

    pipe = feed.to_sink_pipe(pipe).expect("Failed to create pipeline from feed.");

    assert_eq!(pipe.pipeline.children().len(), 5);

    pipe.pipeline_to_dot_file("tests/out/graphs/short.dot").expect("Failed to write dot file.");

    Preview::run(move|| {
        match Preview.play(pipe) {
            Ok(_) => (),
            Err((_, err)) => panic!("{}", err),
        }
    });
}

#[test]
fn it_should_play_feed() {
    gst::init().expect("Failed to initialize GStreamer.");

    let files = vec![
        "tests/fixtures/short.mp4",
        "tests/fixtures/short.mp4",
    ];

    let feed = Feed::new(files);

    let mut pipe = Pipe::default();

    pipe = feed
        .to_sink_pipe(pipe)
        .expect("Failed to create pipeline from feed.");

    pipe.pipeline_to_dot_file("tests/out/graphs/feed.dot").expect("Failed to write dot file.");

    Preview::run(move || match Preview.play(pipe) {
        Ok(pipe) => {
            pipe.pipeline_to_dot_file("examples/out/graphs/preview-feed-after.dot")
                .expect("Failed to write dot file.");
        }
        Err((pipe, err)) => {
            pipe.pipeline_to_dot_file("examples/out/graphs/preview-feed-err.dot")
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
    let mut pipe = feed.to_sink_pipe(Pipe::default()).expect("Failed to create pipeline from feed.");

    pipe = dest.from_src_pipe(pipe).expect("Failed to create pipeline from feed.");

    pipe.pipeline_to_dot_file("tests/out/graphs/concat.dot").expect("Failed to write dot file.");

    // let f_pipe: gst::Pipeline = feed
    //     .try_into()
    //     .expect("failed to create pipeline from feed");
    // let feed_children = f_pipe.children();
    // let src = feed_children.last().expect("failed to get src");
    // let pipeline = dest
    //     .link_pipeline(f_pipe, src)
    //     .expect("failed to link pipeline");

    // println!("{}",pipeline.debug_to_dot_data(
    //   gst::DebugGraphDetails::MEDIA_TYPE,
    // ));
    // let graph = parse(&format!(r#"{}"#, pipe)).expect("failed to parse graph");
    


    // pipeline.set_state(gst::State::Playing).expect("failed to play pipeline");

    // let bus = pipeline
    //     .bus()
    //     .expect("Pipeline without bus. Shouldn't happen!");

    // for msg in bus.iter_timed(gst::ClockTime::NONE) {
    //     use gst::MessageView;

    //     match msg.view() {
    //         MessageView::Eos(..) => break,
    //         MessageView::Error(err) => {
    //             pipeline
    //                 .set_state(gst::State::Null)
    //                 .expect("Unable to set the pipeline to the `Null` state");

    //                 println!("{}", pipeline.debug_to_dot_data(
    //                     gst::DebugGraphDetails::MEDIA_TYPE,
    //                   ));

    //             let err = match err.details() {
    //                 Some(details) if details.name() == "error-details" => details
    //                     .get::<&ErrorValue>("error")
    //                     .unwrap()
    //                     .clone()
    //                     .0
    //                     .lock()
    //                     .unwrap()
    //                     .take()
    //                     .map(anyhow::Error::from)
    //                     .expect("error-details message without actual error"),

    //                 _ => panic!(
    //                     "Message with error {:?}",
    //                     ErrorMessage {
    //                         src: msg
    //                             .src()
    //                             .map(|s| s.path_string())
    //                             .unwrap_or_else(|| glib::GString::from("UNKNOWN")),
    //                         error: err.error(),
    //                         debug: err.debug(),
    //                     }
    //                 ),
    //             };

    //             panic!("Message with error {:?}", err)
    //         }
    //         MessageView::StateChanged(s) => {
    //             println!(
    //                 "State changed from {:?}: {:?} -> {:?} ({:?})",
    //                 s.src().map(|s| s.path_string()),
    //                 s.old(),
    //                 s.current(),
    //                 s.pending()
    //             );
    //         }
    //         _ => (),
    //     }
    // }

    // pipeline
    //     .set_state(gst::State::Null)
    //     .expect("Unable to set the pipeline to the `Null` state");
}
