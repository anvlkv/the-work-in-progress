import {Episode} from './Standard/Episode';
import {INTRO, makeEnding, makePomodoro, WARNING} from './constants';
import {useScriptFromYaml} from './Standard/scriptFromYaml';
import scriptYaml from './Ep02.yaml';
import {useMemo} from 'react';
import {EpisodeSlidesProps, EpProps, SingleSlideProps} from './Standard/types';

const start = {
	type: 'slides',
	props: [
		WARNING,
		{
			text: `Episode 02`,
			commentary: [
				0.5,
				'Welcome to the second episode of the work in progress by twopack.gallery',
			],
		},
		INTRO,
		{
			title: `the WIP Ep 02`,
			text: `Solution: the studio and the episode with remotion`,
			commentary: [
				0.5,
				'In this episode I will continue with remotion',
				0.25,
				'I will use it to design my episodes programmatically',
				0.25,
				'You can see its already working in this and the previous episode',
				0.5,
				'Lets see how it goes',
			],
		},
		makePomodoro(16, 'sixteen'),
	],
} as EpisodeSlidesProps;

const end = {
	type: 'slides',
	props: [makeEnding('first')],
} as EpisodeSlidesProps;

export const Ep02 = ({
	editorMode,
	...epProps
}: {editorMode?: boolean} & Partial<EpProps>) => {
	const script = useScriptFromYaml(scriptYaml);
	return (
		<Episode
			script={useMemo(() => [start, ...script, end], [script])}
			id="Ep02"
			editorMode={editorMode}
			{...epProps}
		/>
	);
};
