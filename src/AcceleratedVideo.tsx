import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	Video,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {COLOR_1, COLOR_2} from './constants';

const remapSpeed = (frame: number, speed: (fr: number) => number) => {
	let framesPassed = 0;
	for (let i = 0; i <= frame; i++) {
		framesPassed += speed(i);
	}
	return framesPassed;
};
export const AcceleratedVideo: React.FC<
	Omit<VideoProps, 'playbackRate'> & {
		inputRange: number[];
		outputRange: number[];
	}
> = ({inputRange, outputRange, ...videoProps}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const speedFunction = (f: number) => interpolate(f, inputRange, outputRange);
	const remappedFrame =
		remapSpeed(frame, speedFunction) + (videoProps.startFrom || 0);

	const remappedTime = new Date(Math.round((remappedFrame / fps) * 1000));
	return (
		<>
			<Sequence from={frame}>
				<Video
					{...videoProps}
					src={videoProps.src}
					startFrom={Math.round(remappedFrame)}
					playbackRate={speedFunction(frame)}
          imageFormat="jpeg"
				/>
			</Sequence>
			<AbsoluteFill
				style={{
					width: 'max-content',
					height: 'max-content',
					flexShrink: 1,
					padding: '2%',
					backgroundColor: COLOR_1,
					color: COLOR_2,
					fontSize: '3em',
				}}
			>
				<p>frame: {Math.round(remappedFrame)}</p>
				<p>
					time: {remappedTime.getHours()-1}:{remappedTime.getMinutes()}:
					{remappedTime.getSeconds()}.{remappedTime.getMilliseconds()}
				</p>
			</AbsoluteFill>
		</>
	);
};
