use super::{Effect, EffectParser};
use crate::{Anchored, Entry, Pipe};
use anyhow::Result;
use ges::{prelude::*, gst};
// use std::collections::HashMap;

#[derive(Clone, Copy)]
pub struct VolumeEffect(pub f64, pub gst::ClockTime);

impl Anchored for VolumeEffect {
    fn start(&self) -> gst::ClockTime {
        self.1
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        self.1 = start;
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
            VolumeEffect(vol.as_f64().unwrap(), *timestamp)
        } else if vol.is_u64() {
            VolumeEffect(vol.as_u64().unwrap() as f64, *timestamp)
        } else if vol.is_i64() {
            VolumeEffect(vol.as_i64().unwrap().abs() as f64, *timestamp)
        } else {
            panic!("invalid vol effect");
        }
    }
}

impl Effect<Entry> for VolumeEffect {
    fn apply(&self, entry: &mut Entry, pipe: &mut Pipe) -> Result<()> {
        let props = gst::Structure::builder("volume_props")
            .field("volume", self.0)
            .build();
        pipe.effects_bin.add_anchored_effect("volume", self.start(),  props);
        Ok(())
    }
}
