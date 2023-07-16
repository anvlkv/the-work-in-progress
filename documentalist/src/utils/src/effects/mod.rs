use std::sync::Mutex;

use crate::{OptionalContinuous, Pipe, TimelineElement};
use anyhow::{Error, Result};
use serde_yaml::Value;

mod tc;
mod trim;
mod vol;

pub use tc::*;
pub use trim::*;
pub use vol::*;

pub trait Effect<T: TimelineElement>: OptionalContinuous {
    fn apply(&self, clip: &mut T, pipe: &mut Pipe, layer_name: &str) -> Result<()>;

    fn spill_over_effect(&self) -> Option<Box<dyn Effect<T>>> {
        None
    }

    fn tok(&self) -> &str;
}

pub trait EffectParser<T: TimelineElement>
where
    Self: Effect<T>,
{
    fn can_parse(yaml: &Value) -> bool;
    fn parse(yaml: &Value, timestamp: &gst::ClockTime) -> Self;
}

pub struct TimedEffects<T: TimelineElement>(pub Mutex<Vec<Box<dyn Effect<T>>>>);

impl<T: TimelineElement> Default for TimedEffects<T> {
    fn default() -> Self {
        TimedEffects(Mutex::default())
    }
}

impl<T: TimelineElement> TimedEffects<T> {
    pub fn apply(&self, clip: &mut T, pipe: &mut Pipe, layer_name: &str) -> Result<()> {
        for effect in self.0.lock().unwrap().iter() {
            effect.apply(clip, pipe, layer_name)?;
        }
        Ok(())
    }

    pub fn extend(&mut self, other: TimedEffects<T>) {
        self.0.lock().unwrap().extend(other.0.into_inner().unwrap());
    }

    pub fn add(&mut self, effect: Box<dyn Effect<T>>) {
        self.0.lock().unwrap().push(effect);
    }

    pub fn prepend(&mut self, other: TimedEffects<T>) {
        let mut next_effects = vec![];
        let mut other_effects = other.0.into_inner().unwrap().into_iter();

        while let Some(mut ef) = other_effects.next() {
            let effects = self.0.lock().unwrap();
            let following_effect = effects.iter().find(|e| e.tok() == ef.tok());
            ef.set_duration(following_effect.map(|e| e.start()));

            next_effects.push(ef);
        }
        if !next_effects.is_empty() {
            self.0.get_mut().unwrap().splice(0..0, next_effects);
        }
    }

    pub fn is_timestamp(yaml: &Value) -> bool {
        let re = regex::Regex::new(r"(\d\d:)?(\d\d:)?\d\d(\.\d+)?").unwrap();
        match yaml {
            Value::String(s) => re.is_match(s),
            Value::Number(_) => true,
            _ => false,
        }
    }

    pub fn parse_timestamp(yaml: &Value) -> Result<gst::ClockTime> {
        let ts = match yaml {
            Value::String(s) => s.clone(),
            Value::Number(n) => {
                if n.is_f64() {
                    n.as_f64().unwrap().to_string()
                } else if n.is_u64() {
                    n.as_u64().unwrap().to_string()
                } else {
                    return Err(Error::msg("expected timestamp"));
                }
            }
            _ => {
                return Err(Error::msg("expected timestamp"));
            }
        };
        let mut parts = ts.split(":").collect::<Vec<&str>>();
        parts.reverse();
        let (s_ns, m, h) = (parts.get(0), parts.get(1), parts.get(2));

        let s_parts = s_ns.unwrap_or(&"0").split(".").collect::<Vec<&str>>();
        let (s, m_ns) = (s_parts.get(0), s_parts.get(1));

        let ns = m_ns.map(|m_ns| {
            let ns = m_ns
                .chars()
                .take(9)
                .skip_while(|ch| ch.to_string() == "0")
                .collect::<String>();
            let padded = m_ns.chars().take_while(|ch| ch.to_string() == "0").count();

            format!(
                "{}{}",
                ns,
                "00000000"
                    .chars()
                    .take(9 - padded - ns.len())
                    .collect::<String>()
            )
        });

        let mut ts = gst::ClockTime::default();
        if let Some(h) = h {
            ts += gst::ClockTime::from_seconds(
                h.parse::<u64>().expect(&format!("failed to parse [{}]", h)) * 60 * 60,
            );
        }
        if let Some(m) = m {
            ts += gst::ClockTime::from_seconds(
                m.parse::<u64>().expect(&format!("failed to parse [{}]", m)) * 60,
            );
        }
        if let Some(s) = s {
            ts += gst::ClockTime::from_seconds(
                s.parse::<u64>().expect(&format!("failed to parse [{}]", s)),
            );
        }

        if let Some(ns) = ns {
            ts += gst::ClockTime::from_nseconds(
                ns.parse::<u64>()
                    .expect(&format!("failed to parse [{}]", ns)),
            );
        }

        Ok(ts)
    }
}
