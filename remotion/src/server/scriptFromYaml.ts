import yaml from 'yaml';
import fs from 'fs';
import deepEqual from 'deep-equal';
import {
	EpisodeEntryProps,
	EpisodeSlidesProps,
	EpisodeVideoProps as OptionalVideoProps,
	SingleSlideProps,
} from '../Episodes/Standard/types';
import {TTSEntry} from '../phrasesToSpeech';

type EpisodeVideoProps = OptionalVideoProps & {
	props: Required<Omit<OptionalVideoProps['props'], 'endAt' | 'startFrom'>>;
};

function blurGeometryFromKey(key: string) {
	const [x, y, x1, y1] = (key.match(/(\d*\s)(\d*\s)(\d*\s)(\d*)/) || [])
		.slice(1)
		.map((s) => parseFloat(s));
	return {x, y, x1, y1};
}

type Marker = 'start' | 'end';

export interface FrameProps {
	tts?: TTSEntry;
	startFrom?: boolean;
	endAt?: boolean;
	blur?: {end?: string; start?: string};
	ff?: Marker;
	ns?: Marker;
	volume?: number;
}

type VideoScript = {
	[frame: string]: FrameProps | TTSEntry;
};

type SlidesScript = Omit<SingleSlideProps, 'commentary'> & {tts: TTSEntry};

interface VideoOps {
	currentBlur: Map<string, [number, number]>;
	currentVolume: false | [from: number, v: number];
	currentFF: false | number;
	currentNS: false | number;
}

function parseStartFrom(
	prop: FrameProps['startFrom'],
	frame: number,
	acc: EpisodeVideoProps
) {
	if (prop) {
		acc.props.startFrom = frame;
	}
}

function parseEndAt(
	prop: FrameProps['endAt'],
	frame: number,
	acc: EpisodeVideoProps
) {
	if (prop) {
		acc.props.endAt = frame;
	}
}

function parseTTS(
	prop: FrameProps['tts'],
	frame: number,
	acc: EpisodeVideoProps
) {
	if (prop) {
		acc.props.commentary.push({from: frame, tts: prop});
	}
}

function parseFF(
	ff: FrameProps['ff'],
	frame: number,
	acc: EpisodeVideoProps,
	videoOps: VideoOps
) {
	if (ff === 'start') {
		videoOps.currentFF = frame;
	} else if (ff === 'end' && videoOps.currentFF !== false) {
		const last = acc.props.fastForward[acc.props.fastForward.length - 1];
		if (last && last[1] === Infinity) {
			last[1] = frame;
		} else {
			acc.props.fastForward.push([videoOps.currentFF, frame, true]);
		}
		videoOps.currentFF = false;
	}
}

function parseNS(
	ns: FrameProps['ns'],
	frame: number,
	acc: EpisodeVideoProps,
	videoOps: VideoOps
) {
	if (ns === 'start') {
		videoOps.currentNS = frame;
	} else if (ns === 'end' && videoOps.currentNS !== false) {
		const last =
			acc.props.forceNormalSpeed[acc.props.forceNormalSpeed.length - 1];
		if (last && last[1] === Infinity) {
			last[1] = frame;
		} else {
			acc.props.forceNormalSpeed.push([videoOps.currentNS, frame, true]);
		}
		videoOps.currentNS = false;
	}
}

function parseVolume(
	volume: FrameProps['volume'],
	frame: number,
	acc: EpisodeVideoProps,
	videoOps: VideoOps
) {
	if (volume && volume > 0) {
		videoOps.currentVolume = [frame, volume];
	} else if (volume === 0 && videoOps.currentVolume !== false) {
		const last = acc.props.volume[acc.props.volume.length - 1];
		if (last && last[1] === Infinity) {
			last[1] = frame;
		} else {
			acc.props.volume.push([
				videoOps.currentVolume[0],
				frame,
				videoOps.currentVolume[1],
			]);
		}
		videoOps.currentVolume = false;
	}
}

function parseBlur(
	blur: FrameProps['blur'],
	frame: number,
	acc: EpisodeVideoProps,
	videoOps: VideoOps
) {
	if (blur) {
		// videoOps.currentBlur.get(blur.end);
		const {start, end} = blur;
		if (start) {
			const entry: [number, number] = [frame, Infinity];
			videoOps.currentBlur.set(start, entry);
		}
		if (end) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const endEntry = videoOps.currentBlur.get(end)!;
			const props = blurGeometryFromKey(end);
			const last = acc.props.blur.find(
				([, to, pp]) => to === Infinity && deepEqual(pp, props)
			);
			if (last) {
				last[1] = frame;
			} else {
				acc.props.blur.push([endEntry[0], frame, props]);
			}
			videoOps.currentBlur.delete(end);
		}
	}
}

function spreadVideoOps(acc: EpisodeVideoProps, videoOps: VideoOps) {
	const lastFf = acc.props.fastForward[acc.props.fastForward.length - 1];
	if (videoOps.currentFF !== false && (!lastFf || lastFf[1] !== Infinity)) {
		acc.props.fastForward.push([videoOps.currentFF, Infinity, true]);
	}

	const lastNs =
		acc.props.forceNormalSpeed[acc.props.forceNormalSpeed.length - 1];
	if (videoOps.currentNS !== false && (!lastNs || lastNs[1] !== Infinity)) {
		acc.props.forceNormalSpeed.push([videoOps.currentNS, Infinity, true]);
	}

	const lastVolume = acc.props.volume[acc.props.volume.length - 1];
	if (videoOps.currentVolume !== false && (!lastVolume || lastVolume[1] !== Infinity)) {
		acc.props.volume.push([
			videoOps.currentVolume[0],
			Infinity,
			videoOps.currentVolume[1],
		]);
	}

	// loose check
	if (videoOps.currentBlur.size > acc.props.blur.length) {
		Array.from(videoOps.currentBlur.entries()).forEach(([key, [from, to]]) => {
			const pp = blurGeometryFromKey(key);
			if (
				!acc.props.blur.find(([, to, p]) => to === Infinity && deepEqual(p, pp))
			) {
				acc.props.blur.push([from, to, pp]);
			}
		});
	}
}

function parseVideo(
	entry: FrameProps | TTSEntry,
	key: string,
	acc: EpisodeVideoProps,
	videoOps: VideoOps
) {
	try {
		const {tts, startFrom, endAt, blur, ff, ns, volume} = Array.isArray(entry)
			? ({tts: entry} as FrameProps)
			: entry;

		const frame = parseInt(key, 10);

		parseStartFrom(startFrom, frame, acc);
		parseEndAt(endAt, frame, acc);
		parseTTS(tts, frame, acc);
		parseFF(ff, frame, acc, videoOps);
		parseNS(ns, frame, acc, videoOps);
		parseVolume(volume, frame, acc, videoOps);
		parseBlur(blur, frame, acc, videoOps);
		return acc;
	} catch (e) {
		throw new Error(`failed to parse ${acc.props.src}/${key} due to ${e}`);
	}
}

export function scriptFromYaml(content: string): EpisodeEntryProps[] {
	const parsed = yaml.parse(content) as {
		[file: string]: VideoScript | SlidesScript;
	};

	const videoOps = {
		currentBlur: new Map<string, [number, number]>(),
		currentVolume: false as false | [from: number, v: number],
		currentFF: false as false | number,
		currentNS: false as false | number,
	};

	return Object.entries(parsed).reduce<EpisodeEntryProps[]>(
		(
			acc: EpisodeEntryProps[],
			[file, script]: [string, SlidesScript | VideoScript]
		) => {
			if (/.*\.(mp4|webm|mov)$/.test(file)) {
				const defaultEntry = {
					type: 'video',
					props: {
						src: file,
						commentary: [],
						blur:
							videoOps.currentBlur.size === 0
								? []
								: Array.from(videoOps.currentBlur.keys()).map((key) => {
										const props = blurGeometryFromKey(key);
										return [0, Infinity, props];
									}),
						fastForward:
							videoOps.currentFF === false ? [] : [[0, Infinity, true]],
						forceNormalSpeed:
							videoOps.currentNS === false ? [] : [[0, Infinity, true]],
						volume:
							videoOps.currentVolume === false
								? []
								: [[0, Infinity, videoOps.currentVolume[1]]],
					},
				} as EpisodeVideoProps;

				videoOps.currentFF =
					videoOps.currentFF === false ? videoOps.currentFF : 0;
				videoOps.currentNS =
					videoOps.currentNS === false ? videoOps.currentNS : 0;
				videoOps.currentVolume =
					videoOps.currentVolume === false
						? videoOps.currentVolume
						: [0, videoOps.currentVolume[1]];

				const vScript = script as VideoScript;

				const entry =
					vScript && Object.keys(vScript).length
						? Object.entries(vScript).reduce(
								(acc, [key, entry]) => parseVideo(entry, key, acc, videoOps),
								defaultEntry
							)
						: defaultEntry;

				spreadVideoOps(entry, videoOps);
				acc.push(entry);
			} else {
				const sScript = script as SlidesScript;
				const slideEntry: SingleSlideProps = {
					id: file,
					img: /.*\.(png|jpeg|jpg|svg)$/.test(file) ? file : undefined,
					commentary: sScript.tts,
					text: sScript.text,
					title: sScript.title,
				};

				acc.push({
					type: 'slides',
					props: slideEntry,
				} as EpisodeSlidesProps);
			}
			return acc;
		},
		[] as EpisodeEntryProps[]
	);
}

export function scriptFromFile(path: string) {
	return new Promise<EpisodeEntryProps[]>((resolve, reject) => {
		fs.readFile(`./public/${path}`, {encoding: 'utf-8'}, (e, d) => {
			if (e) {
				reject(e)
			}
			try {
				resolve(scriptFromYaml(d))
			}
			catch(e) {
				reject (e)
			}
		})
	})
}
