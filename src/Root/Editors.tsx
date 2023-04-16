import {Folder, Internals} from 'remotion';
import {SPLASH_DURATION_S, VIDEO_CONFIG} from '../constants';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import {Editor} from '../Episodes/Standard/Editor';

export const Editors = () => {
	const isPreview = Internals.useRemotionEnvironment() === 'preview';
	return (
		<Folder name="Editors">
			{isPreview && (
				<>
					<Editor
						path="05/Ep05.yaml"
						id="Ep05"
						targetContentDuration={
							EP_DURATION_FRAMES - SPLASH_DURATION_S * VIDEO_CONFIG.fps
						}
					/>
					{/* <Editor
						path="trailer.yaml"
						id="Trailer"
						targetContentDuration={2867 + SPLASH_DURATION_S * VIDEO_CONFIG.fps}
					/> */}
				</>
			)}
		</Folder>
	);
};
