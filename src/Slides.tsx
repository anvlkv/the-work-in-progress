import {Sequence, useVideoConfig} from 'remotion';
import {PresentationClip} from './PresentationClip';

const CHARACTER_SPEECH_DURATION = 0.0667;
const PAUSE_DURATION_S = 0.4;

export type SequenceRenderProps = {
	// eslint-disable-next-line react/no-unused-prop-types
	textToSpeech: (string | number)[];
	// eslint-disable-next-line react/no-unused-prop-types
	text?: string;
	// eslint-disable-next-line react/no-unused-prop-types
	title?: string;
};

export type Props = {script: SequenceRenderProps[]};
export const Slides: React.FC<Props> = ({script = []}) => {
	const {fps} = useVideoConfig();
	let from = 0;
	function renderSequence(
		{textToSpeech, text, title}: SequenceRenderProps,
		at: number
	) {
		const sequenceDuration = durationFromText(textToSpeech, fps);
		const result = (
			<Sequence
				key={`${text}_${title}` + at}
				from={from}
				durationInFrames={sequenceDuration}
			>
				<PresentationClip
					text={text}
					title={title}
					textToSpeech={textToSpeech}
				/>
			</Sequence>
		);
		from += sequenceDuration;
		return result;
	}
	const slides = script.map(renderSequence)

	return <>{slides}</>;
};

export function durationFromText(text: (string | number)[], fps: number) {
	const result = Math.ceil(
		text.reduce<number>((acc, current) => {
			return (
				acc +
				(typeof current === 'string'
					? current.length * CHARACTER_SPEECH_DURATION
					: current * PAUSE_DURATION_S)
			);
		}, 0) * fps
	);
	return result;
}

export function durationFromProps({script}: Props, fps: number) {
	return script.reduce(
		(acc, slide) => acc + durationFromText(slide.textToSpeech, fps),
		0
	);
}
