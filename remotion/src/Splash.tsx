import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLOR_1, COLOR_3} from './constants';

const MAX_SCALE = 4;
export const Splash: React.FC<{duration?: number}> = ({duration}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	duration = duration || durationInFrames
	const scale =
		duration > 0
			? interpolate(
					frame,
					[0, (duration / 4) * 3, duration],
					[0.0001, 0.25, MAX_SCALE],
          {extrapolateRight: 'clamp'}
			  )
			: interpolate(
					frame,
					[0, (Math.abs(duration) / 4) * 3, Math.abs(duration)],
					[MAX_SCALE, 0.25, 0.0001],
          {extrapolateRight: 'clamp'}
			  );
	const revScale = duration > 0 ? MAX_SCALE - scale : scale - MAX_SCALE;
	return (
		<AbsoluteFill style={{width: '100%', height: '100%', backgroundColor: COLOR_3}}>
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 100 100"
				preserveAspectRatio="xMidYMid meet"
			>
				<defs>
					<clipPath id={`circleMask_${scale}`}>
						<circle r={45 * scale} cx="50" cy="50" />
					</clipPath>
				</defs>
				<g clipPath={`url(#circleMask_${scale})`}>
					<circle
						strokeWidth={2 * revScale}
						style={{transform: `scale(${scale})`, transformOrigin: 'center'}}
						stroke={COLOR_1}
						fill="none"
						r="45"
						cx="50"
						cy="50"
					/>
					<image
						href={staticFile('/twopacks.png')}
						x="10"
						y="10"
						height="80"
					/>
				</g>
			</svg>
		</AbsoluteFill>
	);
};
