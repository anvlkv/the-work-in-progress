import {AbsoluteFill, Loop, staticFile, Video} from 'remotion';
import {Audio} from 'remotion';
import React, {useMemo} from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {VideoClipProps} from '../../Video/types';
import {PresentationClip} from '../../Slides/PresentationClip';
import {SpeakingHead} from '../../Head/SpeakingHead';
import {Splash} from '../../Splash';
import {Speech} from '../../Speech';
import {COLOR_2, SAFE_PLAYBACK_RATE, SPLASH_DURATION_S} from '../../constants';
import {
	EpProps,
	EpAudioCompositionEntry,
	EpCompositionEntry,
	FrameMapping,
} from './types';
import {useEpisodeComposition, useEpisodeMeta, useFrameMapping} from './hooks';
import {TiltingHead} from '../../Head/TiltingHead';
import {Clock} from '../../Clock';
import {SlidesMeta, VideoClipMeta} from '../../server/types';
import {SafeSpeedVideo} from '../../Video/SafeSpeedVideo';
import {FastForwardVideo} from '../../Video/FastForwardVideo';

const EpisodeAudio: React.FC<{
	comp: FrameMapping<EpAudioCompositionEntry>[];
	src?: VideoClipProps;
}> = ({comp, src}) => {
	const [from, to, props] = useFrameMapping<EpAudioCompositionEntry>(comp);
	return (
		<>
			{props && props.tts && (
				<Sequence from={from + (typeof props.tts[0] === 'number' ? props.tts[0] : 0)} durationInFrames={to - from + 1}>
					<Speech speech={props.tts} />
				</Sequence>
			)}
			{props && src && props.originalVolume && (
				<Sequence from={from} durationInFrames={to - from + 1}>
					<Audio
						muted={false}
						src={staticFile(src.src)}
						playbackRate={Math.min(src.accelerate || 1, SAFE_PLAYBACK_RATE)}
						startFrom={src.startFrom}
						endAt={src.endAt}
						// eslint-disable-next-line @remotion/volume-callback
						volume={props.originalVolume}
					/>
				</Sequence>
			)}
		</>
	);
};

const EpisodeClips: React.FC<{
	comp: FrameMapping<EpCompositionEntry>[];
	editorMode: boolean;
}> = ({comp, editorMode}) => {
	const [from, to, props] = useFrameMapping<EpCompositionEntry>(comp);
	return (
		<AbsoluteFill>
			{props && props.video && (
				<Sequence from={from} durationInFrames={to - from + 1}>
					{props.video.accelerate > SAFE_PLAYBACK_RATE ? (
						<FastForwardVideo
							{...props.video}
							src={staticFile(props.video.src)}
							editorMode={editorMode}
						/>
					) : (
						<SafeSpeedVideo
							{...props.video}
							src={staticFile(props.video.src)}
							editorMode={editorMode}
						/>
					)}
				</Sequence>
			)}
		</AbsoluteFill>
	);
};

const EpisodeSlides: React.FC<{
	comp: FrameMapping<EpCompositionEntry>[];
}> = ({comp}) => {
	const [from, to, props] = useFrameMapping<EpCompositionEntry>(comp);

	return (
		<AbsoluteFill>
			{props && props.slide && (
				<Sequence from={from} durationInFrames={to - from + 1}>
					<PresentationClip {...props.slide} />
				</Sequence>
			)}
		</AbsoluteFill>
	);
};

const EpisodeSpeechBooth: React.FC<{
	comp: FrameMapping<EpAudioCompositionEntry>[];
}> = ({comp}) => {
	const {fps} = useVideoConfig();
	const [from, to, props] = useFrameMapping<EpAudioCompositionEntry>(comp);

	return (
		<AbsoluteFill
			style={{
				top: 'unset',
				left: 'unset',
				right: 0,
				bottom: 0,
				width: '20%',
				height: '20%',
				backgroundColor: COLOR_2,
				borderRadius: '1em 0 0 0',
			}}
		>
			{props && props.tts ? (
				<Sequence from={from} durationInFrames={to - from + 1}>
					<SpeakingHead speech={props.tts} />
				</Sequence>
			) : (
				<Loop durationInFrames={fps * 10}>
					{' '}
					<TiltingHead />
				</Loop>
			)}
		</AbsoluteFill>
	);
};

const EpisodeClock: React.FC<{
	comp: FrameMapping<EpCompositionEntry>[];
	editorMode: boolean;
	meta: (VideoClipMeta | SlidesMeta)[];
}> = ({comp, editorMode, meta}) => {
	const {fps} = useVideoConfig();
	const [from, to, props] = useFrameMapping<EpCompositionEntry>(comp);
	const elapsedVideo = useMemo(
		() =>
			(props &&
				meta.slice(0, props.index - 1).reduce((acc, m) => {
					return (
						acc + ((m as VideoClipMeta).originalDurationInSeconds || 0) * fps
					);
				}, 0)) ||
			0,
		[meta, props, fps]
	);

	if (!props || !props.video || elapsedVideo === null) {
		return null;
	}

	return (
		<Sequence from={from} durationInFrames={to - from + 1}>
			<Clock
				file={props.video.src}
				elapsedFrames={elapsedVideo}
				startFrom={props.video.startFrom}
				acceleration={props.video.accelerate || 1}
				editorMode={editorMode}
			/>
		</Sequence>
	);
};

const EpisodeComponent: React.FC<EpProps> = ({
	path,
	id,
	editorMode,
	chunked,
}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const meta = useEpisodeMeta(path, fps);
	let sequenceDuration = durationInFrames;
	let from = 0;
	if (chunked) {
		const {chunk, ofChunks, chunkDuration} = chunked;
		sequenceDuration = Math.round(ofChunks * chunkDuration);
		from = chunk * -chunkDuration;
	}

	const totalClipsDurationTarget =
		sequenceDuration - SPLASH_DURATION_S * 2 * fps;

	if (totalClipsDurationTarget < 0) {
		console.error('negative duration');
	}

	const comp = useEpisodeComposition(id, path, fps, totalClipsDurationTarget);

	if (!comp) {
		return null;
	}

	return (
		<Sequence name={id} from={from} durationInFrames={sequenceDuration}>
			<Sequence durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * SPLASH_DURATION_S} />
			</Sequence>
			<Sequence
				from={fps * SPLASH_DURATION_S}
				durationInFrames={totalClipsDurationTarget}
			>
				<EpisodeAudio comp={comp.audioComposition} />
				<EpisodeClips
					editorMode={Boolean(editorMode)}
					comp={comp.composition}
				/>
				<EpisodeSlides comp={comp.composition} />
				<EpisodeSpeechBooth comp={comp.audioComposition} />
				<EpisodeClock
					editorMode={Boolean(editorMode)}
					comp={comp.composition}
					meta={meta.value?.sequence || []}
				/>
			</Sequence>
			<Sequence
				from={sequenceDuration - fps * SPLASH_DURATION_S}
				durationInFrames={fps * SPLASH_DURATION_S}
			>
				<Splash duration={fps * -SPLASH_DURATION_S} />
			</Sequence>
		</Sequence>
	);
};

export const Episode = React.memo(EpisodeComponent);
