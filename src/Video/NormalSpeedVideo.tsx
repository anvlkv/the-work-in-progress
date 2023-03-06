import { useEffectOnce } from "react-use";
import { useCurrentFrame, Sequence, Video } from "remotion";
import { RemappedFrameContext } from "./RemappedFrameContext";
import { InternalProps, useFrameMapping } from "./VideoClip";

export type NormalSpeedVideoProps = InternalProps & {
	from: number;
	startFrom: number;
	src: string;
	duration: number;
};

export const NormalSpeedVideo: React.FC<
	React.PropsWithChildren<NormalSpeedVideoProps>
> = ({from, duration, children, volumeMapping: volume, ...videoProps}) => {
	const volumeCb = useFrameMapping(volume)

	useEffectOnce(() => {
		if (duration < 0) {
			console.log('negative duration')
		}
	})

	return (
		<Sequence durationInFrames={duration} from={from} showInTimeline={false}>
			{/*  eslint-disable-next-line @remotion/volume-callback */}
			<Video {...videoProps} muted={!volume} volume={volumeCb} />
				{children}
		</Sequence>
	);
};