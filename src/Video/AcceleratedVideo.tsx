import {useEffectOnce} from 'react-use';
import {useVideoConfig, Sequence, Video, useCurrentFrame} from 'remotion';
import {useRemappedFrame} from './RemappedFrameContext';
import {InternalProps} from './VideoClip';

export type AcceleratedVideoProps = InternalProps & {
	from: number;
	startFrom: number;
	src: string;
	duration: number;
	speedFn: (f: number) => number;
};

export function remapSpeed(frame: number, speed: (fr: number) => number) {
	let framesPassed = 0;
	for (let i = 0; i <= frame; i++) {
		framesPassed += speed(i);
	}
	return framesPassed;
}

export const AcceleratedVideo: React.FC<
	React.PropsWithChildren<AcceleratedVideoProps>
> = ({from, duration, children, speedFn, ...videoProps}) => {
	const frame = useCurrentFrame();
	const remappedFrame = useRemappedFrame()();

	return (
		<Sequence durationInFrames={duration} from={from} showInTimeline={false}>
			<Sequence from={frame}>
				<Video
					{...videoProps}
					muted
					startFrom={remappedFrame}
					playbackRate={speedFn(frame)}
				/>
			</Sequence>
			{children}
		</Sequence>
	);
};
