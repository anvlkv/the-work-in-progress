import {getVideoMetadata, VideoMetadata} from '@remotion/media-utils';
import React, {useLayoutEffect, useMemo, useState} from 'react';
import {
	Sequence,
	staticFile,
	useVideoConfig,
	useCurrentFrame,
	delayRender,
	continueRender,
	Loop,
} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {AcceleratedVideo} from './AcceleratedVideo';
import {COLOR_2, COLOR_3} from './constants';
import {SpeakingHead} from './Head/SpeakingHead';
import { TalkingHead } from './Head/TalkingHead';
import {TiltingHead} from './Head/TiltingHead';
import {phrasesToSpeech} from './phrasesToSpeech';
import {durationFromText} from './Slides';

// eslint-disable-next-line react/no-unused-prop-types
type SequenceRenderProps = {text: (string | number)[]; from: number};
// eslint-disable-next-line react/no-unused-prop-types
type BlurProps = {
	frames: [number, number];
	blurProps: {style?: Partial<React.CSSProperties>};
};

export type Props = {
	videoClip: string;
	textToSpeech?: SequenceRenderProps[];
	startFrom?: number;
	endAt?: number;
	playbackRate?: number;
	volume?: number | ((frame: number) => number);
	blur?: BlurProps[];
	style?: React.CSSProperties;
	imageFormat?: 'jpeg' | 'png';
};
export const VideoClip: React.FC<Props> = ({
	videoClip,
	textToSpeech = [],
	blur,
	...videoProps
}) => {
	const {fps, durationInFrames: targetDuration} = useVideoConfig();
	// Const frame = useCurrentFrame();
	const src = staticFile(videoClip);
	const [srcMeta, setSrcMeta] = useState<null | VideoMetadata>(null);
	const [handle] = useState(() => delayRender());

	useLayoutEffect(() => {
		(async () => {
			setSrcMeta(await getVideoMetadata(src));
			continueRender(handle);
		})();
	}, [src, handle]);

	const [inputRange, outputRange, ttsSequence] = useMemo(() => {
		if (!srcMeta) {
			return [[], [], null] as [
				number[],
				number[],
				null | React.ReactElement[]
			];
		}
		const totalVideoDurationInFrames = srcMeta.durationInSeconds * fps;
		const durations = textToSpeech.map((txt) => {
			return durationFromText(txt.text, fps);
		});
		const ttsDuration = durations.reduce((acc, d) => acc + d, 0);
		const targetPlaybackRate =
			ttsDuration > totalVideoDurationInFrames
				? ttsDuration / targetDuration
				: (totalVideoDurationInFrames + ttsDuration) / targetDuration;
		const inputRange = [0, targetDuration];
		const outputRange = [targetPlaybackRate, targetPlaybackRate];
		const sequenceEntries: React.ReactElement[] = [];
		textToSpeech.forEach((txt, at) => {
			const duration = durations[at];
			const fromFrame = Math.round(txt.from / targetPlaybackRate);
			const previousSpeechEndFrame = inputRange[inputRange.length - 2];
			
			// TODO: make it work with slowing down
			if (previousSpeechEndFrame === fromFrame) {
				inputRange.splice(inputRange.length - 1, 0, fromFrame + duration);
				outputRange.splice(outputRange.length - 2, 1, 1, 1);
			}
			else {
				sequenceEntries.push(
					<Sequence
						key={`${at}_tiltingHead`}
						from={previousSpeechEndFrame}
						durationInFrames={fromFrame - previousSpeechEndFrame}
					>
						<Loop durationInFrames={60*fps}>
							<TiltingHead />
						</Loop>
					</Sequence>
				);
				inputRange.splice(inputRange.length - 1, 0, fromFrame);
				inputRange.splice(inputRange.length - 1, 0, fromFrame + duration);
				outputRange.splice(outputRange.length - 1, 0, 1, 1);
			}
			sequenceEntries.push(
				<Sequence
					key={`${at}_${fromFrame}`}
					from={fromFrame}
					durationInFrames={duration}
				>
					{typeof txt.text[0] === 'number' ? (
						<>
							<Sequence durationInFrames={txt.text[0] * fps}>
								<TiltingHead />
							</Sequence>
							<Sequence from={txt.text[0] * fps}>
								<SpeakingHead ssml text={phrasesToSpeech(txt.text.slice(1))} />
							</Sequence>
						</>
					) : (
						<SpeakingHead ssml text={phrasesToSpeech(txt.text)} />
					)}
				</Sequence>
			);
		});

		const endingDuration =
			inputRange[inputRange.length - 1] - inputRange[inputRange.length - 2];
		if (sequenceEntries.length && endingDuration) {
			sequenceEntries.push(
				<Sequence
					key="final_tiltingHead"
					from={inputRange[inputRange.length - 2]}
				>
					<Loop durationInFrames={60*fps}>
						<TiltingHead />
					</Loop>
				</Sequence>
			);
		}

		return [
			inputRange,
			outputRange,
			sequenceEntries.length ? sequenceEntries : null,
		];
	}, [srcMeta, targetDuration, fps, textToSpeech]);

	if (!srcMeta) {
		return null;
	}

	return (
		<AbsoluteFill style={{backgroundColor: COLOR_3}} title={src}>
			<AcceleratedVideo
				muted={ttsSequence}
				src={src}
				{...videoProps}
				inputRange={inputRange}
				outputRange={outputRange}
			/>
			<AbsoluteFill
				style={{
					backgroundColor: COLOR_2,
					width: '20%',
					height: '25%',
					position: 'absolute',
					bottom: '3%',
					right: 0,
					top: 'unset',
					left: 'unset',
				}}
			>
				{ttsSequence ? ttsSequence : <TalkingHead fileName={src} />}
			</AbsoluteFill>
			{/* blur &&
					blur.map(({frames: [from, to], blurProps}, at) => {
						return (
							<Sequence
								key={`${from}_${to}_${at}`}
								from={from}
								durationInFrames={to - from}
							>
								<Blur {...blurProps} />
							</Sequence>
						);
					}) */}
		</AbsoluteFill>
	);
};
