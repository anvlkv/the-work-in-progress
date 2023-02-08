import React, {useLayoutEffect, useMemo, useState} from 'react';
import {
	continueRender,
	delayRender,
	Sequence,
	staticFile,
	useVideoConfig,
} from 'remotion';
import {VideoClip, Props as VideoClipProps} from './Video/VideoClip';
import {Slides, Props as SlidesProps} from './Slides';
import {COLOR_3, SPLASH_DURATION_S} from './constants';
import {Splash} from './Splash';
import {VideoMetadata, getVideoMetadata} from '@remotion/media-utils';
import {Clock} from './Clock';
import {durationFromText, durationFromProps} from './phrasesToSpeech';
import {useLocalStorage} from 'react-use';
import {ErrorWrapper} from './ErrorWrapper';

// eslint-disable-next-line react/no-unused-prop-types
export type SequenceRenderProps =
	| Omit<VideoClipProps, 'accelerate' | 'durationInSeconds'>
	| SlidesProps;

export type Props = {script: SequenceRenderProps[]; id?: string};

type Meta = (VideoMetadata & {scriptDuration: number}) | number;

export const Episode = React.memo<Props>(({script, id}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const [scriptMeta, setScriptMeta] = useLocalStorage<Meta[] | null>(
		`meta_${id}`,
		null
	);
	const [handle] = useState(() => delayRender());

	useLayoutEffect(() => {
		if (scriptMeta) {
			continueRender(handle);
		} else {
			const meta = script.flatMap<Promise<Meta>>((s) =>
				Object.prototype.hasOwnProperty.call(s, 'videoClipSrc')
					? [
							getVideoMetadata(
								staticFile((s as VideoClipProps).videoClipSrc)
							).then((d) => {
								const text =
									(s as VideoClipProps).textToSpeech?.flatMap((t) => t.text) ||
									[];
								const scriptDuration = durationFromText(text, fps);
								return {
									...d,
									scriptDuration,
								};
							}),
					  ]
					: [Promise.resolve(durationFromProps(s as SlidesProps, fps))]
			);
			(async () => {
				setScriptMeta(await Promise.all(meta));
				continueRender(handle);
			})();
		}
	}, [script, handle, fps, setScriptMeta, scriptMeta]);

	const clips = useMemo(() => {
		if (!scriptMeta) {
			return {
				from: fps * SPLASH_DURATION_S,
				elapsedVideo: 0,
				elements: [],
			};
		}
		const totalClipsDurationTarget =
			durationInFrames - fps * SPLASH_DURATION_S * 2;
		const {
			totalSlidesDuration,
			totalVideoDurationInSeconds,
			videoSpeechDuration,
		} = scriptMeta.reduce(
			(acc, meta, at) => {
				switch (typeof meta) {
					case 'number': {
						acc.totalSlidesDuration += meta;
						break;
					}
					case 'object': {
						const trimStart =
							((script[at] as VideoClipProps).startFrom || 0) / fps;
						const trimEnd = ((script[at] as VideoClipProps).endAt || 0) / fps;
						acc.totalVideoDurationInSeconds +=
							meta.durationInSeconds -
							trimStart -
							(meta.durationInSeconds - (trimEnd || meta.durationInSeconds));
						acc.videoSpeechDuration += meta.scriptDuration;
						break;
					}
					default: {
						break;
					}
				}
				return acc;
			},
			{
				totalSlidesDuration: 0,
				totalVideoDurationInSeconds: 0,
				videoSpeechDuration: 0,
			}
		) || {
			totalSlidesDuration: 0,
			totalVideoDurationInSeconds: 0,
			videoSpeechDuration: 0,
		};

		const videoClipsDurationTarget =
			totalClipsDurationTarget - totalSlidesDuration;
		const acceleratedPlaybackRate =
			(totalVideoDurationInSeconds * fps - videoSpeechDuration) /
			(videoClipsDurationTarget - videoSpeechDuration);

		return script.reduce(
			(acc, props, at) => {
				if (scriptMeta) {
					const meta = scriptMeta[at];
					if (typeof meta === 'number') {
						acc.elements.push(
							<Sequence
								key={`slides_${at}`}
								from={acc.from}
								durationInFrames={meta}
							>
								<Slides {...(props as SlidesProps)} />
							</Sequence>
						);
						acc.from += meta;
					} else {
						const trimStart =
							((script[at] as VideoClipProps).startFrom || 0) / fps;
						const trimEnd = ((script[at] as VideoClipProps).endAt || 0) / fps;
						const durationInSeconds =
							meta.durationInSeconds -
							trimStart -
							(meta.durationInSeconds - (trimEnd || meta.durationInSeconds));
						// const clipRelativeDuration =
						// 	durationInSeconds / totalVideoDurationInSeconds;
						const clipDurationTarget = Math.round(
							meta.scriptDuration +
								(durationInSeconds * fps - meta.scriptDuration) /
									acceleratedPlaybackRate
						);
						// console.log({clipDurationTarget, durationInSeconds});
						acc.elements.push(
							<Sequence
								key={`clip_${at}`}
								from={acc.from}
								durationInFrames={clipDurationTarget}
							>
								<VideoClip
									muted
									{...(props as VideoClipProps)}
									durationInSeconds={durationInSeconds}
									accelerate={acceleratedPlaybackRate}
									style={{
										width: '100%',
										height: '100%',
										backgroundColor: COLOR_3,
									}}
								>
									<Clock elapsedFrames={acc.elapsedVideo} />
								</VideoClip>
							</Sequence>
						);
						acc.elapsedVideo += meta.durationInSeconds * fps;
						acc.from += clipDurationTarget;
					}
				}
				return acc;
			},
			{
				from: fps * SPLASH_DURATION_S,
				elapsedVideo: 0,
				elements: [] as React.ReactElement[],
			}
		);
	}, [script, scriptMeta, fps, durationInFrames]);

	return (
		<>
			<Sequence durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * SPLASH_DURATION_S} />
			</Sequence>
			<ErrorWrapper>{clips.elements}</ErrorWrapper>
			<Sequence
				from={durationInFrames - fps * SPLASH_DURATION_S}
				durationInFrames={fps * SPLASH_DURATION_S}
			>
				<Splash duration={fps * -SPLASH_DURATION_S} />
			</Sequence>
		</>
	);
});
