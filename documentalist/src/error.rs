#[derive(Debug)]
pub enum Error {
  Ffmpeg(ffmpeg::Error),
}

impl From<ffmpeg::Error> for Error {
  fn from(err: ffmpeg::Error) -> Self {
    Self::Ffmpeg(err)
  }
}