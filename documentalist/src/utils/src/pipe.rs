use gst::{
    prelude::*,
};

/// Convenience struct for holding sink id elements
#[derive(Debug)]
pub struct Port(
    /// video stream id element
    pub gst::Element,
    /// audio stream id element
    pub gst::Element,
);

/// Convenience struct for holding source id elements
#[derive(Debug)]
pub struct Connector(
    /// video stream id element
    pub gst::Element,
    /// audio stream id element
    pub gst::Element,
);

impl Port {
    pub fn new(v_id_element: gst::Element, a_id_element: gst::Element) -> Self {
        Self(v_id_element, a_id_element)
    }
    pub fn connect(&self, connector: &Connector) -> anyhow::Result<()> {
        let (v_sink, a_sink) = (&self.0, &self.1);
        let (v_src, a_src) = (&connector.0, &connector.1);

        v_src.link(v_sink)?;
        a_src.link(a_sink)?;
        for el in &[v_sink, a_sink, v_src, a_src] {
            el.sync_state_with_parent()?;
        }

        Ok(())
    }

    pub fn connect_elements(
        &self,
        v_src: &gst::Element,
        a_src: &gst::Element,
    ) -> anyhow::Result<()> {
        let (v_sink, a_sink) = (&self.0, &self.1);

        v_src.link(v_sink)?;
        a_src.link(a_sink)?;
        for el in &[v_sink, a_sink, v_src, a_src] {
            el.sync_state_with_parent()?;
        }

        Ok(())
    }
}

impl Connector {
    pub fn new(v_id_element: gst::Element, a_id_element: gst::Element) -> Self {
        Self(v_id_element, a_id_element)
    }
    pub fn connect(&self, port: &Port) -> anyhow::Result<()> {
        let (v_sink, a_sink) = (&port.0, &port.1);
        let (v_src, a_src) = (&self.0, &self.1);

        v_src.link(v_sink)?;
        a_src.link(a_sink)?;
        for el in &[v_sink, a_sink, v_src, a_src] {
            el.sync_state_with_parent()?;
        }

        Ok(())
    }

    pub fn connect_elements(
        &self,
        v_sink: &gst::Element,
        a_sink: &gst::Element,
    ) -> anyhow::Result<()> {
        let (v_src, a_src) = (&self.0, &self.1);

        v_src.link(v_sink)?;
        a_src.link(a_sink)?;
        for el in &[v_sink, a_sink, v_src, a_src] {
            el.sync_state_with_parent()?;
        }

        Ok(())
    }
}

/// Convenience struct for holding a pipeline and its source and sink elements
///
#[derive(Debug, Default)]
pub struct Pipe {
    pub sink_port: Option<Port>,
    pub pipeline: gst::Pipeline,
    pub src_connector: Option<Connector>,
}

impl Pipe {
    pub fn pipeline_to_dot_file(&self, path: &str) -> anyhow::Result<()> {
        let dot_data = self
            .pipeline
            .debug_to_dot_data(gst::DebugGraphDetails::all());
        let mut file = std::fs::File::create(path)?;
        std::io::Write::write_all(&mut file, dot_data.as_bytes())?;

        Ok(())
    }
}

impl From<gst::Pipeline> for Pipe {
    fn from(pipeline: gst::Pipeline) -> Self {
        Self {
            sink_port: None,
            pipeline,
            src_connector: None,
        }
    }
}
