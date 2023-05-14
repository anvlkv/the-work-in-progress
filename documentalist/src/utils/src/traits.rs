use anyhow::{Result};
use crate::Pipe;

/// Allows linking a pipeline to a destination.
pub trait FromSrcPipe{
  /// Links a pipeline to a destination.
  /// `pipeline`->`self`
  /// 
  /// # Arguments
  /// 
  /// * `pipeline` - The pipeline to link to the destination.
  /// 
  /// # Returns
  /// 
  /// The pipeline with the destination linked.
  /// 
  fn from_src_pipe(self, pipeline: Pipe) -> Result<Pipe>;
}

/// Allows linking a source to a pipeline.
pub trait ToSinkPipe{
  /// Links a source to a pipeline.
  /// `self`->`pipeline`
  /// 
  /// # Arguments
  /// 
  /// * `pipeline` - The pipeline to link the source to.
  /// 
  /// # Returns
  /// 
  /// The pipeline with the source linked.
  /// 
  fn to_sink_pipe(self, pipeline: Pipe) -> Result<Pipe>;
}