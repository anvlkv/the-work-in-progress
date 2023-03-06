import {useCallback} from 'react';
import {useEffectOnce} from 'react-use';
import {
	useVideoConfig,
	Sequence,
	AbsoluteFill,
	Loop,
	Video,
	useCurrentFrame,
	interpolate,
} from 'remotion';
import {COLOR_2, SAFE_PLAYBACK_RATE} from '../constants';
import {TiltingHead} from '../Head/TiltingHead';
import {RemappedFrameContext} from './RemappedFrameContext';
import {InternalProps, useFrameMapping} from './VideoClip';

export type FastForwardVideoProps = InternalProps & {
	from: number;
	startFrom: number;
	src: string;
	duration: number;
	accelerate: number;
};

export const FastForwardVideo: React.FC<
	React.PropsWithChildren<FastForwardVideoProps>
> = ({from, duration, accelerate, children, ...videoProps}) => {
	return (
		<Sequence durationInFrames={duration} from={from} showInTimeline={false}>
			{/*  eslint-disable-next-line @remotion/volume-callback */}
			<Video {...videoProps} muted playbackRate={SAFE_PLAYBACK_RATE} />
			<h1>TODO!</h1>
			{children}
		</Sequence>
	);
};
