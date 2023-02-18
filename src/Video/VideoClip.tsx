import React, { useLayoutEffect } from 'react';
import {staticFile, useVideoConfig} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {COLOR_3} from '../constants';
import {ErrorWrapper} from '../ErrorWrapper';
import {durationFromText} from '../phrasesToSpeech';
import {ClipWithoutSpeech} from './ClipWithoutSpeech';
import {ClipWithSpeech} from './ClipWithSpeech';

// eslint-disable-next-line react/no-unused-prop-types
type SequenceRenderProps = {text: (string | number)[]; from: number, duration?: number};
// eslint-disable-next-line react/no-unused-prop-types
type BlurProps = {
	frames: [number, number];
	blurProps: {style?: Partial<React.CSSProperties>};
};

export type Props = {
	videoClipSrc: string;
	durationInSeconds: number;
	accelerate: number;
	textToSpeech?: SequenceRenderProps[];
	startFrom?: number;
	endAt?: number;
	style?: React.CSSProperties;
	blur?: BlurProps[];
	muted?: boolean;
	volume?: number | ((f: number) => number);
};

export type InternalProps = Omit<
	Props,
	'textToSpeech' | 'videoClipSrc' | 'blur' | 'accelerate' | 'durationInSeconds'
> & {startFrom: number; endAt: number};

function checkValidInputRange(arr: number[]) {
	for (let i = 1; i < arr.length; ++i) {
			if (!(arr[i] > arr[i - 1])) {
					throw new Error(`TTS from range must be strictly monotonically non-decreasing but got [${arr.slice(i-1).join(',')}]`);
			}
	}
}

export const VideoClip: React.FC<React.PropsWithChildren<Props>> = ({
	videoClipSrc,
	textToSpeech = [],
	accelerate,
	blur,
	durationInSeconds,
	...videoProps
}) => {
	const {fps, durationInFrames: targetDuration} = useVideoConfig();
	const src = staticFile(videoClipSrc);
	useLayoutEffect(() => {
		checkValidInputRange(textToSpeech.map(({from}) => from))
	}, [textToSpeech])
	return (
		<AbsoluteFill style={{backgroundColor: COLOR_3}} title={src}>
			{textToSpeech.length ? (
				textToSpeech.reduce(
					(acc, tts, at, all) => {
						const speechDuration = tts.duration || durationFromText(tts.text, fps);
						acc.clips.push(
							<ErrorWrapper key={`${at}_${tts.from}`}>
								<ClipWithSpeech
									{...videoProps}
									src={src}
									from={acc.from}
									textToSpeech={tts.text}
									startFrom={tts.from}
									endAt={tts.from + speechDuration}
									duration={speechDuration}
								/>
							</ErrorWrapper>
						);
						acc.from += speechDuration;
						const next = all[at + 1];
						const diff =
							(next
								? next.from - (videoProps.startFrom || 0)
								: durationInSeconds * fps) -
							(tts.from - (videoProps.startFrom || 0) + speechDuration);
						const acceleratedDuration = Math.round(diff / accelerate);
						if (acceleratedDuration > 0) {
							acc.clips.push(
								<ErrorWrapper key={`${at}_${tts.from}_accelerated`}>
									<ClipWithoutSpeech
										{...videoProps}
										src={src}
										from={acc.from}
										startFrom={tts.from + speechDuration}
										endAt={
											(next && next.from - 1) ||
											videoProps.endAt ||
											Math.round(durationInSeconds * fps)
										}
										duration={acceleratedDuration}
										accelerate={accelerate}
									/>
								</ErrorWrapper>
							);
							acc.from += acceleratedDuration;
						}

						return acc;
					},
					(textToSpeech.length && textToSpeech[0].from > 0
						? {
								clips: [
									<ErrorWrapper key={`before_${textToSpeech[0].from}`}>
										<ClipWithoutSpeech
											{...videoProps}
											src={src}
											from={0}
											startFrom={videoProps.startFrom || 0}
											endAt={textToSpeech[0].from}
											duration={Math.ceil((textToSpeech[0].from - (videoProps.startFrom || 0)) / accelerate)}
											accelerate={accelerate}
										/>
									</ErrorWrapper>,
								],
								from: Math.ceil(textToSpeech[0].from / accelerate),
						  }
						: {clips: [], from: 0}) as {
						clips: React.ReactElement[];
						from: number;
					}
				).clips
			) : (
				<ErrorWrapper>
					<ClipWithoutSpeech
						{...videoProps}
						src={src}
						from={0}
						startFrom={videoProps.startFrom || 0}
						endAt={videoProps.endAt || Math.round(durationInSeconds * fps)}
						duration={targetDuration}
						accelerate={accelerate}
					/>
				</ErrorWrapper>
			)}
		</AbsoluteFill>
	);
};
