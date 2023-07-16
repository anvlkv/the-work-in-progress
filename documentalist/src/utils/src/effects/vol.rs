use super::{Effect, EffectParser};
use crate::{Anchored, OptionalContinuous, Entry, Pipe};
use anyhow::Result;
use ges::{prelude::*, gst};
// use std::collections::HashMap;

#[derive(Clone, Copy)]
pub struct VolumeEffect(pub f64, pub gst::ClockTime, pub Option<gst::ClockTime>);

impl Anchored for VolumeEffect {
    fn start(&self) -> gst::ClockTime {
        self.1
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        self.1 = start;
    }
}

impl OptionalContinuous for VolumeEffect {
    fn duration(&self) -> Option<gst::ClockTime> {
        self.2
    }
    fn set_duration(&mut self, end: Option<gst::ClockTime>) {
        self.2 = end;
    }
    fn set_inpoint(&mut self, inpoint: Option<gst::ClockTime>) {
        self.1 = inpoint.unwrap();
    }
}

impl EffectParser<Entry> for VolumeEffect {
    fn can_parse(yaml: &serde_yaml::Value) -> bool {
        if let serde_yaml::Value::Mapping(m) = yaml {
            if m.len() == 1 {
                if let Some((k, v)) = m.iter().next() {
                    if let serde_yaml::Value::String(s) = k {
                        if s == "vol" {
                            if let serde_yaml::Value::Number(_) = v {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        false
    }

    fn parse(yaml: &serde_yaml::Value, timestamp: &gst::ClockTime) -> Self {
        let (_, vol) = yaml.as_mapping().unwrap().iter().next().unwrap();
        if vol.is_f64() {
            VolumeEffect(vol.as_f64().unwrap(), *timestamp, None)
        } else if vol.is_u64() {
            VolumeEffect(vol.as_u64().unwrap() as f64, *timestamp, None)
        } else if vol.is_i64() {
            VolumeEffect(vol.as_i64().unwrap().abs() as f64, *timestamp, None)
        } else {
            panic!("invalid vol effect");
        }
    }
}

impl Effect<Entry> for VolumeEffect {
    fn apply(&self, entry: &mut Entry, _: &mut Pipe, _: &str) -> Result<()> {
        let ef =ges::Effect::new(&format!("volume volume={}", self.0))?;
        ef.set_start(self.1);
        if let Some(end) = self.2 {
            ef.set_duration(end - self.1);
        }
        entry.clip.add(&ef)?;
        Ok(())
    }

    fn spill_over_effect(&self) -> Option<Box<dyn Effect<Entry>>> {
        if self.2.is_none() {
            Some(Box::new(VolumeEffect(self.0, gst::ClockTime::default(), None)))
        }
        else {
            None
        }
    }

    fn tok(&self) -> &str {
        "vol"
    }
}
