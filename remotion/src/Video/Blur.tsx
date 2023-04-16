import React from 'react';
import {
	useVideoConfig,
} from 'remotion';
import {COLOR_1} from '../constants';
import {useRemappedFrame} from './RemappedFrameContext';
import {FrameMapping} from './VideoClip';

export interface BlurProps {
	x: number;
	x1: number;
	y: number;
	y1: number;
}

const BlurRect: React.FC<BlurProps & {from: number; to: number}> = ({
	from,
	to,
	x,
	x1,
	y,
	y1,
}) => {
	const remappedFrame = useRemappedFrame()();

	if (remappedFrame > from && remappedFrame < to) {
		return (
			<rect
				x={x}
				width={x1 - x}
				y={y}
				height={y1 - y}
				rx={10}
				ry={10}
				fill={COLOR_1}
				filter="url(#blur)"
			/>
		);
	}

	return <></>;
};

export const Blur: React.FC<{
	fragments: FrameMapping<BlurProps>[];
	id: string;
}> = ({fragments}) => {
	const {width, height} = useVideoConfig();

	return (
		<svg
			style={{position: 'absolute'}}
			width="100%"
			height="100%"
			viewBox={`0 0 ${width} ${height}`}
		>
			<filter id="blur">
				<feGaussianBlur stdDeviation="2" />
			</filter>
			{fragments.map(([from, to, props], at) => (
				<BlurRect key={`${from}_${to}_${at}`} {...{...props, from, to}} />
			))}
		</svg>
	);
};
