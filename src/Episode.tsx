import React, {useLayoutEffect, useMemo, useState} from 'react';
import {
	continueRender,
	delayRender,
	Sequence,
	staticFile,
	useVideoConfig,
} from 'remotion';
import {VideoClip, Props as VideoClipProps} from './VideoClip';
import {
	Slides,
	Props as SlidesProps,
	durationFromProps,
	durationFromText,
} from './Slides';
import {SPLASH_DURATION_S} from './constants';
import {Splash} from './Splash';
import {VideoMetadata, getVideoMetadata} from '@remotion/media-utils';

// eslint-disable-next-line react/no-unused-prop-types
export type SequenceRenderProps = VideoClipProps | SlidesProps;

export type Props = {script: SequenceRenderProps[]};

type Meta = (VideoMetadata & {scriptDuration: number}) | number;

export const Episode = React.memo<Props>(({script}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const [scriptMeta, setScriptMeta] = useState<null | Meta[]>(null);
	const [handle] = useState(() => delayRender());

	useLayoutEffect(() => {
		const meta = script.flatMap<Promise<Meta>>((s) =>
			Object.prototype.hasOwnProperty.call(s, 'videoClip')
				? [
						getVideoMetadata(staticFile((s as VideoClipProps).videoClip)).then(
							(d) => {
								const text =
									(s as VideoClipProps).textToSpeech?.flatMap((t) => t.text) ||
									[];
								const scriptDuration = durationFromText(text, fps);
								return {
									...d,
									scriptDuration,
								};
							}
						),
				  ]
				: [Promise.resolve(durationFromProps(s as SlidesProps, fps))]
		);
		(async () => {
			setScriptMeta(await Promise.all(meta));
			continueRender(handle);
		})();
	}, [script, handle, fps]);

	const clips = useMemo(() => {
		const totalClipsDurationTarget =
			durationInFrames - fps * SPLASH_DURATION_S * 2;
		const {
			totalSlidesDuration,
			totalVideoDurationInSeconds,
			videoSpeechDuration,
		} = scriptMeta?.reduce(
			(acc, meta) => {
				switch (typeof meta) {
					case 'number': {
						acc.totalSlidesDuration += meta;
						break;
					}
					case 'object': {
						acc.totalVideoDurationInSeconds += meta.durationInSeconds;
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
						const clipRelativeDuration =
							meta.durationInSeconds / totalVideoDurationInSeconds;
						const clipDurationTarget = Math.round(
							videoClipsDurationTarget * clipRelativeDuration
						);

						acc.elements.push(
							<Sequence
								key={`clip_${at}`}
								from={acc.from}
								durationInFrames={clipDurationTarget}
							>
								<VideoClip
									{...(props as VideoClipProps)}
									style={{width: '100%', height: '100%'}}
								/>
							</Sequence>
						);
						acc.from += clipDurationTarget;
					}
				}
				return acc;
			},
			{from: fps * SPLASH_DURATION_S, elements: [] as React.ReactElement[]}
		);
	}, [script, scriptMeta, fps, durationInFrames]);

	return (
		<>
			<Sequence durationInFrames={fps * SPLASH_DURATION_S}>
				<Splash duration={fps * SPLASH_DURATION_S} />
			</Sequence>
			{clips.elements}
			<Sequence
				from={durationInFrames - fps * SPLASH_DURATION_S}
				durationInFrames={fps * SPLASH_DURATION_S}
			>
				<Splash duration={fps * -SPLASH_DURATION_S} />
			</Sequence>
		</>
	);
});
