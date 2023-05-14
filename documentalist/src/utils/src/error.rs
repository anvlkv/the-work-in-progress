use std::sync::{Arc, Mutex};
use anyhow::Error;
use derive_more::{Display, Error};

#[derive(Debug, Display, Error)]
#[display(fmt = "Received error from {src}: {error} (debug: {debug:?})")]
pub struct ErrorMessage {
    pub src: glib::GString,
    pub error: glib::Error,
    pub debug: Option<glib::GString>,
}

#[derive(Clone, Debug, glib::Boxed)]
#[boxed_type(name = "ErrorValue")]
pub struct ErrorValue(pub Arc<Mutex<Option<Error>>>);

#[derive(Debug, Display, Error)]
#[display(fmt = "Discoverer error {_0}")]
pub struct DiscovererError(#[error(not(source))] pub &'static str);