use std::collections::HashMap;

use ffmpeg::{codec, frame, picture, Rational};

use crate::error::Error;

#[derive(Debug, Clone, PartialEq)]
pub struct VideoStreamMeta {
    pub width: u32,
    pub height: u32,
    pub frames: i64,
    pub rate: Rational,
    pub stream_time_base: Rational,
    pub decoder_time_base: Rational,
    pub aspect_ratio: Rational,
    pub pixel_format: ffmpeg::format::Pixel,
    pub codec_id: codec::Id,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AudioStreamMeta {
    pub rate: u32,
    pub bit_rate: usize,
    pub stream_time_base: Rational,
    pub decoder_time_base: Rational,
    pub sample_format: ffmpeg::format::Sample,
    pub channel_layout: ffmpeg::channel_layout::ChannelLayout,
    pub frames: i64,
    pub codec_id: codec::Id,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SubtitleMeta {
    pub codec_id: codec::Id,
    pub frames: i64,
    pub stream_time_base: Rational,
    pub decoder_time_base: Rational,
    pub bit_rate: usize,
}

#[derive(Debug, Clone, PartialEq)]
pub struct InputMeta {
    pub video: Option<VideoStreamMeta>,
    pub audio: Option<AudioStreamMeta>,
    pub subtitle: Option<SubtitleMeta>,
    pub file: HashMap<String, String>,
}

pub struct InputCursor<'s> {
    input: &'s mut ffmpeg::format::context::Input,
    video_stream_index: Option<usize>,
    audio_stream_index: Option<usize>,
    subtitle_stream_index: Option<usize>,
    video_decoder: Option<ffmpeg::decoder::Video>,
    audio_decoder: Option<ffmpeg::decoder::Audio>,
    subtitle_decoder: Option<ffmpeg::decoder::Subtitle>,
}

impl<'s> InputCursor<'s> {
    pub fn new(input: &'s mut ffmpeg::format::context::Input) -> Result<Self, Error> {
        let (video_stream_index, video_decoder) = input
            .streams()
            .best(ffmpeg::media::Type::Video)
            .map(|s| {
                let decoder = ffmpeg::codec::context::Context::from_parameters(s.parameters())
                    .unwrap()
                    .decoder()
                    .video()
                    .unwrap();
                (Some(s.index()), Some(decoder))
            })
            .unwrap_or((None, None));
        let (audio_stream_index, audio_decoder) = input
            .streams()
            .best(ffmpeg::media::Type::Audio)
            .map(|s| {
                let decoder = ffmpeg::codec::context::Context::from_parameters(s.parameters())
                    .unwrap()
                    .decoder()
                    .audio()
                    .unwrap();
                (Some(s.index()), Some(decoder))
            })
            .unwrap_or((None, None));

        let (subtitle_stream_index, subtitle_decoder) = input
            .streams()
            .best(ffmpeg::media::Type::Subtitle)
            .map(|s| {
                let decoder = ffmpeg::codec::context::Context::from_parameters(s.parameters())
                    .unwrap()
                    .decoder()
                    .subtitle()
                    .unwrap();
                (Some(s.index()), Some(decoder))
            })
            .unwrap_or((None, None));

        Ok(Self {
            input,
            video_stream_index,
            audio_stream_index,
            subtitle_stream_index,
            video_decoder,
            audio_decoder,
            subtitle_decoder,
        })
    }

    fn receive_decoded_video_frames(
        decoder: &mut ffmpeg::decoder::Video,
        visitor: &mut dyn InputCursorVisitor,
    ) -> Result<(), Error> {
        let mut frame = frame::Video::empty();
        while decoder.receive_frame(&mut frame).is_ok() {
            let ts = frame.timestamp();
            frame.set_pts(ts);
            frame.set_kind(picture::Type::None);
            visitor.visit_video_frame(&frame)?;
        }
        Ok(())
    }

    fn receive_decoded_audio_frames(
        decoder: &mut ffmpeg::decoder::Audio,
        visitor: &mut dyn InputCursorVisitor,
    ) -> Result<(), Error> {
        let mut frame = frame::Audio::empty();
        while decoder.receive_frame(&mut frame).is_ok() {
            let ts = frame.timestamp();
            frame.set_pts(ts);
            visitor.visit_audio_frame(&frame)?;
        }
        Ok(())
    }

    fn receive_decoded_subtitle_frames(
        decoder: &mut ffmpeg::decoder::Subtitle,
        visitor: &mut dyn InputCursorVisitor,
    ) -> Result<(), Error> {
        let mut frame = unsafe { frame::Frame::empty() };
        while decoder.receive_frame(&mut frame).is_ok() {
            let ts = frame.timestamp();
            frame.set_pts(ts);
            visitor.visit_subtitle_frame(&frame)?;
        }
        Ok(())
    }

    pub fn visit(mut self, visitor: &mut dyn InputCursorVisitor) -> Result<(), Error> {
        let mut packet_iter = self.input.packets();
        while let Some((stream, mut packet)) = packet_iter.next() {
            let stream_index = stream.index();
            if stream_index == self.video_stream_index.unwrap() {
                let mut decoder = self.video_decoder.take().unwrap();
                packet.rescale_ts(stream.time_base(), decoder.time_base());
                decoder.send_packet(&packet)?;
                Self::receive_decoded_video_frames(&mut decoder, visitor)?;
                self.video_decoder = Some(decoder);
            } else if stream_index == self.audio_stream_index.unwrap() {
                let mut decoder = self.audio_decoder.take().unwrap();
                packet.rescale_ts(stream.time_base(), decoder.time_base());
                decoder.send_packet(&packet)?;
                Self::receive_decoded_audio_frames(&mut decoder, visitor)?;
                self.audio_decoder = Some(decoder);
            } else if stream_index == self.subtitle_stream_index.unwrap() {
                let mut decoder = self.subtitle_decoder.take().unwrap();
                packet.rescale_ts(stream.time_base(), decoder.time_base());
                decoder.send_packet(&packet)?;
                Self::receive_decoded_subtitle_frames(&mut decoder, visitor)?;
                self.subtitle_decoder = Some(decoder);
            }
        }
        // flush the decoders
        if let Some(mut decoder) = self.video_decoder.take() {
            decoder.send_eof()?;
            Self::receive_decoded_video_frames(&mut decoder, visitor)?;
            self.video_decoder = Some(decoder);
        }
        if let Some(mut decoder) = self.audio_decoder.take() {
            decoder.send_eof()?;
            Self::receive_decoded_audio_frames(&mut decoder, visitor)?;
            self.audio_decoder = Some(decoder);
        }
        if let Some(mut decoder) = self.subtitle_decoder.take() {
            decoder.send_eof()?;
            Self::receive_decoded_subtitle_frames(&mut decoder, visitor)?;
            self.subtitle_decoder = Some(decoder);
        }
        visitor.visit_eoi()?;
        Ok(())
    }

    pub fn meta(&self) -> InputMeta {
        let mut meta = InputMeta {
            video: None,
            audio: None,
            subtitle: None,
            file: HashMap::new(),
        };
        let context = &self.input;
        for (k, v) in context.metadata().iter() {
            meta.file.insert(k.to_string(), v.to_string());
        }

        for stream in context.streams() {
            let frames: i64 = stream.frames();
            let rate: Rational = stream.rate();
            let time_base: Rational = stream.time_base();
            let decoder_time_base= rate.invert();

            let codec =
                ffmpeg::codec::context::Context::from_parameters(stream.parameters()).unwrap();
            let codec_id: codec::Id = codec.id();

            if codec.medium() == ffmpeg::media::Type::Video {
                if let Ok(video) = codec.decoder().video() {
                    let width: u32 = video.width();
                    let height: u32 = video.height();
                    let aspect_ratio: Rational = video.aspect_ratio();
                    let pixel_format: ffmpeg::format::Pixel = video.format();
                    meta.video = Some(VideoStreamMeta {
                        width,
                        height,
                        aspect_ratio,
                        pixel_format,
                        frames,
                        rate,
                        stream_time_base: time_base,
                        codec_id,
                        decoder_time_base
                    });
                }
            } else if codec.medium() == ffmpeg::media::Type::Audio {
                if let Ok(audio) = codec.decoder().audio() {
                    let rate: u32 = audio.rate();
                    let bit_rate: usize = audio.bit_rate();
                    let sample_format: ffmpeg::format::Sample = audio.format();
                    let channel_layout: ffmpeg::channel_layout::ChannelLayout =
                        audio.channel_layout();
                        let decoder_time_base= self
                            .audio_decoder
                            .as_ref()
                            .unwrap_or(&audio)
                            .time_base();
                    meta.audio = Some(AudioStreamMeta {
                        rate,
                        bit_rate,
                        stream_time_base: time_base,
                        sample_format,
                        channel_layout,
                        frames,
                        codec_id,
                        decoder_time_base
                    });
                }
            } else if codec.medium() == ffmpeg::media::Type::Subtitle {
                let codec_id = codec.id();
                if let Ok(subtitle) = codec.decoder().subtitle() {
                    let bit_rate = subtitle.bit_rate();
                    let decoder_time_base= self
                        .subtitle_decoder
                        .as_ref()
                        .unwrap_or(&subtitle)
                        .time_base();
                    meta.subtitle = Some(SubtitleMeta {
                        codec_id,
                        frames,
                        stream_time_base: time_base,
                        bit_rate,
                        decoder_time_base
                    });
                }
            }
        }
        meta
    }
}

pub trait InputCursorVisitor {
    fn visit_video_frame(&mut self, frame: &ffmpeg::frame::Video) -> Result<(), Error>;
    fn visit_audio_frame(&mut self, frame: &ffmpeg::frame::Audio) -> Result<(), Error>;
    fn visit_subtitle_frame(&mut self, frame: &ffmpeg::Frame) -> Result<(), Error>;
    fn visit_eoi(&mut self) -> Result<(), Error> ;
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestVisitor {
        video_frame_count: usize,
        audio_frame_count: usize,
        subtitle_frame_count: usize,
        end: bool
    }

    impl InputCursorVisitor for TestVisitor {
        fn visit_video_frame(&mut self, _frame: &ffmpeg::frame::Video) -> Result<(), Error> {
            self.video_frame_count += 1;
            Ok(())
        }

        fn visit_audio_frame(&mut self, _frame: &ffmpeg::frame::Audio) -> Result<(), Error> {
            self.audio_frame_count += 1;
            Ok(())
        }

        fn visit_subtitle_frame(&mut self, _frame: &ffmpeg::Frame) -> Result<(), Error> {
            self.subtitle_frame_count += 1;
            Ok(())
        }

        fn visit_eoi(&mut self) -> Result<(), Error> {
            self.end = true;
            Ok(())
        }
    }

    #[test]
    fn it_creates_a_cursor() {
        let mut input = ffmpeg::format::input(&"tests/fixtures/short_silent.mp4").unwrap();
        let cursor = InputCursor::new(&mut input).unwrap();
        assert_eq!(cursor.video_stream_index, Some(0));
        assert_eq!(cursor.audio_stream_index, None);
        assert_eq!(cursor.subtitle_stream_index, None);
    }

    #[test]
    fn it_creates_a_cursor_with_audio() {
        let mut input = ffmpeg::format::input(&"tests/fixtures/short.mp4").unwrap();
        let cursor = InputCursor::new(&mut input).unwrap();
        assert_eq!(cursor.video_stream_index, Some(0));
        assert_eq!(cursor.audio_stream_index, Some(1));
        assert_eq!(cursor.subtitle_stream_index, None);
    }

    #[test]
    fn it_should_visit_all_video_frames() {
        let mut input = ffmpeg::format::input(&"tests/fixtures/short_silent.mp4").unwrap();
        let mut cursor = InputCursor::new(&mut input).unwrap();
        let mut visitor = TestVisitor {
            video_frame_count: 0,
            audio_frame_count: 0,
            subtitle_frame_count: 0,
            end: false
        };
        cursor.visit(&mut visitor).unwrap();
        assert_eq!(visitor.video_frame_count, 90);
        assert_eq!(visitor.audio_frame_count, 0);
        assert_eq!(visitor.subtitle_frame_count, 0);
        assert_eq!(visitor.end, true);
    }

    #[test]
    fn it_should_visit_all_frames() {
        let mut input = ffmpeg::format::input(&"tests/fixtures/short.mp4").unwrap();
        let mut cursor = InputCursor::new(&mut input).unwrap();
        let mut visitor = TestVisitor {
            video_frame_count: 0,
            audio_frame_count: 0,
            subtitle_frame_count: 0,
            end: false
        };
        cursor.visit(&mut visitor).unwrap();
        assert_eq!(visitor.video_frame_count, 90);
        assert_eq!(visitor.audio_frame_count, 141);
        assert_eq!(visitor.subtitle_frame_count, 0);
        assert_eq!(visitor.end, true);
    }

    #[test]
    fn it_should_read_metadata() {
        let mut input = ffmpeg::format::input(&"tests/fixtures/short.mp4").unwrap();
        let cursor = InputCursor::new(&mut input).unwrap();
        let meta = cursor.meta();
        println!("{:?}", meta);
        match meta.video {
            Some(meta_video) => {
                assert_eq!(meta_video.width, 1280);
                assert_eq!(meta_video.height, 720);
                assert_eq!(meta_video.frames, 90);
                assert_eq!(meta_video.rate, Rational(30, 1));
                assert_eq!(meta_video.stream_time_base, Rational(1, 15360));
                assert_eq!(meta_video.aspect_ratio, Rational(1, 1));
                assert_eq!(meta_video.pixel_format, ffmpeg::format::Pixel::YUV420P);
                assert_eq!(meta_video.codec_id, ffmpeg::codec::Id::H264);
            }
            None => panic!("No video stream found"),
        };
        match meta.audio {
            Some(meta_audio) => {
                assert_eq!(meta_audio.rate, 48000);
                assert_eq!(meta_audio.bit_rate, 369501);
                assert_eq!(meta_audio.stream_time_base, Rational(1, 48000));
                assert_eq!(
                    meta_audio.sample_format,
                    ffmpeg::format::Sample::F32(ffmpeg::format::sample::Type::Planar)
                );
                assert_eq!(meta_audio.channel_layout, ffmpeg::ChannelLayout::STEREO);
                assert_eq!(meta_audio.frames, 142);
                assert_eq!(meta_audio.codec_id, ffmpeg::codec::Id::AAC);
            }
            None => panic!("No audio stream found"),
        }
        assert_eq!(meta.subtitle, None);
    }
}
