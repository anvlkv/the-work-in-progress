import {Composition, staticFile} from 'remotion';
import {Ep01} from './Episodes/Ep01';
import {Episode} from './Episode';
import {Trailer} from './Episodes/Trailer';
import {SpeakingHead} from './Head/SpeakingHead';
import {PresentationClip} from './PresentationClip';
import {Slides} from './Slides';
import {VideoClip} from './VideoClip';
import {Splash} from './Splash';
import { ClipPreview } from './ClipPreview';
import { EP_DURATION_FRAMES, INTRO, makeEnding } from './Episodes/constants';
import { SPLASH_DURATION_S, VIDEO_CONFIG } from './constants';
// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
	return (
		<>
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
					videoClip: 'sample.mp4',
				}}
			/>
			<Composition
				// You can take the "id" to render a video:
				// npx remotion render src/index.ts <id> out/video.mp4
				id="VideoClipWithText"
				component={VideoClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				// You can override these props for each render:
				// https://www.remotion.dev/docs/parametrized-rendering
				defaultProps={{
					videoClip: 'sample.mp4',
					textToSpeech: [
						{
							from: 60,
							text: [
								`It's my first time trying remotion`,
								0.25,
								`First time I heard of it was this summer, at one react conference`,
							],
						},
						{
							from: 1400,
							text: [
								`SECOND CUT`,
								0.25,
							],
						},
					]
				}}
			/>
			<Composition
				id="PresentationClip"
				component={PresentationClip}
				durationInFrames={VIDEO_CONFIG.fps * (1 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					textToSpeech:
						[.5, 'This is a presentation clip of the work in progress by twopack.gallery',]
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
					textToSpeech:
						['This is a presentation clip of the work in progress by twopack.gallery'],
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
				durationInFrames={SPLASH_DURATION_S*VIDEO_CONFIG.fps}
				{...VIDEO_CONFIG}
				defaultProps={{
					duration: SPLASH_DURATION_S*VIDEO_CONFIG.fps,
				}}
			/>
			<Composition
				id="Slides"
				component={Slides}
				durationInFrames={2000}
				{...VIDEO_CONFIG}
				defaultProps={{
					script: [
						INTRO,
						makeEnding('the never ending')
					],
				}}
			/>
			<Composition
				id="Episode"
				component={Episode}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
				defaultProps={{
					script: [
						{
							script: [
								{
									text: `Episode 01`,
									textToSpeech: [
										'Welcome to the first episode of the work in progress by twopack.gallery',
									],
								},
								{
									title: `WIP Ep 01`,
									text: `remotion`,
									textToSpeech: [
										'In this episode I will try remotion to create the speaking head animation',
										'You can see its already working in the bottom-right corner of your video',
										"Let's see how it goes",
									],
								},
							],
						},
						{
							textToSpeech: [
								{
									from: 300,
									text: [
										`It's my first time trying remotion`,
										0.25,
										`First time I heard of it was this summer, at one react conference`,
									],
								},
								{
									from: 9000,
									text: [
										`SECOND CUT`,
										0.25,
									],
								},
								{
									from: 13000,
									text: [
										`THIRD CUT`,
										0.25,
									],
								},
								{
									from: 19000,
									text: [
										`FINAL CUT`,
										2,
									],
								},
							],
							videoClip: '01/01.webm',
						},
						{
							textToSpeech: [],
							videoClip: '01/02.webm'
						}
					],
				}}
			/>
			<Composition
				id="Blur"
				component={Episode}
				durationInFrames={VIDEO_CONFIG.fps * (60 + 27)}
				{...VIDEO_CONFIG}
				defaultProps={{
					script: [
						{
							textToSpeech: [
								{
									from: 30,
									text: [
										`It's my first time trying remotion`,
										0.25,
										`First time I heard of it was this summer, at one react conference`,
									],
								},
							],
							videoClip: '01/01.mov',
							playbackRate: 1.2,
							startFrom: 900,
							endAt: 300 + 30 * (1 * 60 + 27),
							blur: [
								{
									frames: [10, 30 * (1 * 60 + 27)],
									blurProps: {
										style: {
											width: '30%',
											height: '30%',
											top: '10vh',
											left: '3vw',
										},
									},
								},
							],
						},
					],
				}}
			/>
			<Composition
				id="TrailerEp"
				component={Trailer}
				durationInFrames={1849}
				{...VIDEO_CONFIG}
			/>
			<Composition
				id="Preview0101"
				component={ClipPreview}
				durationInFrames={2494}
				{...VIDEO_CONFIG}
				defaultProps={{
					src: staticFile('01/01.webm')
				}}
			/>
			<Composition
				id="Ep01"
				component={Ep01}
				durationInFrames={EP_DURATION_FRAMES}
				{...VIDEO_CONFIG}
			/>
		</>
	);
};
