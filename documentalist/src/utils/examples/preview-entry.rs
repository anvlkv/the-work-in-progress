use utils::{Entry, Pipe, Preview, PipeVisitor};

/// preview Entry from path

fn main() {
  ges::init().expect("Failed to initialize GStreamer.");
  
  
  Preview::run(move || {
    let entry = Entry::from("tests/fixtures/short.mp4");
  
    let mut pipe = Pipe::default();
  
    entry
      .visit(&mut pipe)
      .expect("Failed to visit pipe.");
    Preview.play(pipe).unwrap();
  });
}