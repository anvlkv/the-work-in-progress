import {
	AbsoluteFill,
	OffthreadVideo,
	useVideoConfig,
} from 'remotion';

export const ClipExport: React.FC<{src: string}> = ({
	src,
}) => {
	const {height, width} = useVideoConfig()
	return (
		<AbsoluteFill style={{width: '100%', height: '100%', display: 'block', fontSize: '2.5em'}}>
			<OffthreadVideo src={src} style={{height, width}}/>
		</AbsoluteFill>
	);
};
