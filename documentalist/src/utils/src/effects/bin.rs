pub mod effects_bin {
    use glib::prelude::*;
    use gst::prelude::*;
    use gst_base::subclass::prelude::*;
    use once_cell::sync::Lazy;
    use std::collections::{BTreeMap, HashMap};

    pub static CAT: Lazy<gst::DebugCategory> = Lazy::new(|| {
        gst::DebugCategory::new(
            "documentalist_effects_bin",
            gst::DebugColorFlags::empty(),
            Some("Documentalist Effects Bin"),
        )
    });

    type EffectsMap = HashMap<String, gst::Structure>;
    type EffectsTimeline = BTreeMap<gst::ClockTime, EffectsMap>;

    #[derive(Debug, Default, Clone)]
    struct Effects(pub EffectsTimeline);

    impl From<gst::Structure> for Effects {
        fn from(structure: gst::Structure) -> Self {
            let effects = structure
                .iter()
                .map(|(start, effects_map)| {
                    let start = start.parse::<u64>().expect("expected u64");
                    let effects_map = effects_map
                        .get::<gst::Structure>()
                        .expect("expected gst::Structure");
                    let effects_map = effects_map
                        .iter()
                        .map(|(effect_name, values)| {
                            let effect_props = values
                                .get::<gst::Structure>()
                                .expect("expected gst::Structure");
                            (effect_name.to_string(), effect_props)
                        })
                        .collect::<EffectsMap>();
                    (gst::ClockTime::from_nseconds(start), effects_map)
                })
                .collect::<EffectsTimeline>();
            Effects(effects)
        }
    }

    impl Into<gst::Structure> for Effects {
        fn into(self) -> gst::Structure {
            let mut effects = gst::Structure::new_empty("effects");
            for (start, map) in self.0.iter() {
                let mut effects_map = gst::Structure::new_empty("effects_map");
                for (effect_name, props_map) in map.iter() {
                    effects_map.set(effect_name, props_map);
                }
                effects.set_value(start.nseconds().to_string(), effects_map.to_send_value());
            }
            effects
        }
    }

    mod imp {

        use std::sync::Mutex;

        use super::*;

        #[derive(Default)]
        pub struct EffectsBin {
            effects: Mutex<Effects>,
        }

        #[glib::object_subclass]
        impl ObjectSubclass for EffectsBin {
            const NAME: &'static str = "DocumentalistEffectsBin";
            type Type = super::EffectsBin;
            type ParentType = gst_base::BaseTransform;
        }

        impl ObjectImpl for EffectsBin {
            fn properties() -> &'static [glib::ParamSpec] {
                static PROPERTIES: Lazy<Vec<glib::ParamSpec>> = Lazy::new(|| {
                    vec![glib::ParamSpecBoxed::builder::<gst::Structure>("effects")
                        .nick("effects")
                        .build()]
                });

                PROPERTIES.as_ref()
            }

            fn set_property(&self, _id: usize, value: &glib::Value, pspec: &glib::ParamSpec) {
                match pspec.name() {
                    "effects" => {
                        let effects = value.get::<gst::Structure>().unwrap();
                        let mut mtx = self.effects.lock().unwrap();
                        mtx.0.clear();
                        mtx.0.append(&mut Effects::from(effects).0);
                    }
                    _ => unimplemented!(),
                }
            }

            fn property(&self, _id: usize, pspec: &glib::ParamSpec) -> glib::Value {
                match pspec.name() {
                    "effects" => {
                        let effects =
                            Into::<gst::Structure>::into(self.effects.lock().unwrap().to_owned());
                        effects.to_value()
                    }
                    _ => unimplemented!(),
                }
            }

            fn constructed(&self) {
                self.parent_constructed();

                let obj = self.obj();
                obj.add_pad(&gst::Pad::from_template(
                    EffectsBin::pad_templates()
                        .get(3)
                        .expect("Could not get sink_audio pad template"),
                    None,
                )).expect("Could not add sink_audio pad");
                obj.add_pad(&gst::Pad::from_template(
                    EffectsBin::pad_templates()
                        .get(2)
                        .expect("Could not get src_audio pad template"),
                    None,
                )).expect("Could not add src_audio pad");
            }
        }

        impl GstObjectImpl for EffectsBin {}

        impl ElementImpl for EffectsBin {
            fn metadata() -> Option<&'static gst::subclass::ElementMetadata> {
                static ELEMENT_METADATA: Lazy<gst::subclass::ElementMetadata> = Lazy::new(|| {
                    gst::subclass::ElementMetadata::new(
                        "Documentalist Effects Bin",
                        "Filter/Effect/Video/Audio",
                        "Documentalist Effects Bin",
                        "twopack.gallery <packtwo@twopack.gallery>",
                    )
                });

                Some(&*ELEMENT_METADATA)
            }

            fn pad_templates() -> &'static [gst::PadTemplate] {
                static PAD_TEMPLATES: Lazy<Vec<gst::PadTemplate>> = Lazy::new(|| {
                    let caps = gst::Caps::builder("video/x-raw").any_features().build();
                    let video_src_pad_template = gst::PadTemplate::new(
                        "src",
                        gst::PadDirection::Src,
                        gst::PadPresence::Always,
                        &caps,
                    )
                    .unwrap();
                    let video_sink_pad_template = gst::PadTemplate::new(
                        "sink",
                        gst::PadDirection::Sink,
                        gst::PadPresence::Always,
                        &caps,
                    )
                    .unwrap();

                    let caps = gst::Caps::builder("audio/x-raw").build();
                    let audio_src_pad_template = gst::PadTemplate::new(
                        "src_audio",
                        gst::PadDirection::Src,
                        gst::PadPresence::Always,
                        &caps,
                    )
                    .unwrap();
                    let audio_sink_pad_template = gst::PadTemplate::new(
                        "sink_audio",
                        gst::PadDirection::Sink,
                        gst::PadPresence::Always,
                        &caps,
                    )
                    .unwrap();

                    vec![
                        video_src_pad_template,
                        video_sink_pad_template,
                        audio_src_pad_template,
                        audio_sink_pad_template,
                    ]
                });

                PAD_TEMPLATES.as_ref()
            }
        }

        impl BaseTransformImpl for EffectsBin {
            const MODE: gst_base::subclass::BaseTransformMode =
                gst_base::subclass::BaseTransformMode::AlwaysInPlace;
            const PASSTHROUGH_ON_SAME_CAPS: bool = false;
            const TRANSFORM_IP_ON_PASSTHROUGH: bool = false;

            fn transform_ip(
                &self,
                buf: &mut gst::BufferRef,
            ) -> Result<gst::FlowSuccess, gst::FlowError> {
                Ok(gst::FlowSuccess::Ok)
            }
        }
    }

    glib::wrapper! {
        pub struct EffectsBin(ObjectSubclass<imp::EffectsBin>) @extends gst_base::BaseTransform, gst::Element, gst::Object;
    }

    impl EffectsBin {
        pub fn new() -> Self {
            glib::Object::builder().build()
        }

        pub fn add_anchored_effect(
            &mut self,
            effect_name: &str,
            anchor: gst::ClockTime,
            props: gst::Structure,
        ) {
            let mut effects: Effects = self.property::<gst::Structure>("effects").into();

            let effects_map = effects.0.entry(anchor).or_insert_with(|| HashMap::new());
            effects_map.insert(effect_name.to_string(), props);

            self.set_property("effects", Into::<gst::Structure>::into(effects).to_value());
        }
    }
}
