import {TTSEntry} from '../../phrasesToSpeech';
import {BlurProps} from '../../Video/Blur';
import { VideoClipProps } from '../../Video/types';
import {Props as SlideClipProps} from '../../Slides/PresentationClip';


export type FrameMapping<T> = [start: number, end: number, value: T];

export interface EpisodeVideoProps {
	type: 'video';
	props: {
		src: string;
		commentary: {from: number; tts: TTSEntry}[];
		volume?: FrameMapping<number>[];
		fastForward?: FrameMapping<boolean>[];
		forceNormalSpeed?: FrameMapping<boolean>[];
		blur?: FrameMapping<BlurProps>[];
		startFrom?: number;
		endAt?: number;
	};
}

export interface SingleSlideProps {
	commentary: TTSEntry;
	id: string;
	title?: string;
	img?: string;
	text?: string;
}
export interface EpisodeSlidesProps {
	type: 'slides';
	props: SingleSlideProps;
}

export type EpisodeEntryProps = EpisodeVideoProps | EpisodeSlidesProps;

export interface EpProps {
	path: string;
	id: string;
	durationInFrames?: number;
	editorMode?: boolean;
	chunked?: {
		chunk: number;
		ofChunks: number;
		chunkDuration: number;
	};
}

export type EpCompositionEntry = {
	video?: VideoClipProps;
	slide?: SlideClipProps;
	index: number
};

export type EpAudioCompositionEntry = {
	tts?: TTSEntry;
	originalVolume?: number;
};

export interface EpComposition {
	composition: FrameMapping<EpCompositionEntry>[];
	audioComposition: FrameMapping<EpAudioCompositionEntry>[];
}
