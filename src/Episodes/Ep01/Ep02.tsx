import {Episode, Props} from '../../Episode';
import {INTRO, makeEnding, makePomodoro} from '../constants';

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
		videoClip: '02/01.mov',
		durationInSeconds: 33 * 60 + 4,
	},
	{
		textToSpeech: [],
		videoClip: '02/02.mov',
		durationInSeconds: 15 * 60 + 39,
	},
	{
		textToSpeech: [],
		videoClip: '02/03.mov',
		durationInSeconds: 43 * 60 + 31,
	},
	{
		textToSpeech: [],
		videoClip: '02/04.mov',
		durationInSeconds: 11 * 60 + 59,
	},
	{
		textToSpeech: [],
		videoClip: '02/05.mov',
		durationInSeconds: 31 * 60 + 50,
	},
	{
		textToSpeech: [],
		videoClip: '02/06.mov',
		durationInSeconds: 1 * 60 * 60 + 39 * 60 + 2,
	},
	{
		textToSpeech: [],
		videoClip: '02/07.mov',
		durationInSeconds: 5 * 60 + 32,
	},
	{
		script: [makeEnding('second')],
	},
];

export const Ep02 = () => <Episode script={script} />;
