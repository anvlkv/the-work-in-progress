import {Sequence, staticFile, OffthreadVideo, useVideoConfig} from 'remotion';
import {AbsoluteFill} from 'remotion';
import {Blur} from './Blur';
import {COLOR_2} from './constants';
import {SpeakingHead} from './Head/SpeakingHead';
import {TalkingHead} from './Head/TalkingHead';
import {phrasesToSpeech} from './phrasesToSpeech';
import {durationFromProps} from './Slides';

// eslint-disable-next-line react/no-unused-prop-types
type SequenceRenderProps = {text: (string | number)[]; from: number};
// eslint-disable-next-line react/no-unused-prop-types
type BlurProps = {
	frames: [number, number];
	blurProps: {style?: Partial<React.CSSProperties>};
};

export type Props = {
	videoClip: string;
	durationInFrames?: number;
	textToSpeech?: SequenceRenderProps[];
	startFrom?: number;
	endAt?: number;
	playbackRate?: number;
	volume?: number | ((frame: number) => number);
	blur?: BlurProps[];
};
export const VideoClip: React.FC<Props> = ({
	videoClip,
	textToSpeech = [],
	blur,
	durationInFrames = 0,
	...videoProps
}) => {
	const {fps, durationInFrames: targetDuration} = useVideoConfig();
	const src = staticFile(videoClip);
	const speedUpPlayback = durationInFrames / targetDuration || 1;
	function renderVideoSequence(
		acc: {sequences: React.ReactElement[]; from: number; computedFrom: number},
		{text, from}: SequenceRenderProps,
		at: number,
		all: SequenceRenderProps[]
	) {
		const durationBefore = Math.ceil((from - acc.from) / speedUpPlayback);
		const videoBefore =
			durationBefore === 0 ? (
				<></>
			) : (
				<Sequence durationInFrames={durationBefore}>
					<OffthreadVideo
						muted
						playbackRate={speedUpPlayback}
						startFrom={acc.from}
						src={src}
					/>
				</Sequence>
			);
		const duration = durationFromProps({script: [{textToSpeech: text}]}, fps);
		const commentedVideo = (
			<Sequence from={durationBefore} durationInFrames={duration}>
				<OffthreadVideo muted startFrom={from} src={src} />
			</Sequence>
		);
		const nextFrom = all[at + 1] ? all[at + 1].from : null;
		const durationAfter = Math.ceil(
			((nextFrom || durationInFrames) - durationBefore - duration) /
				speedUpPlayback
		);
		const unCommentedVideo = (
			<Sequence
				from={durationBefore + duration}
				durationInFrames={durationAfter}
			>
				<OffthreadVideo
					muted
					playbackRate={speedUpPlayback}
					startFrom={acc.from + from + duration}
					src={src}
				/>
			</Sequence>
		);
		acc.sequences.push(
			<Sequence
				key={`${text.join()}_${at}`}
				from={acc.computedFrom}
				durationInFrames={durationBefore + duration + durationAfter}
			>
				{videoBefore}
				{commentedVideo}
				{unCommentedVideo}
			</Sequence>
		);
		acc.from = nextFrom || 0;
		acc.computedFrom += durationBefore + duration + durationAfter;
		return acc;
	}

	return (
		<AbsoluteFill>
			{textToSpeech.length ? (
				textToSpeech.reduce(renderVideoSequence, {
					sequences: [],
					from: 0,
					computedFrom: 0,
				}).sequences
			) : (
				<>
					<OffthreadVideo src={staticFile(videoClip)} {...videoProps} />
					<AbsoluteFill
						style={{
							backgroundColor: COLOR_2,
							width: '20%',
							height: '25%',
							position: 'absolute',
							bottom: '3%',
							right: 0,
							top: 'unset',
							left: 'unset',
						}}
					>
						<TalkingHead fileName={staticFile(videoClip)} />
					</AbsoluteFill>
				</>
			)}
			{blur &&
				blur.map(({frames: [from, to], blurProps}, at) => {
					return (
						<Sequence
							key={`${from}_${to}_${at}`}
							from={from}
							durationInFrames={to - from}
						>
							<Blur {...blurProps} />
						</Sequence>
					);
				})}
		</AbsoluteFill>
	);
};
