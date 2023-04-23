use ffmpeg::{channel_layout, codec, encoder, format, media, Dictionary, Rational};
use ffmpeg_sys_next::avcodec_open2;

use crate::error::Error;
pub const DEFAULT_X264_OPTS: &str = "preset=veryslow,keyint=10";

pub struct OutputCursor<'s> {
    output: &'s mut ffmpeg::format::context::Output,
    video_stream_index: Option<usize>,
    audio_stream_index: Option<usize>,
    subtitle_stream_index: Option<usize>,
    video_encoder: Option<ffmpeg::encoder::video::Video>,
    audio_encoder: Option<ffmpeg::encoder::Audio>,
    subtitle_encoder: Option<ffmpeg::encoder::Subtitle>,
    video_time_base: Option<Rational>,
    audio_time_base: Option<Rational>,
    subtitle_time_base: Option<Rational>,
    last_input_time_base: (Option<Rational>, Option<Rational>, Option<Rational>),
}

impl<'s> OutputCursor<'s> {
    pub fn new(output: &'s mut ffmpeg::format::context::Output) -> Self {
        Self {
            output,
            video_stream_index: None,
            audio_stream_index: None,
            subtitle_stream_index: None,
            video_encoder: None,
            audio_encoder: None,
            subtitle_encoder: None,
            video_time_base: None,
            audio_time_base: None,
            subtitle_time_base: None,
            last_input_time_base: (None, None, None),
        }
    }

    fn receive_packets(
        encoder: &mut encoder::Encoder,
        output: &mut format::context::Output,
        stream_index: usize,
        time_stamp: Option<i64>,
        src_time_base: Rational,
        dst_time_base: Rational,
    ) -> Result<(), Error> {
        let mut packet = ffmpeg::packet::Packet::empty();
        while encoder.receive_packet(&mut packet).is_ok() {
            packet.set_stream(stream_index);
            packet.rescale_ts(src_time_base, dst_time_base);
            packet.write_interleaved(output)?;
        }
        Ok(())
    }

    pub fn accept_video_frame(
        &mut self,
        frame: &ffmpeg::frame::Video,
        in_time_base: Rational,
    ) -> Result<(), Error> {
        let mut encoder = self.video_encoder.take().unwrap();
        encoder.send_frame(frame)?;
        self.last_input_time_base.0 = Some(in_time_base);
        Self::receive_packets(
            &mut encoder,
            &mut self.output,
            self.video_stream_index.unwrap(),
            None,
            in_time_base,
            self.video_time_base.unwrap(),
        )?;
        self.video_encoder = Some(encoder);
        Ok(())
    }

    pub fn accept_audio_frame(
        &mut self,
        frame: &ffmpeg::frame::Audio,
        in_time_base: Rational,
    ) -> Result<(), Error> {
        let mut encoder = self.audio_encoder.take().unwrap();
        encoder.send_frame(frame)?;
        self.last_input_time_base.1 = Some(in_time_base);
        Self::receive_packets(
            &mut encoder,
            &mut self.output,
            self.audio_stream_index.unwrap(),
            None,
            in_time_base,
            self.audio_time_base.unwrap(),
        )?;
        self.audio_encoder = Some(encoder);
        Ok(())
    }

    pub fn accept_subtitle_frame(
        &mut self,
        frame: &ffmpeg::Frame,
        in_time_base: Rational,
    ) -> Result<(), Error> {
        let mut encoder = self.subtitle_encoder.take().unwrap();
        encoder.send_frame(frame)?;
        self.last_input_time_base.2 = Some(in_time_base);
        Self::receive_packets(
            &mut encoder,
            &mut self.output,
            self.subtitle_stream_index.unwrap(),
            None,
            in_time_base,
            self.subtitle_time_base.unwrap(),
        )?;
        self.subtitle_encoder = Some(encoder);
        Ok(())
    }

    pub fn open_video_encoder(
        &mut self,
        width: u32,
        height: u32,
        rate: Rational,
        time_base: Rational,
        aspect_ratio: Rational,
        format: format::Pixel,
        x264_opts: ffmpeg::Dictionary,
    ) -> Result<(), Error> {
        let global_header = self
            .output
            .format()
            .flags()
            .contains(format::Flags::GLOBAL_HEADER);
        let mut ost = self.output.add_stream(encoder::find(codec::Id::H264))?;

        let mut encoder = codec::context::Context::from_parameters(ost.parameters())?
            .encoder()
            .video()?;
        encoder.set_height(height);
        encoder.set_width(width);
        encoder.set_aspect_ratio(aspect_ratio);
        encoder.set_format(format);
        encoder.set_frame_rate(Some(rate));
        encoder.set_time_base(time_base);

        if global_header {
            encoder.set_flags(codec::Flags::GLOBAL_HEADER);
        }

        unsafe {
            // setting maximum motion estimation range will affect the output (lower quality the higher the range)
            (*encoder.as_mut_ptr()).me_range = 1;
            // setting maximum quantization difference will affect the output (lower quality the higher the difference)
            (*encoder.as_mut_ptr()).max_qdiff = 1;
            // setting minimum quantization will affect the output (lower quality the lower the minimum)
            (*encoder.as_mut_ptr()).qmin = 10;
            // setting maximum quantization will affect the output (lower quality the higher the maximum)
            (*encoder.as_mut_ptr()).qmax = 30;
            // setting quantization will affect the output (lower quality the higher the quantization)
            (*encoder.as_mut_ptr()).qcompress = 0.0;
        }

        let encoder2 = encoder
            .open_as_with(encoder::find(codec::Id::H264), x264_opts.clone())
            // .open_with(x264_opts)
            .expect("error opening libx264 encoder with supplied settings");

        ost.set_parameters(&encoder2);
        ost.set_rate(rate);
        let mut encoder_video = codec::context::Context::from_parameters(ost.parameters())?
            .encoder()
            .video()?;

        unsafe {
            // println!("time base {}" , decoder.frame_rate().unwrap());

            // println!("time base {} {}", ist.time_base().0, ist.time_base().1);
            encoder_video.set_time_base(time_base);
            encoder_video.set_frame_rate(Some(rate));
            encoder_video.set_height(height);
            encoder_video.set_width(width);
            encoder_video.set_aspect_ratio(aspect_ratio);
            (*encoder_video.as_mut_ptr()).me_range = 1;
            (*encoder_video.as_mut_ptr()).max_qdiff = 1;
            (*encoder_video.as_mut_ptr()).qmin = 10;
            (*encoder_video.as_mut_ptr()).qmax = 30;
            (*encoder_video.as_mut_ptr()).qcompress = 0.0;
            avcodec_open2(
                encoder_video.as_mut_ptr(),
                encoder::find(codec::Id::H264).expect("REASON").as_ptr(),
                &mut x264_opts.disown(),
            );
        }

        self.video_encoder = Some(encoder_video);
        self.video_stream_index = Some(ost.index());
        self.video_time_base = Some(time_base);

        Ok(())
    }

    pub fn open_audio_encoder(
        &mut self,
        rate: u32,
        time_base: Rational,
        channel_layout: ffmpeg::ChannelLayout,
        bit_rate: usize,
        max_bit_rate: usize,
        path: &str,
        sample_format: format::Sample,
    ) -> Result<(), Error> {
        let global_header = self
            .output
            .format()
            .flags()
            .contains(format::Flags::GLOBAL_HEADER);
        let codec = ffmpeg::encoder::find(self.output.format().codec(&path, media::Type::Audio))
            .expect("failed to find encoder")
            .audio()?;
        let mut ost = self.output.add_stream(codec)?;
        let context = ffmpeg::codec::context::Context::from_parameters(ost.parameters())?;
        let mut encoder = context.encoder().audio()?;
        if global_header {
            encoder.set_flags(ffmpeg::codec::flag::Flags::GLOBAL_HEADER);
        }
        encoder.set_format(sample_format);
        encoder.set_rate(rate as i32);
        encoder.set_channel_layout(channel_layout);
        encoder.set_channels(channel_layout.channels());
        encoder.set_format(
            codec
                .formats()
                .expect("unknown supported formats")
                .next()
                .unwrap(),
        );
        encoder.set_bit_rate(bit_rate);
        encoder.set_max_bit_rate(max_bit_rate);
        encoder.set_time_base(time_base);

        let encoder_audio = encoder.open_as(codec)?;
        ost.set_parameters(&encoder_audio);

        self.audio_encoder = Some(encoder_audio);
        self.audio_stream_index = Some(ost.index());
        self.audio_time_base = Some(time_base);
        Ok(())
    }

    pub fn open_subtitle_encoder(
        &mut self,
        output_path: &str,
        bit_rate: usize,
        flags: codec::Flags,
        time_base: Rational,
    ) -> Result<(), Error> {
        let global_header = self
            .output
            .format()
            .flags()
            .contains(format::Flags::GLOBAL_HEADER);
        let codec = ffmpeg::encoder::find(
            self.output
                .format()
                .codec(&output_path, media::Type::Subtitle),
        )
        .expect("failed to find encoder");

        let mut ost = self.output.add_stream(codec)?;

        let context = ffmpeg::codec::context::Context::from_parameters(ost.parameters())?;
        let mut encoder = context.encoder().subtitle()?;
        if global_header {
            encoder.set_flags(ffmpeg::codec::flag::Flags::GLOBAL_HEADER);
        }

        encoder.set_bit_rate(bit_rate);
        encoder.set_flags(flags);
        encoder.set_time_base(time_base);

        let encoder_subtitle = encoder.open_as(codec)?;
        ost.set_parameters(&encoder_subtitle);

        self.subtitle_encoder = Some(encoder_subtitle);
        self.subtitle_stream_index = Some(ost.index());
        self.subtitle_time_base = Some(time_base);
        Ok(())
    }

    pub fn open_file(&mut self, output_file: &str, meta_data: Dictionary) -> Result<(), Error> {
        self.output.set_metadata(meta_data.to_owned());
        format::context::output::dump(&self.output, 0, Some(&output_file));
        self.output.write_header()?;
        Ok(())
    }

    pub fn close(&mut self) -> Result<(), Error> {
        let (video_itb, audio_itb, subtitle_itb) = self.last_input_time_base;
        if let Some(mut encoder) = self.video_encoder.take() {
            encoder.send_eof()?;
            Self::receive_packets(
                &mut encoder,
                &mut self.output,
                self.video_stream_index.unwrap(),
                None,
                video_itb.unwrap_or(Rational(0, 0)),
                self.video_time_base.unwrap(),
            )?;
            self.video_encoder = Some(encoder);
        }
        if let Some(mut encoder) = self.audio_encoder.take() {
            encoder.send_eof()?;
            Self::receive_packets(
                &mut encoder,
                &mut self.output,
                self.audio_stream_index.unwrap(),
                None,
                audio_itb.unwrap_or(Rational(0, 0)),
                self.audio_time_base.unwrap(),
            )?;
            self.audio_encoder = Some(encoder);
        }
        if let Some(mut encoder) = self.subtitle_encoder.take() {
            encoder.send_eof()?;
            Self::receive_packets(
                &mut encoder,
                &mut self.output,
                self.subtitle_stream_index.unwrap(),
                None,
                subtitle_itb.unwrap_or(Rational(0, 0)),
                self.subtitle_time_base.unwrap(),
            )?;
            self.subtitle_encoder = Some(encoder);
        }
        self.output.write_trailer()?;
        Ok(())
    }
}

pub fn parse_opts<'a>(s: String) -> Option<Dictionary<'a>> {
    let mut dict = Dictionary::new();
    for keyval in s.split_terminator(',') {
        let tokens: Vec<&str> = keyval.split('=').collect();
        match tokens[..] {
            [key, val] => dict.set(key, val),
            _ => return None,
        }
    }
    Some(dict)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ffmpeg::format::output;
    use ffmpeg::Rational;

    #[test]
    fn it_creates_a_cursor() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let cursor = OutputCursor::new(&mut output);
        assert_eq!(cursor.video_stream_index, None);
        assert_eq!(cursor.audio_stream_index, None);
        assert_eq!(cursor.subtitle_stream_index, None);
    }

    #[test]
    fn it_should_open_video_encoder() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        assert_eq!(cursor.video_stream_index, None);
        assert_eq!(cursor.audio_stream_index, None);
        assert_eq!(cursor.subtitle_stream_index, None);
        let x264_opts = parse_opts(DEFAULT_X264_OPTS.to_string()).unwrap();
        cursor
            .open_video_encoder(
                1280,
                720,
                Rational::new(1, 1),
                Rational(1, 90000),
                Rational::new(1, 1),
                format::Pixel::YUV420P,
                x264_opts,
            )
            .expect("error opening video encoder");

        assert_eq!(cursor.video_stream_index, Some(0));
    }

    #[test]
    fn it_should_open_audio_encoder() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        assert_eq!(cursor.video_stream_index, None);
        assert_eq!(cursor.audio_stream_index, None);
        assert_eq!(cursor.subtitle_stream_index, None);
        cursor
            .open_audio_encoder(
                44100,
                Rational(44100, 1),
                ffmpeg::ChannelLayout::STEREO,
                128000,
                128000,
                "tests/out/output.mp4",
                format::Sample::I16(format::sample::Type::Packed),
            )
            .expect("error opening audio encoder");

        assert_eq!(cursor.audio_stream_index, Some(0));
    }

    #[test]
    fn it_should_accept_video_frame() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        let x264_opts = parse_opts(DEFAULT_X264_OPTS.to_string()).unwrap();
        cursor
            .open_video_encoder(
                1280,
                720,
                Rational::new(1, 1),
                Rational(1, 90000),
                Rational::new(1, 1),
                format::Pixel::YUV420P,
                x264_opts,
            )
            .expect("error opening video encoder");
        let mut frame = ffmpeg::frame::Video::new(format::Pixel::YUV420P, 1280, 720);
        cursor
            .accept_video_frame(&mut frame, Rational(1, 1))
            .expect("error accepting video frame");
    }

    #[test]
    fn it_should_accept_audio_frame() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        cursor
            .open_audio_encoder(
                48000,
                Rational(48000, 1),
                ffmpeg::ChannelLayout::STEREO,
                369501,
                380000,
                "tests/out/output.mp4",
                format::Sample::F32(format::sample::Type::Planar),
            )
            .expect("error opening audio encoder");
        let mut frame = ffmpeg::frame::Audio::new(
            ffmpeg::format::Sample::F32(format::sample::Type::Planar),
            24,
            ffmpeg::ChannelLayout::STEREO,
        );
        cursor
            .accept_audio_frame(&mut frame, Rational(1, 1))
            .expect("error accepting audio frame");
    }

    #[test]
    fn it_should_open_file() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        let x264_opts = parse_opts(DEFAULT_X264_OPTS.to_string()).unwrap();
        cursor
            .open_video_encoder(
                1280,
                720,
                Rational::new(1, 1),
                Rational(1, 90000),
                Rational::new(1, 1),
                format::Pixel::YUV420P,
                x264_opts,
            )
            .expect("error opening video encoder");
        cursor
            .open_audio_encoder(
                44100,
                Rational(44100, 1),
                ffmpeg::ChannelLayout::STEREO,
                128000,
                128000,
                "tests/out/output.mp4",
                format::Sample::I16(format::sample::Type::Packed),
            )
            .expect("error opening audio encoder");
        let mut meta = Dictionary::new();
        meta.set("comment", "documentalist test");
        meta.set("encoder", "Lavf58.76.100");
        meta.set("major_brand", "isom");
        meta.set("minor_version", "512");
        meta.set("compatible_brands", "isomiso2avc1mp41");

        cursor
            .open_file("tests/out/output.mp4", meta)
            .expect("error opening file");
    }

    #[test]
    fn it_should_close() {
        let mut output = output(&"tests/out/output.mp4").unwrap();
        let mut cursor = OutputCursor::new(&mut output);
        let x264_opts = parse_opts(DEFAULT_X264_OPTS.to_string()).unwrap();
        cursor
            .open_video_encoder(
                1280,
                720,
                Rational::new(1, 1),
                Rational(1, 90000),
                Rational::new(1, 1),
                format::Pixel::YUV420P,
                x264_opts,
            )
            .expect("error opening video encoder");
        cursor
            .open_audio_encoder(
                44100,
                Rational(44100, 1),
                ffmpeg::ChannelLayout::STEREO,
                128000,
                128000,
                "tests/out/output.mp4",
                format::Sample::I16(format::sample::Type::Packed),
            )
            .expect("error opening audio encoder");
        let mut meta = Dictionary::new();
        meta.set("comment", "documentalist test");
        meta.set("encoder", "Lavf58.76.100");
        meta.set("major_brand", "isom");
        meta.set("minor_version", "512");
        meta.set("compatible_brands", "isomiso2avc1mp41");

        cursor
            .open_file("tests/out/output.mp4", meta)
            .expect("error opening file");

        cursor.close().expect("error closing cursor");
    }
}
