import { useState, useLayoutEffect } from 'react';
import {Audio, continueRender, delayRender, prefetch} from 'remotion';
import {TalkingHead} from './TalkingHead';

export const SpeakingHead: React.FC<{text: string; ssml?: boolean}> = ({
	text,
	ssml = false,
}) => {
	const speech = `http://localhost:5500/api/tts?voice=${encodeURIComponent(
		'espeak:en#en-us'
	)}&text=${encodeURIComponent(text)}&ssml=${ssml}`;
	const {waitUntilDone} = prefetch(speech);
	const [handle] = useState(() => delayRender());
	useLayoutEffect(() => {
		waitUntilDone().then(() => continueRender(handle));
	}, [waitUntilDone, handle]);
	return (
		<>
			<TalkingHead fileName={speech} />
			<Audio src={speech} title={`speech: ${text.length}`}/>
		</>
	);
};
