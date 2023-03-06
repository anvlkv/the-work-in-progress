import { useMemo } from 'react';
import { Episode } from './Standard/Episode';
import { EpProps, SingleSlideProps } from './Standard/types';

const trailerScript: SingleSlideProps[] = [
	{
		commentary: [
			.5,
			`Welcome to the trailer episode of the work in progress by two pack dot gallery `,
			.25,
			`I will tell you why we are recording this, what to expect, and how to support us`,
			.25,
		],
	},
	{
		title: 'why are we doing this?',
		text: `
      - ungallery
			- work in progress
    `,
		commentary: [
			.5,
			`We are two artists creating an ungallery`,
			.25,
			`We are looking for community and support for the ungallery project through this podcast`,
			.25,
			`We will not use this channel to talk much about the ungallery`,
			.25,
			`Just gonna show the work in progress`,
			.25,
		],
	},
	{
		title: 'what to expect?',
		text: `
       - creative process
			 - free to watch
			 - CC-BY-NC-SA 4.0
    `,
		commentary: [
			.5,
			`You can expect to see our creative process in our episodes`,
			.25,
			`You can expect anything from textile art and stage design to painting and creative coding`,
			.25,
			`In the first episodes I will share the process of making this podcast and online experience for the ungallery project`,
			.75,
			'This podcast is available to you for free',
			.25,
			'The podcast is distributed under Creative Commons Requires attribution Non-commercial Share alike license CC-BY-NC-SA four point zero',
			.25
		],
	},
	{
		title: 'how to support?',
		text: `
      - watch the podcast
      - share your feedback
      - support on patreon
    `,
		commentary: [
			.5,
			`I most of all appreciate you watching the podcast`,
			.25,
			`If you happen to be familiar with some of the tools or techniques I use, or have feedback on the podcast, I would love hearing from you`,
			.25,
			`Supporting this project on Patreon would be of a great help to this project as well as the ungallery`,
			.25,
			`You can find us at patreon dot com slash two pack underscore gallery`,
			.25,
		],
	},
	{
		commentary: [
			`I hope you will find it fun and maybe even useful, see you in one our episodes `,
			.25,
		],
	},
];



export const Trailer = ({
	editorMode,
	...epProps
}: {editorMode?: boolean} & Partial<EpProps>) => {
	return (
		<Episode
			script={useMemo(() => [{type: 'slides', props: trailerScript}], [])}
			id="TrailerEp"
			editorMode={editorMode}
			{...epProps}
		/>
	);
};
