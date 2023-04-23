extern crate ffmpeg_next as ffmpeg;
extern crate ffmpeg_sys_next;

mod error;
mod input_cursor;
mod output_cursor;
mod single_input_transcoder;


fn main() {
    // ffmpeg::init().unwrap();
    // log::set_level(log::Level::Info);
    // let output_file = env::args().nth(1).expect("missing output file");

    // let mut octx = format::output(&output_file).unwrap();

    let paths = vec![
        "../remotion/public/05/2023-04-08_18-53-40.mp4",
        "../remotion/public/05/2023-04-08_19-05-03.mp4",
        "../remotion/public/05/2023-04-08_19-55-11.mp4",
    ];
    
}
