import {
	AbsoluteFill,
	interpolate,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {noise2D} from '@remotion/noise';
import {COLOR_1, COLOR_2, COLOR_3, SAFE_PLAYBACK_RATE} from '../constants';
import {SafeSpeedVideo} from './SafeSpeedVideo';
import {VideoClipProps} from './types';
import React from 'react';

const NoisyLine = React.memo<{
	thickness: number;
	seed: number;
	width: number;
	height: number;
	times: number;
}>(({thickness, seed, width, height, times}) => {
	return (
		<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
			{Array.from({length: thickness}).flatMap((_, y) => {
				return Array.from({length: width})
					.flatMap((_, x) => {
						const noise = noise2D(seed, x, y);
						return Array.from({length: times}).map((_, t) => {
							return (
								<rect
									key={`${x}_${y}_${noise}_${t}`}
									x={x}
									y={y + (height / times) * (t + 1) - thickness / 2}
									width="1"
									height="1"
									fill={noise > 0 ? COLOR_1 : COLOR_2}
									style={{
										opacity:
											1 -
											(thickness / 2 > y
												? thickness / 2 - y
												: y - thickness / 2) /
												(thickness / 2),
									}}
								/>
							);
						});
					})
					.filter(
						(_, x) =>
							(x % 2 === 0 && y % 2 !== 0) || (y % 2 === 0 && x % 2 !== 0)
					);
			})}
		</svg>
	);
});

export const FastForwardVideo: React.FC<
	VideoClipProps & {editorMode: boolean}
> = (props) => {
	const {width, height, durationInFrames} = useVideoConfig();
	const frame = useCurrentFrame();
	const offsetNoise = interpolate(frame, [0, durationInFrames], [0.1, 100]);
	const xTimes = Math.ceil(props.accelerate / SAFE_PLAYBACK_RATE);
	const thickness = Math.ceil(props.accelerate / xTimes);
	return (
		<>
			<SafeSpeedVideo {...props} />
			{Array.from({length: xTimes}).map((_, i, all) => (
				<AbsoluteFill key={`${i}_${xTimes}`}>
					<AbsoluteFill
						style={{
							height: `${100 / (all.length + 1)}%`,
							top: `${(100 / (all.length + 1)) * (i + 1)}%`,
							overflow: 'hidden',
						}}
					>
						<SafeSpeedVideo
							{...props}
							style={{
								display: 'block',
								position: 'absolute',
								top: `-${
									height - (height / (all.length + 1)) * (all.length - i)
								}px`,
								width: '100%',
							}}
							accelerate={SAFE_PLAYBACK_RATE}
							startFrom={Math.round(
								props.startFrom +
									((props.endAt - props.startFrom) / xTimes - 1) * (i + 1)
							)}
						/>
					</AbsoluteFill>
				</AbsoluteFill>
			))}
			<AbsoluteFill style={{left: `-${offsetNoise}%`}}>
				<NoisyLine
					width={width * 2}
					height={height}
					seed={thickness}
					thickness={thickness}
					times={xTimes + 1}
				/>
			</AbsoluteFill>
		</>
	);
};
