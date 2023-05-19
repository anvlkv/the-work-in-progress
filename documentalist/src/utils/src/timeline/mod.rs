use std::collections::HashMap;

use serde::{de::DeserializeOwned, Deserialize};

mod file_location;
pub mod sink;

#[derive(Debug)]
pub enum TimelineMarker {
    TimeCompression(f64),
    Volume(f64),
    Trim(bool),
    Source(String, String),
}

#[derive(Debug, Default)]
pub struct Timeline {
    /// running timestamps of video frames in µseconds
    pub base: Vec<u64>,
    /// original timestamps
    pub original: Vec<u64>,
    /// markers for some frames
    pub markers: HashMap<u64, Vec<TimelineMarker>>,
}

impl<'de> Deserialize<'de> for Timeline {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let mut timeline = Timeline::default();
        let yaml = serde_yaml::Value::deserialize(deserializer)?;
        match yaml {
            serde_yaml::Value::Sequence(s) => {
                for source in s {
                    match source {
                        serde_yaml::Value::Mapping(m) => {
                            assert_eq!(m.len(), 1);
                            let (key, value) = m.iter().next().unwrap();
                            let source_type_name = key.as_str().unwrap();
                            match value {
                                serde_yaml::Value::Mapping(m) => {
                                    for (src, timestamps) in m {
                                        let src_arg = src.as_str().unwrap();
                                        timeline.markers.insert(
                                            timeline.markers.keys().last().map_or(0, |m| m + 1),
                                            vec![TimelineMarker::Source(
                                                source_type_name.to_string(),
                                                src_arg.to_string(),
                                            )],
                                        );
                                        match timestamps {
                                            serde_yaml::Value::Mapping(timestamps) => {
                                                for (timestamp, markers) in timestamps {
                                                    let timestamp = match timestamp {
                                                      serde_yaml::Value::String(timestamp) => timestamp.to_string(),
                                                      serde_yaml::Value::Number(timestamp) => {
                                                        if timestamp.is_u64() {
                                                          timestamp.to_string()
                                                        } else if timestamp.is_i64() {
                                                          timestamp.to_string()
                                                        } else if timestamp.is_f64() {
                                                          timestamp.to_string()
                                                        } 
                                                         else {
                                                          return Err(serde::de::Error::custom(
                                                              "expected a timestamp (string or number)",
                                                          ));
                                                        }
                                                      },
                                                      _ => {
                                                        return Err(serde::de::Error::custom(
                                                            "expected a timestamp (string)",
                                                        ));
                                                      }
                                                    };
                                                    match markers {
                                                        serde_yaml::Value::Mapping(markers) => {
                                                            for (marker, value) in markers {
                                                                let timestamp =
                                                                    timestamp.split(':').map(|s| s.split('.')).flatten().map(|s| s.parse::<u64>().expect("expected a number")).rev().collect::<Vec<u64>>();
                                                                let u_seconds = timestamp.get(0).unwrap_or(&0);
                                                                let seconds = timestamp.get(1).unwrap_or(u_seconds);
                                                                let minutes = timestamp.get(2).unwrap_or(&0);
                                                                let hours = timestamp.get(3).unwrap_or(&0);

                                                                let timestamp = u_seconds + seconds * 1_000_000 + minutes * 60 * 1_000_000 + hours * 60 * 60 * 1_000_000;
                                                                match marker.as_str().unwrap() {
                                                                  "tc" => {
                                                                    let value = {
                                                                      if value.is_u64() {
                                                                        value.as_u64().unwrap() as f64
                                                                      } else if value.is_i64() {
                                                                        value.as_i64().unwrap() as f64
                                                                      } else if value.is_f64() {
                                                                        value.as_f64().unwrap()
                                                                      } else {
                                                                        return Err(serde::de::Error::custom(
                                                                            "expected a number",
                                                                        ));
                                                                      }
                                                                    };
                                                                    timeline.markers.insert(timestamp, vec![TimelineMarker::TimeCompression(value)]);
                                                                  },
                                                                  "vol" => {
                                                                    let value = value.as_f64().unwrap();
                                                                    timeline.markers.insert(timestamp, vec![TimelineMarker::Volume(value)]);
                                                                  },
                                                                  "trim" => {
                                                                    let value = value.as_str().unwrap() == "start";
                                                                    timeline.markers.insert(timestamp, vec![TimelineMarker::Trim(value)]);
                                                                  },
                                                                  v => {
                                                                    let value = value.as_str().unwrap();
                                                                    timeline.markers.insert(timestamp, vec![TimelineMarker::Source(v.to_string(), value.to_string())]);
                                                                  }
                                                                }
                                                            }
                                                        }
                                                        _ => {
                                                            return Err(serde::de::Error::custom(
                                                                "expected a mapping of markers",
                                                            ));
                                                        }
                                                    }
                                                }
                                            },
                                            serde_yaml::Value::Null => {},
                                            _ => {
                                                return Err(serde::de::Error::custom(
                                                    "expected a timestamp (mapping)",
                                                ));
                                            }
                                        }
                                    }
                                }
                                _ => {
                                    return Err(serde::de::Error::custom(
                                        "expected a source argument (mapping)",
                                    ));
                                }
                            }
                        }
                        _ => {
                            return Err(serde::de::Error::custom(
                                "expected a source type (mapping)",
                            ));
                        }
                      }
                      
                    }
                  }
                  _ => {
                    return Err(serde::de::Error::custom("expected a sequence of sources"));
                  }
                }
                Ok(timeline)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn read_file() {
        let file = std::fs::read_to_string("tests/fixtures/example.timeline.yaml").unwrap();
        let timeline: Timeline = serde_yaml::from_str(&file).unwrap();
        println!("{:#?}", timeline);
    }
}
