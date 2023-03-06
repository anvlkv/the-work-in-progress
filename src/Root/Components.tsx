import {Folder, Composition, staticFile} from 'remotion';
import {VIDEO_CONFIG, SPLASH_DURATION_S} from '../constants';
import {Episode} from '../Episodes/Standard/Episode';
import {INTRO, makeEnding, EP_DURATION_FRAMES} from '../Episodes/constants';
import {SpeakingHead} from '../Head/SpeakingHead';
import {PresentationClip} from '../Slides/PresentationClip';
import {Slides} from '../Slides/Slides';
import {Splash} from '../Splash';
import {VideoClip} from '../Video/VideoClip';
import { Ep02 } from '../Episodes/Ep02';

export const Components = () => {
	return (
		<Folder name="Components">
			<Composition
				// You can take the "id" to render a video:
				// npx remotion render src/index.ts <id> out/video.mp4
				id="VideoClip"
				component={VideoClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				// You can override these props for each render:
				// https://www.remotion.dev/docs/parametrized-rendering
				defaultProps={{
					videoClipSrc: 'sample.mp4',
					playbackRateMapping: [[50, 150, 7]],
					durationInSeconds: 203,
				}}
			/>
			<Composition
				id="PresentationClip"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					
				}}
			/>
			<Composition
				id="PresentationClipWithText"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
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
					img: staticFile('sample.png'),
				}}
			/>
			<Composition
				id="SpeakingHead"
				component={SpeakingHead}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					text: `<speak>
    <s>Breaks are possible</s>
        <break time="0.5s" />
        <s>between sentences.</s></speak>`,
					ssml: true,
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
