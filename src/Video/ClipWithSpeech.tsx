import { useVideoConfig, useCurrentFrame, Sequence, Video, AbsoluteFill } from "remotion";
import { COLOR_2 } from "../constants";
import { SpeakingHead } from "../Head/SpeakingHead";
import { TiltingHead } from "../Head/TiltingHead";
import { phrasesToSpeech } from "../phrasesToSpeech";
import { AcceleratedContext } from "./AcceleratedVideo";
import { InternalProps } from "./VideoClip";

type VideoClipWithSpeechProps = InternalProps & {
	textToSpeech: (string | number)[];
	from: number;
	startFrom: number;
	src: string;
	duration: number;
};

export const ClipWithSpeech: React.FC<
	React.PropsWithChildren<VideoClipWithSpeechProps>
> = ({from, textToSpeech, duration, children, ...videoProps}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame()

	return (
		<Sequence durationInFrames={duration} from={from}>
			<Video {...videoProps} />
			<AcceleratedContext.Provider value={{remappedFrame: (frame - from)+videoProps.startFrom}}>
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
				{typeof textToSpeech[0] === 'number' ? (
					<>
						<Sequence durationInFrames={textToSpeech[0] * fps}>
							<TiltingHead />
						</Sequence>
						<Sequence from={textToSpeech[0] * fps}>
							<SpeakingHead
								ssml
								text={phrasesToSpeech(textToSpeech.slice(1))}
							/>
						</Sequence>
					</>
				) : (
					<SpeakingHead ssml text={phrasesToSpeech(textToSpeech)} />
				)}
			</AbsoluteFill>
		</Sequence>
	);
};