import { interpolate, Loop, useCurrentFrame, useVideoConfig } from "remotion/."
import { Head } from "./Head"

export const TiltingHead: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

	const tilt = interpolate(frame, [0, durationInFrames*0.1, durationInFrames*0.9, durationInFrames], [0, 7, -7, 0], {  extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return <Head tilt={tilt}/>
}