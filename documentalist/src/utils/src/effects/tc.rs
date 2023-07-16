use super::{Effect, EffectParser};
use crate::{Anchored, Entry, Pipe, OptionalContinuous};
use anyhow::Result;

#[derive(Clone, Copy)]
pub struct TimeCompressionEffect(pub f64, pub gst::ClockTime, pub Option<gst::ClockTime>);

impl Anchored for TimeCompressionEffect {
    fn start(&self) -> gst::ClockTime {
        self.1
    }
    fn set_start(&mut self, start: gst::ClockTime) {
        self.1 = start;
    }
}

impl OptionalContinuous for TimeCompressionEffect {
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

impl EffectParser<Entry> for TimeCompressionEffect {
    fn can_parse(yaml: &serde_yaml::Value) -> bool {
        if let serde_yaml::Value::Mapping(m) = yaml {
            if m.len() == 1 {
                if let Some((k, v)) = m.iter().next() {
                    if let serde_yaml::Value::String(s) = k {
                        if s == "tc" {
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
            TimeCompressionEffect(vol.as_f64().unwrap(), *timestamp, None)
        } else if vol.is_u64() {
            TimeCompressionEffect(vol.as_u64().unwrap() as f64, *timestamp, None)
        } else if vol.is_i64() {
            TimeCompressionEffect(vol.as_i64().unwrap().abs() as f64, *timestamp, None)
        } else {
            panic!("invalid tc effect");
        }
    }
}

impl Effect<Entry> for TimeCompressionEffect {
    fn apply(&self, entry: &mut Entry, pipe: &mut Pipe, layer_name: &str) -> Result<()> {
        
        Ok(())
    }

    fn spill_over_effect(&self) -> Option<Box<dyn Effect<Entry>>> {
        if self.2.is_none() {
            Some(Box::new(TimeCompressionEffect(self.0, gst::ClockTime::default(), None)))
        }
        else {
            None
        }
    }

    fn tok(&self) -> &str {
        "tc"
    }
}
