import {Episode, Props} from '../Episode';
import {INTRO, makeEnding, makePomodoro} from './constants';

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
			makePomodoro(8, 'eight'),
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
			{from : 0 , text: [
				.5,
				'says something...'
			]}
		],
		videoClip: '01/01.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/02.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/03.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/04.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/05.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/06.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/07.webm',
	},
	{
		textToSpeech: [],
		videoClip: '01/08.webm',
	},
	{
		script: [makeEnding('first')],
	},
];

export const Ep01 = () => <Episode script={script} />;
