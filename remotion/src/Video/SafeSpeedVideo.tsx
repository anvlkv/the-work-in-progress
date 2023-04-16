import {OffthreadVideo, Video} from 'remotion';
import {SAFE_PLAYBACK_RATE} from '../constants';
import {VideoClipProps} from './types';

export const SafeSpeedVideo: React.FC<
	VideoClipProps & {
		editorMode: boolean;
		style?: React.CSSProperties;
		offthread?: boolean;
	}
> = ({endAt, startFrom, src, accelerate, editorMode, style, offthread}) => {
	return offthread ? (
		<OffthreadVideo
			startFrom={startFrom}
			src={src}
			endAt={Math.round(endAt)}
			playbackRate={
				editorMode ? undefined : Math.min(accelerate || 1, SAFE_PLAYBACK_RATE)
			}
			muted={!editorMode}
			style={style}
			onError={(e) => console.log(e)}
		/>
	) : (
		<Video
			startFrom={startFrom}
			src={src}
			endAt={endAt}
			playbackRate={
				editorMode ? undefined : Math.min(accelerate || 1, SAFE_PLAYBACK_RATE)
			}
			muted={!editorMode}
			style={style}
		/>
	);
};
