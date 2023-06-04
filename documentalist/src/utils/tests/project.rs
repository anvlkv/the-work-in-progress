use utils::{Project, Pipe, PipeVisitor, Preview};

#[test]
#[ignore]
fn it_should_preview_project_from_yaml_file() {
    ges::init().expect("Failed to initialize GES.");
    Preview::run(move || {
        let mut project = Project::new_from_file("tests/fixtures/example.timeline.yml");

        let mut pipe = Pipe::default();
        project.visit(&mut pipe)
            .expect("Failed to create pipeline from project.");


        pipe.pipeline_to_dot_file("tests/out/graphs/project-from-yaml.dot")
            .expect("Failed to write dot file.");

        Preview.play(pipe).expect("Failed to play pipe");
    })
}