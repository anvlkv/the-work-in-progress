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
  // useEffectOnce(() => {
  //   console.log(duration)
  // })
	return (
		<Sequence durationInFrames={duration} from={from}>
			<Video
				playbackRate={accelerate}
				{...videoProps}
			/>
			<AcceleratedContext.Provider value={{remappedFrame: Math.round(frame*accelerate)+videoProps.startFrom}}>
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