import { useEffect } from "react";
import { useEffectOnce } from "react-use";
import { useVideoConfig, Sequence, AbsoluteFill, Loop, Video, useCurrentFrame } from "remotion";
import { COLOR_2 } from "../constants";
import { TiltingHead } from "../Head/TiltingHead";
import { AcceleratedContext, AcceleratedVideo } from "./AcceleratedVideo";
import { InternalProps } from "./VideoClip";

type VideoClipWithoutSpeechProps = InternalProps & {
	from: number;
	startFrom: number;
	src: string;
	duration: number;
	accelerate: number;
};



export const ClipWithoutSpeech: React.FC<
	React.PropsWithChildren<VideoClipWithoutSpeechProps>
> = ({from, duration, accelerate, children,...videoProps}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

  useEffectOnce(() => {
		const diff = videoProps.endAt - videoProps.startFrom
		const computed = duration * accelerate
		if (diff < 0) {
			throw new Error(`Video ends earlier than starts: endAt[${videoProps.endAt}] startFrom[${videoProps.startFrom}]`)
		}
		if (Math.abs(diff - computed) > fps) {
			console.warn(`miscalculated video length: ~${(diff-computed)/accelerate/fps}s ${diff > computed ? 'did not fit' : 'too long'} frames[${diff - computed}] seconds[${(diff - computed)/fps}]`)
			console.log(diff)
		}
  })
	return (
		<Sequence durationInFrames={duration} from={from}>
			<Video
				playbackRate={accelerate}
				{...videoProps}
			/>
			<AcceleratedContext.Provider value={{remappedFrame: videoProps.startFrom + Math.round((frame - from)*accelerate)}}>
				{children}
			</AcceleratedContext.Provider>
			<AbsoluteFill
				style={{
					backgroundColor: COLOR_2,
					width: '20%',
					height: '25%',
					position: 'absolute',
					bottom: 0,
					right: 0,
					top: 'unset',
					left: 'unset',
				}}
			>
				<Loop durationInFrames={60 * fps}>
					<TiltingHead />
				</Loop>
			</AbsoluteFill>
		</Sequence>
	);
};