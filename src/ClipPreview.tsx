import {continueRender, delayRender, Sequence, Video} from 'remotion'
import {Audio} from 'remotion'
import {getVideoMetadata, useAudioData, VideoMetadata} from '@remotion/media-utils';
import {
	AbsoluteFill,
	OffthreadVideo,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {COLOR_1, COLOR_2} from './constants';
import { useState, useLayoutEffect } from 'react';

export const ClipPreview: React.FC<{src: string}> = ({
	src,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const [srcMeta, setSrcMeta] = useState<null | VideoMetadata>(null);
	const [handle] = useState(() => delayRender());

	useLayoutEffect(() => {
		(async () => {
			setSrcMeta(await getVideoMetadata(src));
			continueRender(handle);
		})();
	}, [src, handle]);


	return (
		<AbsoluteFill style={{width: '100%', height: '100%', display: 'block', fontSize: '2.5em'}}>
			<Sequence durationInFrames={Math.round((srcMeta?.durationInSeconds || 1)*fps)}>
				<Video muted src={src} style={{width: '100%', height: '100%'}} />
				<Audio src={src}/>
			</Sequence>
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
