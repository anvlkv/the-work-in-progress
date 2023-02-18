import { useAudioData } from '@remotion/media-utils';
import { useState, useLayoutEffect, useEffect } from 'react';
import {Audio, continueRender, delayRender, prefetch, useVideoConfig} from 'remotion';
import { phrasesToTTsUrl } from '../phrasesToSpeech';
import {TalkingHead} from './TalkingHead';

export const SpeakingHead: React.FC<{text: string; ssml?: boolean}> = ({
	text,
	ssml = false,
}) => {
	const speech = phrasesToTTsUrl(text, ssml);
	return (
		<>
			<TalkingHead fileName={speech} />
			<Audio src={speech} title={`speech: ${text.length}`}/>
		</>
	);
};
