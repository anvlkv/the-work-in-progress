import ffprobe from 'ffprobe';
import {path as ffprobePath} from 'ffprobe-static';
import {VideoMetadata} from '@remotion/media-utils';
import {
	VideoClipMeta,
	SlidesMeta,
	EpisodeVideoProps,
	SingleSlideProps,
} from '../Episodes/Standard/types';
import {phrasesToTTsUrl, TTSEntry} from '../phrasesToSpeech';
import {FrameMapping} from '../Video/VideoClip';

async function getAudioDurationInSeconds(url: string): Promise<number> {
	const probe = await ffprobe(url, {path: ffprobePath});
	const stream = probe.streams[0];
	return parseFloat(stream.duration as unknown as string);
}

async function getVideoMetadata(url: string): Promise<VideoMetadata> {
	const probe = await ffprobe(`./public/${url}`, {path: ffprobePath});
	const stream = probe.streams[0];
	const meta: VideoMetadata = {
		aspectRatio: (stream.width || 0) / (stream.height || 0),
		durationInSeconds: parseFloat(stream.duration as unknown as string),
		height: stream.height || 0,
		width: stream.width || 0,
		isRemote: false,
	};
	return meta;
}

export async function processTTSDuration(text: TTSEntry, fps: number) {
	if (text.length === 0) {
		return 0;
	}
	const textUrl = phrasesToTTsUrl(text);
	const duration = await getAudioDurationInSeconds(textUrl);
	return Math.round(
		(duration + (typeof text[0] === 'number' ? text[0] : 0)) * fps
	);
}

export async function processVideoClipMeta(
	{
		commentary = [],
		src,
		endAt,
		startFrom = 0,
		fastForward,
		forceNormalSpeed = [],
	}: EpisodeVideoProps['props'],
	fps: number
) {
	const safeTo = (to: null | number) => (to === null ? Infinity : to);
	const toMax = (to: null | number) => {
		const mTo =
			to === null || to === Infinity
				? endAt || Math.round(videoClipMeta.durationInSeconds * fps)
				: to;
		return Math.min(
			mTo,
			endAt || Math.round(videoClipMeta.durationInSeconds * fps)
		);
	};
	const fromMin = (from: number) => Math.max(startFrom || 0, from, 0);
	const videoMeta = await getVideoMetadata(src);
	const videoClipMeta: VideoClipMeta = {
		isVideo: true,
		...videoMeta,
		scriptDuration: 0,
		duration: Math.round(videoMeta.durationInSeconds * fps),
		originalDurationInSeconds: videoMeta.durationInSeconds,
		remappedTTS: [],
		remappedFastForward: [],
		remappedNormalSpeed: forceNormalSpeed,
		fastForwardFrames: 0,
		normalSpeedFrames: 0,
		speechOvershoot: 0,
	};
	videoClipMeta.duration;
	videoClipMeta.duration -=
		endAt === undefined ? 0 : videoClipMeta.duration - endAt;
	videoClipMeta.duration -= startFrom;
	videoClipMeta.durationInSeconds = videoClipMeta.duration / fps;

	// videoClipMeta.duration = Math.round(videoClipMeta.durationInSeconds * fps);
	for (const tts of commentary) {
		const {from, tts: text} = tts;
		const duration = (await processTTSDuration(text, fps)) || 0;
		const to = duration + from;
		videoClipMeta.scriptDuration += duration;
		videoClipMeta.remappedTTS.push([from, to, text]);

		if (from > toMax(from)) {
			videoClipMeta.speechOvershoot += to - from;
		} else if (to > toMax(to)) {
			videoClipMeta.speechOvershoot += to - toMax(to);
		}

		const matchingNSFrames = forceNormalSpeed.findIndex(
			([nFrom, nTo]) => nFrom <= from && safeTo(nTo) >= to
		);
		const endingEarlyNSFrames = forceNormalSpeed.findIndex(
			([nFrom, nTo]) => nFrom <= from && safeTo(nTo) > from && safeTo(nTo) < to
		);
		const startingLateNSFrames = forceNormalSpeed.findIndex(
			([nFrom, nTo]) => nFrom <= from && safeTo(nTo) > from && safeTo(nTo) < to
		);
		const prevAdjacentNSFrames = forceNormalSpeed.findIndex(
			([nFrom, nTo]) => nFrom < from && safeTo(nTo) < from && safeTo(nTo) < to
		);
		const nextAdjacentNSFrames = forceNormalSpeed.findIndex(
			([nFrom, nTo]) => nFrom > from && safeTo(nTo) > from && safeTo(nTo) > to
		);

		if (matchingNSFrames === -1) {
			if (endingEarlyNSFrames >= 0) {
				forceNormalSpeed[endingEarlyNSFrames][1] = toMax(to);
			} else if (startingLateNSFrames >= 0) {
				forceNormalSpeed[startingLateNSFrames][0] = fromMin(from);
			} else if (nextAdjacentNSFrames === -1) {
				forceNormalSpeed.push([from, toMax(to), true]);
			} else {
				forceNormalSpeed.splice(prevAdjacentNSFrames + 1, 0, [
					from,
					toMax(to),
					true,
				]);
			}
		}
	}

	
	videoClipMeta.remappedNormalSpeed.forEach((vv) => {
		vv[0] = fromMin(vv[0] || 0);
		vv[1] = toMax(vv[1] || videoClipMeta.duration);
	});

	fastForward =
		forceNormalSpeed?.length && fastForward
			? forceNormalSpeed.reduce(
					(acc, [from, to]) =>
						reSliceFragment(from, toMax(to) - from, acc, toMax),
					fastForward
			  )
			: fastForward;

	videoClipMeta.remappedFastForward = fastForward || [];

	videoClipMeta.remappedFastForward.forEach((vv) => {
		vv[0] = fromMin(vv[0] || 0);
		vv[1] = toMax(vv[1] || videoClipMeta.duration);
	});

	videoClipMeta.fastForwardFrames = Math.round(
		fastForward
			? fastForward.reduce<number>(
					(sum, [from, to, ff]: FrameMapping<boolean>) =>
						ff ? sum + toMax(to) - fromMin(from) : sum,
					0
			  )
			: 0
	);

	videoClipMeta.normalSpeedFrames = Math.round(
		forceNormalSpeed
			? forceNormalSpeed.reduce<number>(
					(sum, [from, to, ns]: FrameMapping<boolean>) =>
						ns ? sum + toMax(to) - fromMin(from) : sum,
					0
			  )
			: 0
	);
	const accelerated =
		videoClipMeta.duration -
		videoClipMeta.fastForwardFrames -
		videoClipMeta.normalSpeedFrames;
	console.log({
		normal: videoClipMeta.normalSpeedFrames,
		fFast: videoClipMeta.fastForwardFrames,
		accelerated,
	});

	if (accelerated !== 0) {
		throw new Error('it does it wrong');
	}

	return videoClipMeta;
}

export async function processSlidesMeta(
	script: SingleSlideProps[],
	fps: number
): Promise<SlidesMeta> {
	const slidesMeta = await Promise.all(
		script.map(({commentary}) => processTTSDuration(commentary, fps) || [0, ''])
	).then(
		(d) =>
			({
				isSlides: true,
				...d.reduce(
					(acc, dd, at) => {
						const last = acc.remappedTTS[acc.remappedTTS.length - 1];
						const from = (last && last[1]) || 0;
						const to = from + dd;
						acc.remappedTTS.push([from, to, script[at].commentary]);
						acc.scriptDuration += dd;
						return acc;
					},
					{remappedTTS: [] as FrameMapping<TTSEntry>[], scriptDuration: 0}
				),
			} as SlidesMeta)
	);
	return slidesMeta;
}

function reSliceFragment(
	from: number,
	duration: number,
	acc: FrameMapping<boolean>[],
	safeTo: (to: number | null) => number,
) {
	const startsEarlierEndsLater = acc.findIndex(
		([fFrom, to]) => fFrom <= from && safeTo(to) >= safeTo(from + duration)
	);
	const startsEarlier = acc.findIndex(
		([fFrom, to]) => fFrom <= from && safeTo(to) > from
	);
	const endsLater = acc.findIndex(
		([fFrom, to]) => fFrom >= from && safeTo(to) > from
	);

	if (startsEarlierEndsLater >= 0) {
		const prevEnding = acc[startsEarlierEndsLater][1];
		// should end before script
		acc[startsEarlierEndsLater][1] = from;
		// should restart after script
		acc.splice(startsEarlierEndsLater + 1, 0, [
			from + duration,
			prevEnding,
			acc[startsEarlierEndsLater][2],
		]);
	} else if (startsEarlier >= 0) {
		// should end before script
		acc[startsEarlier][1] = from;
	} else if (endsLater >= 0) {
		// should start after script
		acc[endsLater][0] = from + duration;
	}

	return acc;
}
