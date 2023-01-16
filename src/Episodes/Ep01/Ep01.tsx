import {Episode, Props} from '../../Episode';
import {INTRO, makeEnding, makePomodoro} from '../constants';

const script: Props['script'] = [
	{
		script: [
			{
				text: `Episode 01`,
				textToSpeech: [
					0.5,
					'Welcome to the first episode of the work in progress by twopack.gallery',
				],
			},
			INTRO,
			makePomodoro(7, 'seven'),
			{
				title: `WIP Ep 01`,
				text: `POC: remotion`,
				textToSpeech: [
					0.5,
					'In this episode I will make a proof of concept with remotion',
					0.25,
					'I will use it to create the speaking head animation',
					0.25,
					'You can see its already working in the bottom-right corner of your video',
					0.5,
					'Lets see how it goes',
				],
			},
		],
	},
	{
		textToSpeech: [
			{
				from: 30,
				text: [
					0.5,
					`It's my first time trying remotion`,
					0.25,
					`I heard of it was this summer, at one react conference`,
				],
			},
		],
		videoClip: '01/01.mov',
		durationInSeconds: 33 * 60 + 4,
	},
	{
		textToSpeech: [],
		videoClip: '01/02.mov',
		durationInSeconds: 15 * 60 + 39,
	},
	{
		textToSpeech: [],
		videoClip: '01/03.mov',
		durationInSeconds: 43 * 60 + 31,
	},
	{
		textToSpeech: [],
		videoClip: '01/04.mov',
		durationInSeconds: 11 * 60 + 59,
	},
	{
		textToSpeech: [],
		videoClip: '01/05.mov',
		durationInSeconds: 31 * 60 + 50,
	},
	{
		textToSpeech: [],
		videoClip: '01/06.mov',
		durationInSeconds: 1 * 60 * 60 + 39 * 60 + 2,
	},
	{
		textToSpeech: [],
		videoClip: '01/07.mov',
		durationInSeconds: 5 * 60 + 32,
	},
	{
		script: [makeEnding('first')],
	},
];

export const Ep01 = () => <Episode script={script} />;
