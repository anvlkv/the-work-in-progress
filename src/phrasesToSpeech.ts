export const phrasesToSpeech = (textToSpeech: (string | number)[]) => {
	return `<speech>
  ${textToSpeech.reduce((acc, current) => {
		return `${acc} ${
			typeof current === 'string'
				? `<s>${current}</s>`
				: `<break time="${current}s"/>`
		}`;
	}, '')}
  </speech>`;
};
