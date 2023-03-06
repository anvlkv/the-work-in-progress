import React, {useCallback, useLayoutEffect} from 'react';
import {interpolate, staticFile, useVideoConfig} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {Blur, BlurProps} from './Blur';
import {COLOR_3, SAFE_PLAYBACK_RATE} from '../constants';
import {
	AcceleratedVideo,
	AcceleratedVideoProps,
	remapSpeed,
} from './AcceleratedVideo';
import {NormalSpeedVideo, NormalSpeedVideoProps} from './NormalSpeedVideo';
import {RemappedFrameContextProvider} from './RemappedFrameContext';
import {FastForwardVideo} from './FastForwardVideo';

export type FrameMapping<T> = [start: number, end: number, value: T];

export type Props = {
	videoClipSrc: string;
	durationInSeconds?: number;
	startFrom?: number;
	endAt?: number;
	style?: React.CSSProperties;
	muted?: boolean;
	blurMapping?: FrameMapping<BlurProps>[];
	volumeMapping?: FrameMapping<number>[];
	playbackRateMapping?: FrameMapping<number>[];
};

export type InternalProps = Omit<
	Props,
	| 'playbackRate'
	| 'videoClipSrc'
	| 'blur'
	| 'accelerate'
	| 'durationInSeconds'
	| 'muted'
> & {startFrom: number; endAt: number};

export const VideoClip: React.FC<
	React.PropsWithChildren<Props & {durationInSeconds: number}>
> = ({
	videoClipSrc,
	blurMapping: blur,
	durationInSeconds,
	playbackRateMapping,
	volumeMapping,
	...videoProps
}) => {
	const {fps, durationInFrames: targetDuration} = useVideoConfig();
	const src = staticFile(videoClipSrc);

	const encodeClipSrc = videoClipSrc.replace(/[/.]/g, '_');
	const clipDuration = Math.round(durationInSeconds * fps);

	const WrappedChildren = useCallback(
		({children}: React.PropsWithChildren) => (
			<>
				<Blur fragments={blur || []} id={encodeClipSrc} />
				{children}
			</>
		),
		[blur, encodeClipSrc]
	);

	const MappedSequence = useCallback(
		({
			children,
			...props
		}: React.PropsWithChildren<
			NormalSpeedVideoProps | AcceleratedVideoProps
		>) => {
			if (!playbackRateMapping) {
				return <NormalSpeedVideo {...props} volumeMapping={volumeMapping} />;
			}

			return (
				<>
					{
						playbackRateMapping.reduce(
							(acc, [from, to, value], at, all) => {
								const duration = Math.round((to - from) / value);

								if (value === 1) {
									acc.elements.push(
										<RemappedFrameContextProvider
											key={`ns_${from}_${to}`}
											speedFn={(f, renderFrom) =>
												f + renderFrom + from
											}
										>
											<NormalSpeedVideo
												{...props}
												volumeMapping={volumeMapping}
												startFrom={from}
												endAt={to}
												duration={to-from}
												from={acc.renderFrom}
											>
												{children}
											</NormalSpeedVideo>
										</RemappedFrameContextProvider>
									);
								}
								else {
									const safeAccelerate = Math.min(value, SAFE_PLAYBACK_RATE);
	
									if (value <= SAFE_PLAYBACK_RATE) {
										const speedFn = (f: number) =>
											interpolate(
												f,
												[
													from,
													Math.round((from + duration) / 4),
													Math.round(((from + duration) / 4) * 3),
													from + duration,
												],
												[
													from === (props.startFrom || 0) ? safeAccelerate : 1,
													safeAccelerate,
													safeAccelerate,
													to === (props.endAt || clipDuration)
														? safeAccelerate
														: 1,
												]
											);
										acc.elements.push(
											<RemappedFrameContextProvider
												key={`as_${from}_${to}`}
												speedFn={(f, renderFrom) =>
													remapSpeed(f + renderFrom, speedFn) + from
												}
											>
												<AcceleratedVideo
													{...props}
													startFrom={from}
													endAt={to}
													duration={duration}
													from={acc.renderFrom}
													speedFn={speedFn}
												>
													{children}
												</AcceleratedVideo>
											</RemappedFrameContextProvider>
										);
									} else {
										acc.elements.push(
											<RemappedFrameContextProvider
												key={`as_${from}_${to}`}
												speedFn={(f, renderFrom) =>
													(f + renderFrom) * value + from
												}
											>
												<FastForwardVideo
													{...props}
													startFrom={from}
													endAt={to}
													accelerate={value}
													from={acc.renderFrom}
													duration={to-from}
												>
													{children}
												</FastForwardVideo>
											</RemappedFrameContextProvider>
										);
									}

								}

								acc.renderFrom += duration;
								return acc;
							},
							{
								elements: [] as React.ReactElement[],
								renderFrom: 0,
							}
						).elements
					}
				</>
			);
		},
		[playbackRateMapping, volumeMapping, clipDuration]
	);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLOR_3,
			}}
			title={src}
		>
			<MappedSequence
				startFrom={0}
				endAt={targetDuration}
				from={0}
				duration={targetDuration}
				src={src}
				{...videoProps}
			>
				<WrappedChildren>{videoProps.children}</WrappedChildren>
			</MappedSequence>
		</AbsoluteFill>
	);
};

function checkValidInputRange(arr: number[]) {
	for (let i = 1; i < arr.length; ++i) {
		if (!(arr[i] > arr[i - 1])) {
			throw new Error(
				`FrameMapping from range must be strictly monotonically non-decreasing but got [${arr
					.slice(i - 1)
					.join(',')}]`
			);
		}
	}
}

export function useFrameMapping<T>(mapping: undefined | FrameMapping<T>[]) {
	useLayoutEffect(() => {
		if (mapping) {
			checkValidInputRange(mapping.map(([start]) => start));
		}
	}, [mapping]);
	return useCallback(
		(f: number) => {
			if (!mapping) {
				return 0;
			}
			const [, , value] = mapping.find(([from, to]) => from < f && f < to) || [
				0, 0, 0,
			];
			return value;
		},
		[mapping]
	);
}
