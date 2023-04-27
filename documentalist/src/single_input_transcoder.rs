use ffmpeg::{Dictionary, Rational};

use crate::error::Error;
use crate::input_cursor::{InputCursorVisitor, InputMeta};
use crate::output_cursor::{parse_opts, OutputCursor, DEFAULT_X264_OPTS};

pub struct SingleInputTranscoder<'s> {
    output_cursor: OutputCursor<'s>,
    meta: InputMeta,
    video_frame_count: usize,
    audio_frame_count: usize,
    subtitle_frame_count: usize,
}

impl<'s> SingleInputTranscoder<'s> {
    pub fn new(
        output: &'s mut ffmpeg::format::context::Output,
        output_path: &str,
        input_meta: InputMeta,
    ) -> Self {
        let mut output_cursor = OutputCursor::new(output);
        if let Some(video) = &input_meta.video {
            output_cursor
                .open_video_encoder(
                    video.width,
                    video.height,
                    video.rate,
                    video.frame_rate,
                    video.aspect_ratio,
                    video.pixel_format,
                    parse_opts(DEFAULT_X264_OPTS.to_owned()).unwrap(),
                )
                .expect("failed to open video encoder");
        }
        if let Some(audio) = &input_meta.audio {
            output_cursor
                .open_audio_encoder(
                    audio.rate,
                    audio.channel_layout,
                    audio.bit_rate,
                    audio.bit_rate,
                    output_path,
                    audio.sample_format,
                )
                .expect("failed to open video encoder");
        }
        println!("meta: {:#?}", input_meta);
        let mut meta = Dictionary::new();
        meta.set("comment", "documentalist test");
        meta.set("encoder", "Lavf58.76.100");
        meta.set("major_brand", "isom");
        meta.set("minor_version", "512");
        meta.set("compatible_brands", "isomiso2avc1mp41");
        output_cursor
            .open_file(meta)
            .expect("failed to open output file");
        Self {
            output_cursor,
            meta: input_meta,
            video_frame_count: 0,
            audio_frame_count: 0,
            subtitle_frame_count: 0,
        }
    }
}

impl<'s> InputCursorVisitor for SingleInputTranscoder<'s> {
    fn visit_video_frame(&mut self, frame: &ffmpeg::frame::Video, time_base: Rational) -> Result<(), Error> {
        self.video_frame_count += 1;
        self.output_cursor
            .accept_video_frame(frame, time_base)
    }
    fn visit_audio_frame(&mut self, frame: &ffmpeg::frame::Audio, time_base: Rational) -> Result<(), Error> {
        self.audio_frame_count += 1;
        self.output_cursor
            .accept_audio_frame(frame, time_base)
    }

    fn visit_subtitle_frame(&mut self, frame: &ffmpeg::Frame, time_base: Rational) -> Result<(), Error> {
        self.subtitle_frame_count += 1;
        self.output_cursor
            .accept_subtitle_frame(frame, time_base)
    }

    fn visit_eoi(&mut self, tbs: (Option<Rational>, Option<Rational>, Option<Rational>)) -> Result<(), Error> {
        self.output_cursor.close(tbs)
    }
}

#[cfg(test)]
mod tests {
    use ffmpeg::format;

    use crate::input_cursor::InputCursor;

    use super::*;

    #[test]
    fn it_transcodes_one_file() {
        let output_path = "tests/out/short-transcoded.mp4";
        let mut input =
            ffmpeg::format::input(&"tests/fixtures/short.mp4").expect("failed to open input");
        let mut input_cursor = InputCursor::new(&mut input).expect("failed to create input cursor");
        let meta = input_cursor.meta();
        println!("input metadata: {:#?}", meta);
        let mut output = ffmpeg::format::output(&output_path).expect("failed to open output");
        let mut transcoder = SingleInputTranscoder::new(&mut output, output_path, meta.clone());
        input_cursor
            .take_visitor(&mut transcoder)
            .expect("failed to transcode");
        assert_eq!(transcoder.video_frame_count, 90);
        assert_eq!(transcoder.audio_frame_count, 141);
        assert_eq!(transcoder.subtitle_frame_count, 0);

        // let mut input =
        //     ffmpeg::format::input(&output_path).expect("failed to open input");
        // let mut input_cursor = InputCursor::new(&mut input).expect("failed to create input cursor");
        // let meta = input_cursor.meta();
        // println!("output metadata: {:#?}", meta);
    }

    #[test]
    fn it_transcodes_one_longer_file() {
        let output_path = "tests/out/transcoded.mp4";
        let input_path = "tests/fixtures/repeat.mp4";
        let mut input =
            ffmpeg::format::input(&input_path).expect("failed to open input");
        format::context::input::dump(&input, 0, Some(&input_path));
        let mut input_cursor = InputCursor::new(&mut input).expect("failed to create input cursor");
        let meta = input_cursor.meta();
        println!("input metadata: {:#?}", meta);
        let mut output = ffmpeg::format::output(&output_path).expect("failed to open output");
        let mut transcoder = SingleInputTranscoder::new(&mut output, output_path, meta.clone());
        input_cursor
            .take_visitor(&mut transcoder)
            .expect("failed to transcode");
        assert_eq!(transcoder.video_frame_count, 180);
        assert_eq!(transcoder.audio_frame_count, 282);
        assert_eq!(transcoder.subtitle_frame_count, 0);

        // let mut input =
        //     ffmpeg::format::input(&output_path).expect("failed to open input");
        // let mut input_cursor = InputCursor::new(&mut input).expect("failed to create input cursor");
        // let meta = input_cursor.meta();
        // println!("output metadata: {:#?}", meta);
    }
}
