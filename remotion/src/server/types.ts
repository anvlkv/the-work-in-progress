import { VideoMetadata } from "@remotion/media-utils";

export enum VideoFrameType {
	Normal = 0,
	Accelerated = 1,
	Fast = 2,
}

export type AudioFrameType = {
	Silence?: true,
	TTS?: {tts: number},
	Original?: {volume: number},
}

export type VideoClipMeta = VideoMetadata & {
	isVideo: true;
	originalDurationInSeconds: number;
	framesMap: Map<number, VideoFrameType>;
	allowOffthread: boolean
};

export interface AudioMeta {
	isAudio: true;
	durationInSeconds: number;
	framesMap: Map<number, AudioFrameType>;
}

export interface SlidesMeta {
	isSlides: true;
	durationInSeconds: number;
}

export type StreamEntry = [
  video: [index: number, frame: number],
  audio: [index: number, frame: number]
]

export interface EpMeta {
	fps: number,
	sequence: (VideoClipMeta | SlidesMeta)[];
	audioSequence: AudioMeta[];
	framesMap: Map<
		`${string}|${number}`,
		StreamEntry
	>;
	totalSlidesDuration: number;
	totalVideoDuration: number;
	totalNormalSpeedFrames: number;
	totalFastForwardFrames: number;
	totalSafeAcceleratedFrames: number;
}

export interface EditorMeta {
	normalSpeedCut: [number, string | null]
	safeSpeedCut: [number, string | null]
	compositeCut: [number, string | null]
}

