import {Props as SlideProps} from './Slides'

const CHARACTER_SPEECH_DURATION = 0.07;
const PAUSE_DURATION_S = 0.4;

export const phrasesToSpeech = (textToSpeech: (string | number)[]) => {
	return `<speech>
  ${textToSpeech.reduce((acc, current) => {
		return `${acc} ${
			typeof current === 'string'
				? `<s>${current}</s>`
				:  `<break time="${current}s"/>`
		}`;
	}, '')}
  </speech>`;
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

export function durationFromProps({script}: SlideProps, fps: number) {
	return script.reduce(
		(acc, slide) => acc + durationFromText(slide.textToSpeech, fps),
		0
	);
}