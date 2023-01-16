import {
	AbsoluteFill,
	interpolate,
	Loop,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { Head } from './Head';
import { TiltingHead } from './TiltingHead';

export const TalkingHead: React.FC<{fileName: string}> = ({fileName}) => {
	const file  = fileName
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const audioData = useAudioData(file)

	if (!audioData) {
		return <Loop durationInFrames={60}><TiltingHead/></Loop>
	}

	const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 16,
  });

	if (visualization.reduce((acc, c) => acc+c, 0) < 0.01) {
		return <Loop durationInFrames={60}><TiltingHead/></Loop>
	}

	return (
		<AbsoluteFill
		>
			<Head soundWave={visualization}/>
		</AbsoluteFill>
	);
};
