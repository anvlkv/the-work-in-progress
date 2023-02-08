import React from 'react';
import {staticFile, useVideoConfig} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {COLOR_3} from '../constants';
import {ErrorWrapper} from '../ErrorWrapper';
import {durationFromText} from '../phrasesToSpeech';
import {ClipWithoutSpeech} from './ClipWithoutSpeech';
import {ClipWithSpeech} from './ClipWithSpeech';

// eslint-disable-next-line react/no-unused-prop-types
type SequenceRenderProps = {text: (string | number)[]; from: number};
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
>;

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
	return (
		<AbsoluteFill style={{backgroundColor: COLOR_3}} title={src}>
			{textToSpeech.length ? (
				textToSpeech.reduce(
					(acc, tts, at, all) => {
						const speechDuration = durationFromText(tts.text, fps);
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
						const acceleratedDuration = Math.ceil(diff / accelerate);
						if (acceleratedDuration > 0){
							acc.clips.push(
								<ErrorWrapper key={`${at}_${tts.from}_accelerated`}>
									<ClipWithoutSpeech
										{...videoProps}
										src={src}
										from={acc.from}
										startFrom={tts.from + speechDuration}
										endAt={next?.from}
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
											duration={Math.ceil(textToSpeech[0].from / accelerate)}
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
						duration={targetDuration}
						accelerate={accelerate}
					/>
				</ErrorWrapper>
			)}
		</AbsoluteFill>
	);
};
