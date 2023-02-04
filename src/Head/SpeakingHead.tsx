import {Audio} from 'remotion';
import {TalkingHead} from './TalkingHead';

export const SpeakingHead: React.FC<{text: string; ssml?: boolean}> = ({
	text,
	ssml = false,
}) => {
	const speech = `http://localhost:5500/api/tts?voice=${encodeURIComponent(
		'espeak:en#en-us'
	)}&text=${encodeURIComponent(text)}&ssml=${ssml}`;
	return (
		<>
			<TalkingHead fileName={speech} />
			<Audio src={speech} />
		</>
	);
};
