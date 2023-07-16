use super::{Effect, EffectParser};
use crate::{Anchored, Continuous, Entry, OptionalContinuous, Pipe};
use anyhow::Result;
use ges::prelude::*;

#[derive(Clone, Copy)]
pub enum TrimEffect {
    Start(gst::ClockTime, Option<gst::ClockTime>),
    End(gst::ClockTime, Option<gst::ClockTime>),
}

impl Anchored for TrimEffect {
    fn start(&self) -> gst::ClockTime {
        match self {
            TrimEffect::Start(start, _) => *start,
            TrimEffect::End(end, _) => *end,
        }
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        match self {
            TrimEffect::Start(s, _) => *s = start,
            TrimEffect::End(e, _) => *e = start,
        }
    }
}

impl OptionalContinuous for TrimEffect {
    fn duration(&self) -> Option<gst::ClockTime> {
        match self {
            TrimEffect::Start(_, duration) => *duration,
            TrimEffect::End(_, duration) => *duration,
        }
    }
    fn set_duration(&mut self, duration: Option<gst::ClockTime>) {
        match self {
            TrimEffect::Start(_, d) => *d = duration,
            TrimEffect::End(_, d) => *d = duration,
        }
    }
    fn set_inpoint(&mut self, inpoint: Option<gst::ClockTime>) {
        match self {
            TrimEffect::Start(start, _) => *start = inpoint.unwrap(),
            TrimEffect::End(end, _) => *end = inpoint.unwrap(),
        }
    }
}

impl EffectParser<Entry> for TrimEffect {
    fn can_parse(yaml: &serde_yaml::Value) -> bool {
        if let serde_yaml::Value::Mapping(m) = yaml {
            if m.len() == 1 {
                if let Some((k, v)) = m.iter().next() {
                    if let serde_yaml::Value::String(s) = k {
                        if s == "trim" {
                            if let serde_yaml::Value::String(s) = v {
                                if s == "start" || s == "end" {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }

        false
    }

    fn parse(yaml: &serde_yaml::Value, timestamp: &gst::ClockTime) -> Self {
        let (_, trim) = yaml.as_mapping().unwrap().iter().next().unwrap();
        let trim = trim.as_str().unwrap();
        match trim {
            "start" => TrimEffect::Start(*timestamp, None),
            "end" => TrimEffect::End(*timestamp, None),
            _ => panic!("invalid trim effect"),
        }
    }
}

impl Effect<Entry> for TrimEffect {
    fn apply(&self, entry: &mut Entry, pipe: &mut Pipe, layer_name: &str) -> Result<()> {
        match self {
            TrimEffect::Start(start, re_entry) => {
                entry.set_inpoint(*start);
            }
            TrimEffect::End(end, re_entry) => {
                entry.set_duration(*end - entry.clip.inpoint());
            }
        }
        Ok(())
    }

    fn tok(&self) -> &str {
        match self {
            TrimEffect::Start(_, _) => "trim-start",
            TrimEffect::End(_, _) => "trim-end",
        }
    }
}
