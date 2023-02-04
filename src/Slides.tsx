import {Sequence, useVideoConfig} from 'remotion';
import { durationFromText } from './phrasesToSpeech';
import {PresentationClip} from './PresentationClip';



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

	return <>{script.map(renderSequence)}</>;
};

