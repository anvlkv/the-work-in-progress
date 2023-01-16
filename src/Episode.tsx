import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {VideoClip, Props as VideoClipProps} from './VideoClip';
import {Slides, Props as SlidesProps, durationFromProps} from './Slides';
import {SPLASH_DURATION_S} from './constants';
import {Splash} from './Splash';

// eslint-disable-next-line react/no-unused-prop-types
export type SequenceRenderProps =
	| (VideoClipProps & {durationInSeconds: number})
	| SlidesProps;

export type Props = {script: SequenceRenderProps[]};

export const Episode = React.memo<Props>(({script}) => {
	const {fps, durationInFrames} = useVideoConfig();
	let from = fps * SPLASH_DURATION_S;
	function renderSequence(props: SequenceRenderProps, at: number, all: SequenceRenderProps[]) {
		let result = <></>;
		let sequenceDuration = 0;
		if (Object.prototype.hasOwnProperty.call(props, 'script')) {
			sequenceDuration = durationFromProps(props as SlidesProps, fps);
			result = (
				<Sequence
					key={`slides_${at}`}
					from={from}
					durationInFrames={sequenceDuration}
				>
					<Slides {...(props as SlidesProps)} />
				</Sequence>
			);
		} else {
			const {durationInSeconds, ...vcProps} = props as VideoClipProps & {
				durationInSeconds: number;
			};
			const speechDuration =
				durationFromProps(
					{
						script: vcProps.textToSpeech
							? [{textToSpeech: vcProps.textToSpeech.flatMap((t) => t.text)}]
							: [],
					},
					fps
				) || 0;
			sequenceDuration = durationInFrames - from - all.slice(at).reduce((acc, e) => {
				if (Object.prototype.hasOwnProperty.call(e, 'script')) {
					return acc + durationFromProps(e as SlidesProps, fps);
				}
				return acc
			}, speechDuration)
			result = (
				<Sequence
					key={`${vcProps.videoClip}_${at}`}
					from={from}
					durationInFrames={sequenceDuration}
				>
					<VideoClip {...vcProps} durationInFrames={durationInSeconds * fps} />
				</Sequence>
			);
		}
		from += sequenceDuration;
		return result;
	}
	const clips = script.map(renderSequence);

	console.log('episode', 'duration', from + fps * SPLASH_DURATION_S);
	return (
		<>
			<Sequence durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * SPLASH_DURATION_S} />
			</Sequence>
			{clips}
			<Sequence from={from} durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * -SPLASH_DURATION_S} />
			</Sequence>
		</>
	);
});
