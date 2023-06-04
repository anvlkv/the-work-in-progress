pub mod error;
mod pipe;
mod entry;
mod feed;
mod preview;
mod destination;
mod pipe_state_manager;
mod project;
mod effects;

pub use entry::*;
pub use pipe::*;
pub use feed::*;
pub use preview::*;
pub use destination::*;
pub use pipe_state_manager::*;
pub use project::*;
pub use effects::*;

pub fn as_absolute_path_uri(path: &str) -> String {
  use path_absolutize::*;
  let path = std::path::Path::new(path);
  let absolute_path = path.absolutize().unwrap();
  format!("file://{}", absolute_path.to_str().unwrap())
}

