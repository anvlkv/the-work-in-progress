const CHARACTER_SPEECH_DURATION = 0.07;
const PAUSE_DURATION_S = 0.4;

export type TTSEntry = (string|number)[];

export function phrasesToSpeech(textToSpeech: TTSEntry) {
	return `<speech>
  ${textToSpeech.reduce<string>((acc, current, at) => {
		if (typeof current === 'number' && acc.length === 0) {
			return acc
		}
		return `${acc} ${
			typeof current === 'string'
				? `<s>${current}</s>`
				: `<break time="${current}s"/>`
		}`;
	}, '')}
  </speech>`;
}

export function phrasesToTTsUrl(
	textToSpeech: TTSEntry | string,
	ssml = true
) {
	// console.log(phrasesToSpeech(textToSpeech as []))
	return `http://localhost:5500/api/tts?voice=${encodeURIComponent(
		'espeak:en#en-us'
	)}&text=${encodeURIComponent(
		typeof textToSpeech === 'string'
			? textToSpeech
			: phrasesToSpeech(textToSpeech)
	)}&ssml=${ssml}`;
}

export function durationFromText(text: TTSEntry, fps: number) {
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
