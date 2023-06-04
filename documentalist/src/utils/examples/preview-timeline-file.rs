use utils::{Preview, Project, Pipe, PipeVisitor};

fn main() {
    ges::init().expect("Failed to initialize GES.");
    Preview::run(move || {
        let mut project = Project::new_from_file("tests/fixtures/example.timeline.yml");

        let mut pipe = Pipe::default();
        project
            .visit(&mut pipe)
            .expect("Failed to create pipeline from feed.");

        pipe.pipeline_to_dot_file("examples/out/graphs/project-from-yaml.dot")
            .expect("Failed to write dot file.");


        Preview.play(pipe).expect("Failed to play pipe");
    })
}
