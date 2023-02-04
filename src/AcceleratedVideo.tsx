import React, { useContext } from 'react';
import {
	interpolate,
	Video,
	Sequence,
	useCurrentFrame,
} from 'remotion';

const remapSpeed = (frame: number, speed: (fr: number) => number) => {
	let framesPassed = 0;
	for (let i = 0; i <= frame; i++) {
		framesPassed += speed(i);
	}
	return framesPassed;
};

export const AcceleratedVideo: React.FC<
	React.PropsWithChildren<
		Omit<VideoProps, 'playbackRate'> & {
			inputRange: number[];
			outputRange: number[];
		}
	>
> = ({inputRange, outputRange, children, ...videoProps}) => {
	const frame = useCurrentFrame();
	const speedFunction = (f: number) => interpolate(f, inputRange, outputRange);
	const remappedFrame =
		remapSpeed(frame, speedFunction) + (videoProps.startFrom || 0);

	return (
		<>
			<Sequence from={frame}>
				<Video
					{...videoProps}
					src={videoProps.src}
					startFrom={Math.round(remappedFrame)}
					playbackRate={Math.min(speedFunction(frame), 16)}
				/>
				<AcceleratedContext.Provider value={{remappedFrame}}>
					{children}
				</AcceleratedContext.Provider>
			</Sequence>
		</>
	);
};

const AcceleratedContext = React.createContext({
	remappedFrame: 0,
});

export function useRemappedFrame() {
	return useContext(AcceleratedContext).remappedFrame
}
