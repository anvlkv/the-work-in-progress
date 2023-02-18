import React, {useLayoutEffect, useMemo, useState} from 'react';
import {
	continueRender,
	delayRender,
	prefetch,
	Sequence,
	staticFile,
	useVideoConfig,
} from 'remotion';
import {VideoClip, Props as VideoClipProps} from './Video/VideoClip';
import {Slides, Props as SlidesProps} from './Slides';
import {COLOR_3, SPLASH_DURATION_S} from './constants';
import {Splash} from './Splash';
import {
	VideoMetadata,
	getVideoMetadata,
	getAudioDurationInSeconds,
} from '@remotion/media-utils';
import {Clock} from './Clock';
import {
	durationFromText,
	durationFromProps,
	phrasesToTTsUrl,
} from './phrasesToSpeech';
import {useLocalStorage} from 'react-use';
import hash from 'object-hash';
import {ErrorWrapper} from './ErrorWrapper';
import { EP_DURATION_FRAMES } from './Episodes/constants';

// eslint-disable-next-line react/no-unused-prop-types
export type SequenceRenderProps =
	| Omit<VideoClipProps, 'accelerate' | 'durationInSeconds'>
	| SlidesProps;

export type Props = {script: SequenceRenderProps[]; id?: string, durationInFrames?: number};

type Meta =
	| (VideoMetadata & {
			scriptDuration: number;
			scriptDurations: {from: number; duration: number}[];
	  })
	| number[];

export const Episode = React.memo<Props>(({script, id, durationInFrames = EP_DURATION_FRAMES}) => {
	const epHash = useMemo(() => hash(script), [script]);
	const {fps} = useVideoConfig();
	console.info(`Episode ${id}: ${epHash}`);
	const [scriptMeta, setScriptMeta] = useLocalStorage<Meta[] | null>(
		`meta_${id}_${epHash}`,
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
							).then(async (d) => {
								// const text =
								// 	.textToSpeech?.flatMap((t) => t.text) ||
								// 	[];
								const scriptMeta = (s as VideoClipProps).textToSpeech?.map(
									({from, text}) => {
										const textUrl = text.length && phrasesToTTsUrl(text);
										return textUrl
											? prefetch(textUrl)
													.waitUntilDone()
													.then((d) => getAudioDurationInSeconds(textUrl))
													.then((d) =>
														Math.round(
															(d +
																(typeof text[0] === 'number' ? text[0] : 0)) *
																fps
														)
													)
													.then((duration) => ({from, duration}))
											: Promise.resolve({
													from,
													duration: 0,
											  });
									}
								);

								const scriptDurations = [] as {
									from: number;
									duration: number;
								}[];
								let scriptDuration = 0;
								if (scriptMeta) {
									scriptDurations.push(...(await Promise.all(scriptMeta)));
									scriptDuration = scriptDurations.reduce(
										(acc, {duration}) => acc + duration,
										0
									);
								}

								return {
									...d,
									scriptDurations,
									scriptDuration,
								};
							}),
					  ]
					: Promise.all(
							(s as SlidesProps).script.map(({textToSpeech}) => {
								const textUrl = phrasesToTTsUrl(textToSpeech);
								return prefetch(textUrl)
									.waitUntilDone()
									.then(() =>
										getAudioDurationInSeconds(textUrl).then((d) =>
											Math.round(
												d * fps +
													(typeof textToSpeech[0] === 'number'
														? textToSpeech[0]
														: 0)
											)
										)
									);
							})
					  )
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
				if (Array.isArray(meta)) {
					acc.totalSlidesDuration += meta.reduce((acc, d) => acc + d, 0);
				} else {
					const trimStart =
						((script[at] as VideoClipProps).startFrom || 0) / fps;
					const trimEnd = ((script[at] as VideoClipProps).endAt || 0) / fps;
					acc.totalVideoDurationInSeconds +=
						meta.durationInSeconds -
						trimStart -
						(meta.durationInSeconds - (trimEnd || meta.durationInSeconds));
					acc.videoSpeechDuration += meta.scriptDuration;
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

		return script.reduce(
			(acc, props, at) => {
				const meta = scriptMeta[at];
				if (scriptMeta) {
					if (Array.isArray(meta)) {
						let duration = 0;
						// TODO: HA-HA!
						const slideProps = {...props} as SlidesProps;
						slideProps.script.forEach((s, at) => {
							duration += meta[at];
							s.duration = meta[at]
						});
						acc.elements.push(
							<Sequence
								key={`slides_${at}`}
								from={acc.from}
								durationInFrames={duration}
							>
								<Slides {...slideProps} />
							</Sequence>
						);
						acc.from += duration;
					} else {
						const videoProps = props as VideoClipProps;
						const ttsWithMeta = videoProps.textToSpeech?.map((t, at) => {
							return {
								...t,
								duration: meta.scriptDurations[at].duration,
							};
						});
						const trimStart =
							((script[at] as VideoClipProps).startFrom || 0) / fps;
						const trimEnd = ((script[at] as VideoClipProps).endAt || 0) / fps;
						const durationInSeconds =
							meta.durationInSeconds -
							trimStart -
							(meta.durationInSeconds - (trimEnd || meta.durationInSeconds));
						const clipRelativeDuration =
							durationInSeconds / totalVideoDurationInSeconds;
						const acceleratedPlaybackRate =
							(durationInSeconds * fps - meta.scriptDuration) /
							(videoClipsDurationTarget * clipRelativeDuration -
								meta.scriptDuration);
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
									{...videoProps}
									textToSpeech={ttsWithMeta}
									durationInSeconds={durationInSeconds}
									accelerate={acceleratedPlaybackRate}
									style={{
										width: '100%',
										height: '100%',
										backgroundColor: COLOR_3,
									}}
								>
									<Clock
										elapsedFrames={acc.elapsedVideo}
										file={videoProps.videoClipSrc}
									/>
								</VideoClip>
							</Sequence>
						);
						acc.elapsedVideo += Math.round(meta.durationInSeconds * fps);
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
		<Sequence durationInFrames={durationInFrames}>
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
		</Sequence>
	);
});
