use crate::Feed;

use super::{Pipe, PipeVisitor};
use anyhow::{Result, Error};
use serde::Deserialize;

pub trait Anchored {
    fn start(&self) -> gst::ClockTime;
    fn set_start(&mut self, start: gst::ClockTime);
}
pub trait Continuous: Anchored {
    fn duration(&self) -> gst::ClockTime;
    fn set_duration(&mut self, end: gst::ClockTime);
    fn set_inpoint(&mut self, inpoint: gst::ClockTime);
}

pub trait TimelineElement: Continuous + PipeVisitor {}

pub trait TimelineContainer: TimelineElement {
    // fn elements(&self) -> Vec<Box<dyn TimelineElement>>;
}

pub struct Project(Vec<Box<dyn TimelineContainer>>);

impl Anchored for Project {
    fn start(&self) -> gst::ClockTime {
        gst::ClockTime::default()
    }
    fn set_start(&mut self, _: gst::ClockTime) {
      panic!("project cannot have a set start")
  }
}

impl Continuous for Project {
    fn duration(&self) -> gst::ClockTime {
        self.0
            .iter()
            .fold(gst::ClockTime::default(), |acc, e| acc + e.duration())
    }

    fn set_duration(&mut self, _: gst::ClockTime) {
        panic!("project cannot have a set end")
    }

    fn set_inpoint(&mut self, _: gst::ClockTime) {
        panic!("project cannot have a set inpoint")
    }
}

impl PipeVisitor for Project {
    fn visit_layer_name(&mut self, name: &str, pipe: &mut Pipe) -> Result<()> {
        let mut duration = gst::ClockTime::default();
        self.0
            .iter_mut()
            .try_for_each(|e| {
                e.set_start(duration);
                e.visit_layer_name(name, pipe)?;
                duration += e.duration();
                Ok::<(), Error>(())
            })?;
        Ok(())
    }
}

impl<'de> Deserialize<'de> for Project {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let yaml = serde_yaml::Value::deserialize(deserializer)?;
        let mut project = Self(vec![]);

        match yaml {
            serde_yaml::Value::Sequence(seq) => {
                for entry in seq {
                    match entry {
                        serde_yaml::Value::Mapping(m) => {
                            let first_key = m.keys().next().unwrap();
                            let first_key_str = first_key.as_str().unwrap();
                            match first_key_str {
                                "feed" => {
                                    let feed: Feed =
                                        serde_yaml::from_value(serde_yaml::Value::Mapping(m))
                                            .map_err(|e| {
                                                serde::de::Error::custom(format!(
                                                    "failed to parse feed: {}",
                                                    e
                                                ))
                                            })?;
                                    project.0.push(Box::new(feed));
                                }
                                _ => {
                                    return Err(serde::de::Error::custom(format!(
                                        "unknown key: {}",
                                        first_key_str
                                    )))?;
                                }
                            }
                        }
                        _ => {
                            return Err(serde::de::Error::custom("expected mapping"))?;
                        }
                    }
                }
                Ok(project)
            }
            _ => Err(serde::de::Error::custom("expected sequence"))?,
        }
    }
}

impl Project {
    pub fn new_from_file(path: &str) -> Self {
        let yaml: Self = serde_yaml::from_str(
            std::fs::read_to_string(path)
                .expect("Failed to read timeline file.")
                .as_str(),
        )
        .expect("Failed to parse timeline YAML file.");
        yaml
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project() {
        ges::init().unwrap();
        let path = {
            use path_absolutize::*;
            let path = std::path::Path::new("tests/fixtures/example.timeline.yml");
            path.absolutize().unwrap().to_str().unwrap().to_string()
        };
        let mut project = Project::new_from_file(&path);
        let mut pipe = Pipe::default();
        project.visit(&mut pipe).unwrap();
        println!("{:?}", project.duration().nseconds());
        assert_eq!(project.duration(), gst::ClockTime::from_nseconds(76019999750));

    }
}
