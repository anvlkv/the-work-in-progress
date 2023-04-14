import ffprobe from 'ffprobe';
import {path as ffprobePath} from 'ffprobe-static';
import ffmpegPath from 'ffmpeg-static';
import {VideoMetadata} from '@remotion/media-utils';
import {getCanExtractFramesFast} from '@remotion/renderer';
import {
	EpisodeVideoProps,
	EpisodeEntryProps,
	FrameMapping,
} from '../Episodes/Standard/types';
import {phrasesToTTsUrl, TTSEntry} from '../phrasesToSpeech';
import {
	VideoFrameType,
	AudioFrameType,
	EpMeta,
	VideoClipMeta,
	SlidesMeta,
	AudioMeta,
} from './types';

export const ffprobeCache = {} as {[key: string]: number | VideoMetadata};

const cached = (url: string) => ffprobeCache[url];
const setCached = (url: string, val: number | VideoMetadata) => {
	ffprobeCache[url] = val;
};

async function getAudioDurationInSeconds(url: string): Promise<number> {
	if (cached(url)) {
		return cached(url) as number;
	}
	const probe = await ffprobe(url, {path: ffprobePath});
	const stream = probe.streams[0];
	const val = parseFloat(stream.duration as unknown as string);
	setCached(url, val);
	return val;
}

async function getVideoMetadata(
	url: string
): Promise<VideoMetadata & {allowOffthread: boolean}> {
	if (cached(url)) {
		return cached(url) as VideoMetadata & {allowOffthread: boolean};
	}
	const probe = await ffprobe(`${url}`, {path: ffprobePath});
	const stream = probe.streams[0];
	const {canExtractFramesFast, shouldReencode} = await getCanExtractFramesFast({
		src: url,
		ffprobeExecutable: ffprobePath,
		ffmpegExecutable: ffmpegPath,
	}).catch(e => ({canExtractFramesFast: true, shouldReencode: true}));
	if (shouldReencode && !canExtractFramesFast) {
		console.info(`video ${url} can be re-encoded to extract frames fast`);
	}
	const meta: VideoMetadata & {allowOffthread: boolean} = {
		aspectRatio: (stream.width || 0) / (stream.height || 0),
		durationInSeconds: parseFloat(stream.duration as unknown as string),
		height: stream.height || 0,
		width: stream.width || 0,
		isRemote: false,
		allowOffthread: canExtractFramesFast,
	};
	setCached(url, meta);
	return meta;
}

async function getTTSDurationInSeconds(text: TTSEntry) {
	if (text.length === 0) {
		return 0;
	}
	const textUrl = phrasesToTTsUrl(text);
	return (
		(await getAudioDurationInSeconds(textUrl)) +
		(typeof text[0] === 'number' ? text[0] : 0)
	);
}

function applySpeechMap(
	{
		framesMap,
		audioMap,
		ttsDurations,
	}: {
		framesMap: Map<number, VideoFrameType>;
		audioMap: Map<number, AudioFrameType>;
		ttsDurations: number[];
	},
	{props}: EpisodeVideoProps,
	fps: number
) {
	const overshootMap = new Map<number, [VideoFrameType, AudioFrameType]>();
	let speechDuration = 0;
	for (const [at, {from}] of props.commentary.entries()) {
		if (!framesMap.has(from)) {
			throw new Error('commentary out of frame range');
		}
		const ttsDuration = Math.round(ttsDurations[at] * fps);
		for (let f = from; f <= ttsDuration + from; f++) {
			if (framesMap.has(f)) {
				audioMap.set(f, {TTS: {tts: at}});
				framesMap.set(f, VideoFrameType.Normal);
			} else {
				overshootMap.set(f - from, [VideoFrameType.Normal, {TTS: {tts: -1}}]);
			}
			speechDuration++;
		}
	}

	return {
		framesMap,
		overshootMap,
		audioMap,
		speechDuration,
	};
}

function computeVideoMap(
	{props}: EpisodeVideoProps,
	meta: VideoMetadata,
	fps: number
) {
	const framesMap = new Map<number, VideoFrameType>();
	const audioMap = new Map<number, AudioFrameType>();
	const originalDuration = Math.round(meta.durationInSeconds * fps);

	let ff;
	let ns;
	let volume;
	let duration = 0;

	for (
		let f = props.startFrom || 0;
		f <= (props.endAt || originalDuration);
		f++
	) {
		let speed = VideoFrameType.Accelerated;
		ff =
			ff ||
			props.fastForward?.find(([from, to, v]) => v && from >= f && f <= to);
		ns =
			ns ||
			props.forceNormalSpeed?.find(
				([from, to, v]) => v && from >= f && f <= to
			);
		volume =
			volume ||
			props.volume?.find(([from, to, v]) => v && from >= f && f <= to);
		if (ff) {
			if (ff[1] === f) {
				ff = undefined;
			}
			speed = VideoFrameType.Fast;
		}
		if (ns) {
			if (ns[1] === f) {
				ns = undefined;
			}
			speed = VideoFrameType.Normal;
		}
		if (volume) {
			const vv = volume as FrameMapping<number>;
			if (volume[1] === f) {
				volume = undefined;
			}
			audioMap.set(f, {Original: {volume: vv[2]}});
		} else {
			audioMap.set(f, {Silence: true});
		}
		framesMap.set(f, speed);
		duration++;
	}

	return {
		framesMap,
		duration,
		audioMap,
	};
}

function computeTTSMap(
	entryIndex: number,
	durationInSeconds: number,
	fps: number
) {
	const duration = Math.round(durationInSeconds * fps);
	const framesMap = new Map<number, AudioFrameType>(
		Array.from<[number, AudioFrameType]>({length: duration})
			.fill([0, {TTS: {tts: entryIndex}}])
			.map(([, f], i) => [i, f])
	);
	return {
		framesMap,
		duration,
	};
}
function computeSlidesMap(
	entryIndex: number,
	durationInSeconds: number,
	fps: number
) {
	const duration = Math.round(durationInSeconds * fps);
	const framesMap = new Map<number, number>(
		Array.from<[number, number]>({length: duration})
			.fill([0, entryIndex])
			.map(([, f], i) => [i, f])
	);
	return {
		framesMap,
		duration,
	};
}

export async function computeEpisodeMeta(
	script: EpisodeEntryProps[],
	fps: number
): Promise<EpMeta> {
	const sequence: (VideoClipMeta | SlidesMeta)[] = [];
	const audioSequence: AudioMeta[] = [];
	const runningTotals = {
		totalVideoDuration: 0,
		totalSlidesDuration: 0,
		totalFastForwardFrames: 0,
		totalNormalSpeedFrames: 0,
		totalSafeAcceleratedFrames: 0,
	};
	const entriesMeta = [] as (
		| [VideoMetadata & {allowOffthread: boolean}, number[]]
		| number
	)[];

	for (const entry of script) {
		switch (entry.type) {
			case 'video':
				entriesMeta.push(
					await getVideoMetadata(`./public/${entry.props.src}`).then(
						async (d) => [
							d,
							await Promise.all(
								entry.props.commentary.map(({tts}) =>
									getTTSDurationInSeconds(tts)
								)
							),
						]
					)
				);
				break;
			case 'slides':
				entriesMeta.push(await getTTSDurationInSeconds(entry.props.commentary));
				break;
			default:
				throw new Error('unsupported type');
		}
	}

	const epMap: EpMeta['framesMap'] = new Map();
	let overshoot;

	for (const [at, entry] of script.entries()) {
		const meta = entriesMeta[at];
		switch (entry.type) {
			case 'video': {
				const [vMeta, ttsDurations] = meta as [VideoMetadata, number[]];
				const {duration, ...maps} = computeVideoMap(entry, vMeta, fps);
				if (overshoot) {
					// apply tts overshoot from previous iteration
					const first = entry.props.startFrom || 0;
					overshoot.forEach(([v, a], f) => {
						maps.framesMap.set(f + first, v);
						if (!maps.audioMap.get(f + first)?.Silence) {
							console.warn(`audio overlap ${f} frames with ${entry.props.src}`);
						}
						maps.audioMap.set(f + first, a);
					});
					overshoot = undefined;
				}

				const {framesMap, overshootMap, audioMap} = applySpeechMap(
					{...maps, ttsDurations},
					entry,
					fps
				);

				const durationInSeconds = duration / fps;

				sequence.push({
					...vMeta,
					isVideo: true,
					framesMap,
					originalDurationInSeconds: vMeta.durationInSeconds,
					durationInSeconds,
				} as VideoClipMeta);

				audioSequence.push({
					isAudio: true,
					framesMap: audioMap,
					durationInSeconds,
				});

				framesMap.forEach((value, frame) => {
					epMap.set(`${entry.props.src}|${epMap.size}`, [
						[sequence.length - 1, frame],
						[audioSequence.length - 1, frame],
					]);
					switch (value) {
						case VideoFrameType.Normal:
							runningTotals.totalNormalSpeedFrames++;
							break;
						case VideoFrameType.Accelerated:
							runningTotals.totalSafeAcceleratedFrames++;
							break;
						case VideoFrameType.Fast:
							runningTotals.totalFastForwardFrames++;
							break;
						default:
							throw new Error('unsupported type');
					}

					runningTotals.totalVideoDuration++;
				});
				if (overshootMap.size) {
					// store for next iteration
					overshoot = overshootMap;
				}
				break;
			}
			case 'slides': {
				const durationInSeconds = meta as number;
				let slidesDuration = 0;
				const {framesMap} = computeTTSMap(at, durationInSeconds, fps);
				const {framesMap: slidesMap} = computeSlidesMap(
					at,
					durationInSeconds,
					fps
				);
				sequence.push({
					isSlides: true,
					durationInSeconds: slidesDuration,
					framesMap: slidesMap,
				} as SlidesMeta);
				audioSequence.push({
					isAudio: true,
					durationInSeconds,
					framesMap,
				});
				framesMap.forEach((value, frame) => {
					epMap.set(`slides_${entry.props.id}|${epMap.size}`, [
						[at, frame],
						[at, frame],
					]);
					runningTotals.totalSlidesDuration++;
				});
				slidesDuration += durationInSeconds;
				// });

				break;
			}
			default:
				throw new Error('unsupported type');
		}
	}

	if (overshoot) {
		throw new Error('TTS overshoot left...');
	}

	const meta = {
		fps,
		audioSequence,
		sequence,
		framesMap: epMap,
		...runningTotals,
	};
	validateMeta(meta);
	return meta;
}

function validateMeta(meta: EpMeta) {
	if (
		meta.totalVideoDuration !==
		meta.totalFastForwardFrames +
			meta.totalSafeAcceleratedFrames +
			meta.totalNormalSpeedFrames
	) {
		throw new Error(`sum of frames does not match`);
	}
}
