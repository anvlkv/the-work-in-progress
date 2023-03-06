import {useMemo, useLayoutEffect, useEffect} from 'react';
import {useLocalStorage} from 'react-use';
import {delayRender, continueRender} from 'remotion';
import hash from 'object-hash';
import {
	EpisodeEntryProps,
	Meta,
	EpMeta,
	EpisodeVideoProps,
	VideoClipMeta,
} from './types';
import {API_URL} from '../../constants';

async function processEpisodeMeta(script: EpisodeEntryProps[], fps: number) {
	const result: Meta[] = [];
	for (const [at, {type, props}] of script.entries()) {
		if (type === 'video') {
			const handle = delayRender(`video_${at}`);
			const vProps = props as EpisodeVideoProps['props'];
			const response = await fetch(`${API_URL}/analyze/video`, {
				headers: {'Content-Type': 'application/json'},
				method: 'POST',
				body: JSON.stringify({props: {type, props: vProps}, fps}),
			});
			const meta: VideoClipMeta = await response.json();

			result.push(meta);
			continueRender(handle);
		} else {
			const handle = delayRender(`script_${at}`);
			const meta = await fetch(`${API_URL}/analyze/slides`, {
				headers: {'Content-Type': 'application/json'},
				method: 'POST',
				body: JSON.stringify({props, fps}),
			});
			result.push(await meta.json());
			continueRender(handle);
		}
		console.log(at, '/', script.length);
	}
	return result;
}

export function useEpisodeMeta(
	id: string,
	script: EpisodeEntryProps[],
	fps: number
) {
	const epHash = useMemo(() => hash(script), [script]);
	const [scriptMeta, setScriptMeta] = useLocalStorage<Meta[] | null>(
		`meta_${id}_${epHash}`,
		null
	);

	useLayoutEffect(() => {
		if (!scriptMeta) {
			(async () => {
				const label = `episode ${id}`;
				console.time(label);
				setScriptMeta(await processEpisodeMeta(script, fps));
				console.timeEnd(label);
			})();
		}
	}, [script, fps, setScriptMeta, scriptMeta, id]);

	const epMeta: EpMeta = useMemo(
		() =>
			(scriptMeta || []).reduce(
				(acc, meta, at) => {
					if (meta.isSlides) {
						acc.totalSlidesDuration += meta.scriptDuration;
					} else {
						acc.totalVideoDurationInSeconds += meta.durationInSeconds;
						acc.totalVideoDuration += meta.duration;
						acc.totalNormalSpeedFrames += meta.normalSpeedFrames;
						acc.totalFastForwardFrames += meta.fastForwardFrames;
						acc.totalSafeAcceleratedFrames +=
							meta.duration - meta.fastForwardFrames - meta.normalSpeedFrames;

						if (acc.totalSafeAcceleratedFrames) {
							console.log(acc.totalSafeAcceleratedFrames, {meta, script: script[at]})
						}
					}
					return acc;
				},
				{
					totalSlidesDuration: 0,
					totalVideoDurationInSeconds: 0,
					totalNormalSpeedFrames: 0,
					totalFastForwardFrames: 0,
					totalVideoDuration: 0,
					totalSafeAcceleratedFrames: 0,
				}
			) || {
				totalSlidesDuration: 0,
				totalVideoDurationInSeconds: 0,
				totalNormalSpeedFrames: 0,
				totalFastForwardFrames: 0,
				totalVideoDuration: 0,
				totalSafeAcceleratedFrames: 0,
			},
		[scriptMeta]
	);

	useEffect(() => {
		if (id && scriptMeta && script) {
			console.log({id, scriptMeta, script, epMeta});
		}
	}, [id, scriptMeta, script, epMeta]);

	return {scriptMeta: scriptMeta || null, epMeta, epHash};
}
