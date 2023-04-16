import {Folder, Composition, staticFile} from 'remotion';
import {VIDEO_CONFIG, SPLASH_DURATION_S} from '../constants';
import {SpeakingHead} from '../Head/SpeakingHead';
import {PresentationClip} from '../Slides/PresentationClip';
import {Splash} from '../Splash';
import { Ep02 } from '../Episodes/Ep02';

export const Components = () => {
	return (
		<Folder name="Components">
			<Composition
				id="PresentationClip"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					id: 'test'
				}}
			/>
			<Composition
				id="PresentationClipWithText"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					id: 'test',
					text: `
    - why are we doing this?
    - what to expect?
    - how to support?
    `,
				}}
			/>
			<Composition
				id="PresentationClipWithImage"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					id: 'img',
					img: staticFile('sample.png'),
				}}
			/>
			<Composition
				id="SpeakingHead"
				component={SpeakingHead}
				durationInFrames={VIDEO_CONFIG.fps * 20}
				{...VIDEO_CONFIG}
				defaultProps={{
					speech: ['says something', 5, 'and waits a little']
				}}
			/>
			<Composition
				id="Splash"
				component={Splash}
				durationInFrames={SPLASH_DURATION_S * VIDEO_CONFIG.fps}
				{...VIDEO_CONFIG}
				defaultProps={{
					duration: SPLASH_DURATION_S * VIDEO_CONFIG.fps,
				}}
			/>
			<Composition
				id="Chunk"
				component={Ep02}
				durationInFrames={6480}
				{...VIDEO_CONFIG}
				defaultProps={{
					chunked: {chunk: 1, ofChunks: 9.333333333333334, chunkDuration: 6480}
				}}
			/>
		</Folder>
	);
};
