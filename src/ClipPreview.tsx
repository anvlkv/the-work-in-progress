import {Audio} from 'remotion'
import {useAudioData} from '@remotion/media-utils';
import {
	AbsoluteFill,
	OffthreadVideo,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {COLOR_1, COLOR_2} from './constants';

export const ClipPreview: React.FC<{src: string}> = ({
	src,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{width: '100%', height: '100%', display: 'block', fontSize: '2.5em'}}>
			<OffthreadVideo muted src={src} style={{width: '100%', height: '100%'}} />
      <Audio src={src}/>
			<AbsoluteFill
				style={{
					width: 'max-content',
					height: 'max-content',
					flexShrink: 1,
					padding: '2%',
					left: 'unset',
					top: 'unset',
					right: 0,
					bottom: 0,
					backgroundColor: COLOR_1,
					color: COLOR_2,
				}}
			>
				<p>frame: {frame}</p>
				<p>time: {frame * fps}</p>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
