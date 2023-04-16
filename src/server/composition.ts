import {
	EpAudioCompositionEntry,
	EpComposition,
	EpCompositionEntry,
	EpisodeEntryProps,
	EpisodeSlidesProps,
	EpisodeVideoProps,
	FrameMapping,
} from '../Episodes/Standard/types';
import {SAFE_PLAYBACK_RATE} from '../constants';
import {
	AudioMeta,
	EditorMeta,
	EpMeta,
	StreamEntry,
	VideoClipMeta,
	VideoFrameType,
} from './types';

interface Acceleration {
	safeAcceleration: number;
	fastForwardAcceleration: number;
	requiredAcceleration: number;
}

export function composeEpisode(
	script: EpisodeEntryProps[],
	epMeta: EpMeta,
	targetDuration: number
): EpComposition {
	const acceleration = computeAcceleration(epMeta, targetDuration);
	const compositionSet = makeCompositionSet(
		epMeta,
		script,
		acceleration,
		targetDuration
	);
	if (compositionSet.size !== targetDuration) {
		throw new Error(
			`composition set [${compositionSet.size}] does not match duration [${targetDuration}]`
		);
	}
	const composition = computeComposition(
		compositionSet,
		epMeta,
		script,
		acceleration
	);
	return composition;
}

export function suggestCuts(meta: EpMeta, duration: number): EditorMeta {
	const allFrames = Array.from(meta.framesMap.entries());
	const {safeAcceleration} = computeAcceleration(meta, duration);
	const lastFrameAtNormalSpeed = duration - 1;
	const lastFrameAtSafeSpeed = Math.round(duration * safeAcceleration - 1);
	const lastFrameAtSafeSpeedComposite =
		meta.totalNormalSpeedFrames +
		Math.round((duration - meta.totalNormalSpeedFrames) * safeAcceleration - 1);
	return {
		compositeCut: [
			lastFrameAtSafeSpeedComposite,
			allFrames[lastFrameAtSafeSpeedComposite]
				? allFrames[lastFrameAtSafeSpeedComposite][0]
				: null,
		],
		safeSpeedCut: [
			lastFrameAtSafeSpeed,
			allFrames[lastFrameAtSafeSpeed]
				? allFrames[lastFrameAtSafeSpeed][0]
				: null,
		],
		normalSpeedCut: [
			lastFrameAtNormalSpeed,
			allFrames[lastFrameAtNormalSpeed]
				? allFrames[lastFrameAtNormalSpeed][0]
				: null,
		],
	};
}

type Visitor = {
	compositionMapping: {
		from: number;
		to: number;
		entry: EpCompositionEntry | null;
	};
	audioMapping: {
		from: number;
		to: number;
		entry: EpAudioCompositionEntry | null;
	};
	fps: number;
};

function visitAudioFrame(
	this: Visitor,
	frame: number,
	meta: AudioMeta,
	{props, type}: EpisodeVideoProps | EpisodeSlidesProps
) {
	const audioComposition: FrameMapping<EpAudioCompositionEntry>[] = [];
	const {Silence, TTS, Original} = meta.framesMap.get(frame)!;

	const ttsProp =
		TTS &&
		(type === 'slides' ? props.commentary : props.commentary[TTS.tts].tts);

	const {originalVolume, tts} = this.audioMapping.entry || {};
	if (originalVolume !== undefined && Original?.volume === originalVolume) {
		this.audioMapping.to++;
	} else if (tts !== undefined && ttsProp === tts) {
		this.audioMapping.to++;
	} else if (Silence && originalVolume === undefined && tts === undefined) {
		this.audioMapping.to++;
	} else {
		if (this.audioMapping.entry) {
			audioComposition.push(...releaseVisitorAudioBuffer.call(this));
		}
		this.audioMapping.to = this.audioMapping.from + 1;

		const newEntry: EpAudioCompositionEntry = {};

		if (Original) {
			newEntry.originalVolume = Original.volume;
		} else if (TTS) {
			newEntry.tts = ttsProp;
		}
		this.audioMapping.entry = newEntry;
	}

	return audioComposition;
}

function releaseVisitorCompBuffer(this: Visitor) {
	const {slide, video} = this.compositionMapping.entry || {};
	const composition: FrameMapping<EpCompositionEntry>[] = [];
	if (slide) {
		composition.push([
			this.compositionMapping.from,
			this.compositionMapping.to,
			this.compositionMapping.entry as EpCompositionEntry,
		]);
	} else if (video) {
		if (!video.accelerate) {
			throw new Error('missing accelerate');
		}
		composition.push([
			this.compositionMapping.from,
			this.compositionMapping.to,
			this.compositionMapping.entry as EpCompositionEntry,
		]);
	}
	this.compositionMapping = {
		from: this.compositionMapping.to + 1,
		to: 0,
		entry: null,
	};
	return composition;
}

function releaseVisitorAudioBuffer(this: Visitor) {
	const audioComposition: FrameMapping<EpAudioCompositionEntry>[] = [];
	if (this.audioMapping.entry) {
		audioComposition.push([
			this.audioMapping.from,
			this.audioMapping.to,
			this.audioMapping.entry,
		]);
	}
	this.audioMapping = {from: this.audioMapping.to + 1, to: 0, entry: null};
	return audioComposition;
}

function visitSlidesFrame(
	this: Visitor,
	{props}: EpisodeSlidesProps,
	index: number
) {
	const composition: FrameMapping<EpCompositionEntry>[] = [];
	const {slide, video} = this.compositionMapping.entry || {};

	if (slide && slide.id === props.id) {
		// continue same buffer
		this.compositionMapping.to++;
	} else {
		if (slide || video) {
			composition.push(...releaseVisitorCompBuffer.call(this));
		}

		this.compositionMapping.to = this.compositionMapping.from;

		const newEntry: EpCompositionEntry = {
			index,
			slide: {
				id: props.id,
				img: props.img,
				text: props.text,
				title: props.title,
			},
		};
		this.compositionMapping.entry = newEntry;
	}
	return composition;
}

function visitVideoFrame(
	this: Visitor,
	{frame, index}: {frame: number; index: number},
	meta: VideoClipMeta,
	{props}: EpisodeVideoProps,
	{safeAcceleration, fastForwardAcceleration}: Acceleration
) {
	const composition: FrameMapping<EpCompositionEntry>[] = [];
	const accelerate = [1, safeAcceleration, fastForwardAcceleration][
		meta.framesMap.has(frame) === false
			? -1
			: (meta.framesMap.get(frame) as number)
	];

	if (!accelerate) {
		throw new Error('broken meta');
	}

	const {video, slide} = this.compositionMapping.entry || {};

	if (video?.src === props.src && video?.accelerate === accelerate) {
		// continue same buffer
		this.compositionMapping.to++;
		video.endAt = frame;
	} else {
		if (slide || video) {
			composition.push(...releaseVisitorCompBuffer.call(this));
		}
		this.compositionMapping.to = this.compositionMapping.from + 1;

		const newEntry: EpCompositionEntry = {
			index,
			video: {
				src: props.src,
				startFrom: frame,
				endAt: Math.round(frame+accelerate),
				accelerate,
				offthread: meta.allowOffthread && accelerate > safeAcceleration,
			},
		};
		this.compositionMapping.entry = newEntry;
	}

	return composition;
}

function visitFrame(
	this: Visitor,
	entry: StreamEntry,
	{sequence, audioSequence}: EpMeta,
	script: EpisodeEntryProps[],
	acceleration: Acceleration
) {
	const composition: FrameMapping<EpCompositionEntry>[] = [];
	const audioComposition: FrameMapping<EpAudioCompositionEntry>[] = [];
	const [[videoAt, frame], [audioAt, audioFrame]] = entry;
	const vMeta = sequence[videoAt];
	const vProps = script[videoAt];
	const aMeta = audioSequence[audioAt];
	if (vProps.type === 'video') {
		composition.push(
			...visitVideoFrame.call(
				this,
				{frame, index: videoAt},
				vMeta as VideoClipMeta,
				vProps,
				acceleration
			)
		);
	} else {
		composition.push(...visitSlidesFrame.call(this, vProps, videoAt));
	}
	audioComposition.push(
		...visitAudioFrame.call(this, audioFrame, aMeta, vProps)
	);

	return {composition, audioComposition};
}

function computeComposition(
	compositionSet: Set<StreamEntry>,
	meta: EpMeta,
	script: EpisodeEntryProps[],
	acceleration: Acceleration
): EpComposition {
	const composition: FrameMapping<EpCompositionEntry>[] = [];
	const audioComposition: FrameMapping<EpAudioCompositionEntry>[] = [];

	const buffer: Visitor = {
		audioMapping: {from: 0, to: 0, entry: null},
		compositionMapping: {from: 0, to: 0, entry: null},
		fps: meta.fps,
	};

	for (const streams of compositionSet.values()) {
		const result = visitFrame.call(buffer, streams, meta, script, acceleration);
		composition.push(...result.composition);
		audioComposition.push(...result.audioComposition);
	}

	composition.push(...releaseVisitorCompBuffer.call(buffer));
	audioComposition.push(...releaseVisitorAudioBuffer.call(buffer));

	return {composition, audioComposition};
}

function computeAcceleration(
	{
		totalSlidesDuration,
		totalNormalSpeedFrames,
		totalSafeAcceleratedFrames,
		totalFastForwardFrames,
	}: EpMeta,
	targetDuration: number
): Acceleration {
	const retrofitDuration =
		targetDuration - totalNormalSpeedFrames - totalSlidesDuration;

	const framesToAccelerateAll =
		totalSafeAcceleratedFrames + totalFastForwardFrames;

	const requiredAcceleration = framesToAccelerateAll / retrofitDuration;

	let fastForwardAcceleration = requiredAcceleration;
	let safeAcceleration = requiredAcceleration;

	if (safeAcceleration > SAFE_PLAYBACK_RATE) {
		safeAcceleration = SAFE_PLAYBACK_RATE;
		const safeAcceleratedFrames = Math.ceil(
			totalSafeAcceleratedFrames / safeAcceleration
		);
		const leftOverAcceleration =
			totalFastForwardFrames / (retrofitDuration - safeAcceleratedFrames);

		fastForwardAcceleration = leftOverAcceleration;

		if (retrofitDuration < safeAcceleratedFrames) {
			throw new Error(
				`can not retrofit ${retrofitDuration} < ${safeAcceleratedFrames} by ${
					safeAcceleratedFrames - retrofitDuration
				}`
			);
		}
	}

	
	return {
		safeAcceleration,
		fastForwardAcceleration,
		requiredAcceleration,
	};
}

function makeCompositionSet(
	{framesMap, sequence}: EpMeta,
	script: EpisodeEntryProps[],
	{safeAcceleration, fastForwardAcceleration}: Acceleration,
	targetDuration: number
) {
	const compositionSet = new Set<StreamEntry>();
	const frames = Array.from(framesMap.values());

	console.log(safeAcceleration, fastForwardAcceleration)
	let f = 0;
	while (compositionSet.size < targetDuration) {
		const streams = frames[f];
		const [[videoAt, frame]] = streams;
		const vEntry = script[videoAt];
		if (vEntry.type === 'slides') {
			compositionSet.add(streams);
			f++;
		} else {
			const vMeta = sequence[videoAt] as VideoClipMeta;
			const frameType = vMeta.framesMap.get(frame);
			let advanceBy = 0;
			compositionSet.add(streams);
			do {
				advanceBy++;
				if (
					!vMeta.framesMap.has(advanceBy + frame) ||
					vMeta.framesMap.get(advanceBy + frame) !== frameType
				) {
					break;
				}
			} while (
				advanceBy <
				(frameType === VideoFrameType.Normal
					? 1
					: frameType === VideoFrameType.Accelerated
					? Math.floor(safeAcceleration)
					: fastForwardAcceleration)
			);
			console.log(advanceBy)
			f += advanceBy;
		}
	}

	return compositionSet;
}

export function validateComposition(comp: EpComposition): void | Error[] {
	const errs = [
		...validateMapping(comp.composition),
		...validateMapping(comp.audioComposition),
	];

	if (errs.length) {
		return errs;
	}
}

function validateMapping<T>(mapping: FrameMapping<T>[]): Error[] {
	const errs = [] as Error[];
	for (const [at, [from, to]] of mapping.entries()) {
		const previous = mapping[at - 1];
		if (from % 1) {
			errs.push(
				new Error(`"from" must be an integer: [${from},${to}] at ${at}`)
			);
		}
		if (to % 1) {
			errs.push(new Error(`"to" must be an integer: [${from},${to}] at ${at}`));
		}
		if (from >= to) {
			errs.push(
				new Error(
					`"from" must be less than "to" in mapping: [${from},${to}] at ${at}`
				)
			);
		}
		if (to-from === 0) {
			errs.push(
				new Error(
					`zero duration in mapping: [${from},${to}] at ${at}`
				)
			);
		}
		if (previous) {
			const [prevFrom, prevTo] = previous;
			if (prevTo !== from-1) {
				errs.push(
					new Error(
						`mappings must be continuous: [${prevFrom}, ${prevTo}] at ${
							at - 1
						} [${from},${to}] at ${at}`
					)
				);
			}
		}
	}

	return errs;
}
