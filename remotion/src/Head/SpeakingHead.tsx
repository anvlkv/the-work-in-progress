import {Audio} from 'remotion';
import { phrasesToTTsUrl, TTSEntry } from '../phrasesToSpeech';
import {TalkingHead} from './TalkingHead';

export const SpeakingHead: React.FC<{speech: TTSEntry}> = ({
	speech
}) => {
	const url = phrasesToTTsUrl(speech);
	return (
		<>
			<TalkingHead fileName={url} />
		</>
	);
};
