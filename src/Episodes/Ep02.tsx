import {Episode, Props} from '../Episode';
import {INTRO, makeEnding, makePomodoro} from './constants';

const script: Props['script'] = [
	{
		script: [
			{
				text: `Episode 02`,
				textToSpeech: [
					.5,
					'Welcome to the second episode of the work in progress by twopack.gallery',
				],
			},
			INTRO,
      makePomodoro(24, 'twenty four'),
			{
				title: `WIP Ep 02`,
				text: `
        POC -> to solution
        `,
				textToSpeech: [
					.5,
					'In this episode I will continue with my proof of concept',
					0.25,
					'I will make a simple studio for recording this podcast',
					0.5,
					"Let's see how it goes",
				],
			},
		],
	},
	{
		textToSpeech: [
			{
				from: 30,
				text: [
					.5,
					`It's my first time trying remotion`,
					0.25,
					`I heard of it was this summer, at one react conference`,
				],
			},
		],
		videoClipSrc: '02/01.webm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/02.webm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/03.webm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/04.webm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/05.webmm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/06.webm',
	},
	{
		textToSpeech: [],
		videoClipSrc: '02/07.webm',
	},
	{
		script: [makeEnding('second')],
	},
];

export const Ep02 = () => <Episode script={script} />;
