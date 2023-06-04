use super::{Effect, EffectParser };
use crate::{Entry, Pipe, Anchored, Continuous};
use anyhow::Result;
use ges::prelude::*;

#[derive(Clone, Copy)]
pub enum TrimEffect {
    Start(gst::ClockTime),
    End(gst::ClockTime),
}

impl Anchored for TrimEffect {
    fn start(&self) -> gst::ClockTime {
        match self {
            TrimEffect::Start(start) => *start,
            TrimEffect::End(end) => *end,
        }
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        match self {
            TrimEffect::Start(s) => *s = start,
            TrimEffect::End(e) => *e = start,
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
        let (_,trim) = yaml.as_mapping().unwrap().iter().next().unwrap();
        let trim = trim.as_str().unwrap();
        match trim {
            "start" => TrimEffect::Start(*timestamp),
            "end" => TrimEffect::End(*timestamp),
            _ => panic!("invalid trim effect"),
        }
    }
}

impl Effect<Entry> for TrimEffect{
    fn apply(&self, entry: &mut Entry, _pipe: &mut Pipe) -> Result<()> {
        match self {
            TrimEffect::Start(start) => {
                entry.set_inpoint(*start);
            }
            TrimEffect::End(end) => {
                entry.set_duration(*end - entry.clip.inpoint());
            }
        }
        Ok(())
    }
  }

