import {VideoMetadata} from '@remotion/media-utils';
import {TTSEntry} from '../../phrasesToSpeech';
import {BlurProps} from '../../Video/Blur';
import {FrameMapping} from '../../Video/VideoClip';

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
	title?: string;
	img?: string;
	text?: string;
}
export interface EpisodeSlidesProps {
	type: 'slides';
	props: SingleSlideProps[];
}

export type EpisodeEntryProps = EpisodeVideoProps | EpisodeSlidesProps;

export interface EpProps {
	script: EpisodeEntryProps[];
	id?: string;
	durationInFrames?: number;
	editorMode?: boolean;
	chunked?: {
		chunk: number;
		ofChunks: number;
		chunkDuration: number;
	};
}

export type VideoClipMeta = VideoMetadata & {
	isVideo: true;
	originalDurationInSeconds: number;
	duration: number;
	scriptDuration: number;
	normalSpeedFrames: number;
	fastForwardFrames: number;
	speechOvershoot: number;
	remappedTTS: FrameMapping<TTSEntry>[];
	remappedFastForward: FrameMapping<boolean>[]
	remappedNormalSpeed: FrameMapping<boolean>[]
};

export type SlidesMeta = {
	isSlides: true;
	scriptDuration: number;
	remappedTTS: FrameMapping<TTSEntry>[];
};

export type Meta = (VideoClipMeta | SlidesMeta) & {
	isVideo?: boolean;
	isSlides?: boolean;
};

export interface EpMeta {
	totalSlidesDuration: number;
	totalVideoDurationInSeconds: number;
	totalVideoDuration: number;
	totalNormalSpeedFrames: number;
	totalFastForwardFrames: number;
	totalSafeAcceleratedFrames: number
}
