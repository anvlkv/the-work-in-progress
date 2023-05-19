pub mod error;
mod pipe;
mod entry;
mod feed;
mod preview;
mod destination;
mod pipe_state_manager;
mod timeline;

pub use entry::{Entry};
pub use pipe::{Pipe, PipeVisitor};
pub use feed::{Feed};
pub use preview::{Preview};
pub use destination::{Destination};
pub use pipe_state_manager::{PipeStateManager};

pub fn as_absolute_path_uri(path: &str) -> String {
  use path_absolutize::*;
  let path = std::path::Path::new(path);
  let absolute_path = path.absolutize().unwrap();
  format!("file://{}", absolute_path.to_str().unwrap())
}