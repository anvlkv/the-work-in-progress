use utils::{Feed, Pipe, Preview, PipeVisitor};

/// preview Feed from path

fn main() {
  ges::init().expect("Failed to initialize GStreamer.");
  
  
  Preview::run(move || {
    let mut feed = Feed::new(vec!["tests/fixtures/short.mp4#t=10000,3000000", "tests/fixtures/repeat.mp4"]);
  
    let mut pipe = Pipe::default();
  
    feed
      .visit(&mut pipe)
      .expect("Failed to visit pipe.");

    Preview.play(pipe).unwrap();
  });
}