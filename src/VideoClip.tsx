import {VideoMetadata, getVideoMetadata} from '@remotion/media-utils';
import React, {useLayoutEffect, useState} from 'react';
import {
	Sequence,
	staticFile,
	useVideoConfig,
	Loop,
	Video,
	continueRender,
	delayRender,
} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {AcceleratedVideo} from './AcceleratedVideo';
import {COLOR_2, COLOR_3} from './constants';
import {SpeakingHead} from './Head/SpeakingHead';
import {TiltingHead} from './Head/TiltingHead';
import {phrasesToSpeech, durationFromText} from './phrasesToSpeech';

// eslint-disable-next-line react/no-unused-prop-types
type SequenceRenderProps = {text: (string | number)[]; from: number};
// eslint-disable-next-line react/no-unused-prop-types
type BlurProps = {
	frames: [number, number];
	blurProps: {style?: Partial<React.CSSProperties>};
};

export type Props = {
	videoClipSrc: string;
	accelerate: number;
	textToSpeech?: SequenceRenderProps[];
	startFrom?: number;
	endAt?: number;
	style?: React.CSSProperties;
	blur?: BlurProps[];
	muted?: boolean;
	volume?: number | ((f: number)=> number)
};

type InternalProps = Omit<
	Props,
	'textToSpeech' | 'videoClipSrc' | 'blur' | 'accelerate'
>;

type VideoClipWithSpeechProps = InternalProps & {
	textToSpeech: (string | number)[];
	from: number;
	startFrom: number;
	src: string;
	duration: number;
};

type VideoClipWithoutSpeechProps = InternalProps & {
	from: number;
	startFrom: number;
	src: string;
	duration: number;
	accelerate: number;
};

const VideoClipWithSpeech: React.FC<
	React.PropsWithChildren<VideoClipWithSpeechProps>
> = ({from, textToSpeech, duration, ...videoProps}) => {
	const {fps} = useVideoConfig();

	return (
		<Sequence durationInFrames={duration} from={from}>
			<Video {...videoProps} />
			<AbsoluteFill
				style={{
					backgroundColor: COLOR_2,
					width: '20%',
					height: '25%',
					position: 'absolute',
					bottom: 0,
					right: 0,
					top: 'unset',
					left: 'unset',
				}}
			>
				{typeof textToSpeech[0] === 'number' ? (
					<>
						<Sequence durationInFrames={textToSpeech[0] * fps}>
							<TiltingHead />
						</Sequence>
						<Sequence from={textToSpeech[0] * fps}>
							<SpeakingHead
								ssml
								text={phrasesToSpeech(textToSpeech.slice(1))}
							/>
						</Sequence>
					</>
				) : (
					<SpeakingHead ssml text={phrasesToSpeech(textToSpeech)} />
				)}
			</AbsoluteFill>
		</Sequence>
	);
};

const VideoClipWithoutSpeech: React.FC<
	React.PropsWithChildren<VideoClipWithoutSpeechProps>
> = ({from, duration, accelerate, ...videoProps}) => {
	const {fps} = useVideoConfig();

	return (
		<Sequence durationInFrames={duration} from={from}>
			<AcceleratedVideo
				inputRange={[0, duration]}
				outputRange={[1, accelerate]}
				{...videoProps}
			/>
			<AbsoluteFill
				style={{
					backgroundColor: COLOR_2,
					width: '20%',
					height: '25%',
					position: 'absolute',
					bottom: 0,
					right: 0,
					top: 'unset',
					left: 'unset',
				}}
			>
				<Loop durationInFrames={60 * fps}>
					<TiltingHead />
				</Loop>
			</AbsoluteFill>
		</Sequence>
	);
};

export const VideoClip: React.FC<React.PropsWithChildren<Props>> = ({
	videoClipSrc,
	textToSpeech = [],
	accelerate,
	blur,
	...videoProps
}) => {
	const {fps, durationInFrames: targetDuration} = useVideoConfig();
	const src = staticFile(videoClipSrc);
	const [srcMeta, setSrcMeta] = useState<null | VideoMetadata>(null);
	const [handle] = useState(() => delayRender());

	useLayoutEffect(() => {
		(async () => {
			setSrcMeta(await getVideoMetadata(src));
			continueRender(handle);
		})();
	}, [src, handle]);

	if (!srcMeta) {
		return null;
	}

	return (
		<AbsoluteFill style={{backgroundColor: COLOR_3}} title={src}>
			{textToSpeech.length ? (
				textToSpeech.reduce(
					(acc, tts, at, all) => {
						const speechDuration = durationFromText(tts.text, fps);
						acc.clips.push(
							<VideoClipWithSpeech
								key={`${at}_${tts.from}`}
								{...videoProps}
								src={src}
								from={acc.from}
								textToSpeech={tts.text}
								startFrom={tts.from}
								duration={speechDuration}
							/>
						);
						acc.from += speechDuration;
						const next = all[at + 1];
						const diff =
							(next
								? next.from
								: videoProps.endAt
								? videoProps.endAt
								: srcMeta.durationInSeconds * fps) -
							(tts.from + speechDuration);
						const acceleratedDuration = Math.ceil(diff / accelerate);
						acc.clips.push(
							<VideoClipWithoutSpeech
								key={`${at}_${tts.from}_accelerated`}
								{...videoProps}
								src={src}
								from={acc.from + speechDuration}
								startFrom={tts.from + speechDuration}
								duration={acceleratedDuration}
								accelerate={accelerate}
							/>
						);
						acc.from += acceleratedDuration;

						return acc;
					},
					(textToSpeech.length && textToSpeech[0].from > 0
						? {
								clips: [
									<VideoClipWithoutSpeech
										key={`before_${textToSpeech[0].from}`}
										{...videoProps}
										src={src}
										from={0}
										startFrom={videoProps.startFrom || 0}
										duration={Math.ceil(textToSpeech[0].from / accelerate)}
										accelerate={accelerate}
									/>,
								],
								from: textToSpeech[0].from,
						  }
						: {clips: [], from: 0}) as {
						clips: React.ReactElement[];
						from: number;
					}
				).clips
			) : (
				<VideoClipWithoutSpeech
					{...videoProps}
					src={src}
					from={0}
					startFrom={videoProps.startFrom || 0}
					duration={targetDuration}
					accelerate={accelerate}
				/>
			)}
		</AbsoluteFill>
	);
};
