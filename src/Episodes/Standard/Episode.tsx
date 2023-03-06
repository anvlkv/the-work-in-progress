import React, {useMemo} from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {FrameMapping, VideoClip} from '../../Video/VideoClip';
import {Slides} from '../../Slides/Slides';
import {SAFE_PLAYBACK_RATE, SPLASH_DURATION_S} from '../../constants';
import {Splash} from '../../Splash';
import {Clock} from '../../Clock';
import {EpProps, VideoClipMeta, SlidesMeta} from './types';
import {useEpisodeMeta} from './useEpisodeMeta';
import {BlurProps} from '../../Video/Blur';

type EpSequenceProps = Omit<EpProps, 'durationInFrames'> & {
	id: string;
	targetDuration: number;
};

const EpisodeClips = React.memo<EpSequenceProps>(
	({script, id, targetDuration}) => {
		const {fps} = useVideoConfig();
		const {scriptMeta, epMeta} = useEpisodeMeta(`${id}`, script, fps);

		if (!scriptMeta) {
			return null;
		}

		const retrofitDuration =
			targetDuration -
			epMeta.totalNormalSpeedFrames -
			epMeta.totalSlidesDuration;

		const framesToAccelerateAll =
			epMeta.totalSafeAcceleratedFrames + epMeta.totalFastForwardFrames;

		const framesToAccelerateSafe = epMeta.totalSafeAcceleratedFrames;
		
		const requiredAcceleration = framesToAccelerateAll / retrofitDuration;

		let fastForwardAcceleration = requiredAcceleration;
		let safeAcceleration = requiredAcceleration;

		if (safeAcceleration > SAFE_PLAYBACK_RATE) {
			safeAcceleration = SAFE_PLAYBACK_RATE;
			const safeAcceleratedFrames = Math.round(
				framesToAccelerateSafe / safeAcceleration
			);
			const leftOverAcceleration =
				(epMeta.totalVideoDuration -
					framesToAccelerateSafe -
					epMeta.totalNormalSpeedFrames) /
				(retrofitDuration - safeAcceleratedFrames);
			fastForwardAcceleration = leftOverAcceleration;

			if (retrofitDuration < safeAcceleratedFrames) {
				throw new Error(
					`can not retrofit ${retrofitDuration} < ${safeAcceleratedFrames} by ${
						safeAcceleratedFrames - retrofitDuration
					}`
				);
			}
		}

		console.log({
			retrofitDuration,
			requiredAcceleration,
			framesToAccelerateAll,
			framesToAccelerateSafe,
			fastForwardAcceleration,
			safeAcceleration,
		});

		let from = 0;
		let elapsedVideo = 0;
		return (
			<>
				{script.map(({type, props}, at, all) => {
					const meta = scriptMeta[at];
					let result = <></>;

					if (type === 'slides') {
						const sMeta = meta as SlidesMeta;
						result = (
							<Slides
								key={`slides_${at}`}
								script={sMeta.remappedTTS.map(([tFrom, to], at) => {
									const d = to - tFrom;
									from += d;
									return [from - d, d + from, props[at]];
								})}
							/>
						);
					} else if (type === 'video') {
						const vMeta = meta as VideoClipMeta;
						const originalDuration = Math.round(
							vMeta.originalDurationInSeconds * fps
						);
						const clipDurationTarget = Math.round(
							vMeta.normalSpeedFrames +
								vMeta.fastForwardFrames / fastForwardAcceleration +
								(vMeta.duration -
									vMeta.normalSpeedFrames -
									vMeta.fastForwardFrames) /
									safeAcceleration
						);
						result = (
							<VideoEntry
								key={`video_${props.src}_${at}`}
								from={from}
								vMeta={vMeta}
								blur={props.blur}
								volume={props.volume}
								endAt={props.endAt}
								startFrom={props.startFrom}
								safeAcceleration={safeAcceleration}
								fastForwardAcceleration={fastForwardAcceleration}
								src={props.src}
								clipDurationTarget={clipDurationTarget}
								elapsedVideo={elapsedVideo}
							/>
						);
						from += clipDurationTarget;
						elapsedVideo += originalDuration;
					}
					return result;
				})}
			</>
		);
	}
);

const VideoEntry: React.FC<{
	vMeta: VideoClipMeta;
	from: number;
	clipDurationTarget: number;
	safeAcceleration: number;
	fastForwardAcceleration: number;
	elapsedVideo: number;
	src: string;
	startFrom?: number;
	endAt?: number;
	blur?: FrameMapping<BlurProps>[];
	volume?: FrameMapping<number>[];
}> = ({
	vMeta,
	clipDurationTarget,
	safeAcceleration,
	fastForwardAcceleration,
	from,
	elapsedVideo,
	src,
	startFrom,
	endAt,
	blur,
	volume,
}) => {
	const playbackRateMapping = useMemo(() => {
		const frameMap = new Map<number, number>();

		for (
			let i = 0, acceleration = [0, 0, safeAcceleration];
			i <= vMeta.duration;
			i++
		) {
			if (acceleration[1] === i) {
				const ffFragment = vMeta.remappedFastForward.find(
					([from, to]) => from <= i && i <= to
				);
				const nsFragment = vMeta.remappedNormalSpeed.find(
					([from, to]) => from <= i && i <= to
				);
				if (ffFragment) {
					acceleration = [
						ffFragment[0],
						ffFragment[1],
						fastForwardAcceleration,
					];
				} else if (nsFragment) {
					acceleration = [nsFragment[0], nsFragment[1], 1];
				} else {
					acceleration = [i + 1, vMeta.duration, safeAcceleration];
				}
			}
			frameMap.set(i, acceleration[2]);
		}

		return Array.from(frameMap.entries()).reduce((acc, [frame, speed]) => {
			const last = acc[acc.length - 1];
			if (last && speed === last[2]) {
				last[1] = frame;
			} else {
				acc.push([frame, frame, speed]);
			}
			return acc;
		}, [] as FrameMapping<number>[]);
	}, [
		fastForwardAcceleration,
		safeAcceleration,
		vMeta.duration,
		vMeta.remappedFastForward,
		vMeta.remappedNormalSpeed,
	]);

	return (
		<Sequence from={from} durationInFrames={clipDurationTarget}>
			<VideoClip
				videoClipSrc={src}
				startFrom={startFrom}
				endAt={endAt}
				blurMapping={blur}
				volumeMapping={volume}
				playbackRateMapping={playbackRateMapping}
				durationInSeconds={vMeta.durationInSeconds}
			>
				<Clock elapsedFrames={elapsedVideo} file={src} />
			</VideoClip>
		</Sequence>
	);
};

const EpisodeAudio = React.memo<EpSequenceProps>(({script, id}) => {
	const {fps} = useVideoConfig();
	const {scriptMeta, epMeta} = useEpisodeMeta(`${id}`, script, fps);
	if (!scriptMeta) {
		return null;
	}
	return <></>;
});

const EpisodeSpeechBooth = React.memo<EpSequenceProps>(({script, id}) => {
	const {fps} = useVideoConfig();
	const {scriptMeta, epMeta} = useEpisodeMeta(`${id}`, script, fps);
	if (!scriptMeta) {
		return null;
	}
	return <></>;
});

export const Episode: React.FC<EpProps> = ({
	script,
	id,
	editorMode,
	chunked,
}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const {scriptMeta, epMeta} = useEpisodeMeta(`${id}`, script, fps);

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

	return (
		<Sequence name={id} from={from} durationInFrames={sequenceDuration}>
			<Sequence durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * SPLASH_DURATION_S} />
			</Sequence>
			<Sequence
				from={fps * SPLASH_DURATION_S}
				durationInFrames={totalClipsDurationTarget}
			>
				<EpisodeClips
					script={script}
					id={`${id}`}
					editorMode={Boolean(editorMode)}
					targetDuration={totalClipsDurationTarget}
				/>
				<EpisodeAudio
					script={script}
					id={`${id}`}
					editorMode={Boolean(editorMode)}
					targetDuration={totalClipsDurationTarget}
				/>
				<EpisodeSpeechBooth
					script={script}
					id={`${id}`}
					editorMode={Boolean(editorMode)}
					targetDuration={totalClipsDurationTarget}
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
