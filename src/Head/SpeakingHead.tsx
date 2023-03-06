import {Audio} from 'remotion';
import { phrasesToTTsUrl } from '../phrasesToSpeech';
import {TalkingHead} from './TalkingHead';

export const SpeakingHead: React.FC<{text: string; ssml?: boolean, ttsUrl?: string}> = ({
	text,
	ssml = false,
	ttsUrl
}) => {
	const speech = ttsUrl || phrasesToTTsUrl(text, ssml);
	return (
		<>
			<TalkingHead fileName={speech} />
			<Audio src={speech} title={`speech: ${text.length}`}/>
		</>
	);
};
