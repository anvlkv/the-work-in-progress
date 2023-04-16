import {useCallback, useContext, useRef, useState} from 'react';
import {useLayoutEffect} from 'react';
import {useAsync, useLocalStorage} from 'react-use';
import {delayRender, continueRender, useCurrentFrame} from 'remotion';
import {API_URL} from '../../constants';
import {EditorMeta, EpMeta} from '../../server/types';
import {EditorContext} from './Editor';
import {EpComposition, FrameMapping} from './types';

async function fetchComposition(path: string, fps: number, duration: number) {
	const handle = delayRender(`composition_${path}`);
	const response = await fetch(`${API_URL}/comp/${fps}/${duration}/${path}`);
	if (response.status===400) {
		const result: {composition: EpComposition, compositionErrors: string[]} = await response.json();

		continueRender(handle);
		console.log(result)
		return result.composition;
	}
	// else if (response.status!==200) {
	// 	throw new Error(await response.text())
	// }
	// else {

	// }
	const result: EpComposition = await response.json();

	continueRender(handle);
	return result;
}

const cachedMeta = {} as {[key: string]: EpMeta};

async function fetchMeta(path: string, fps: number) {
	if (cachedMeta[`${path}_${fps}`]) {
		return cachedMeta[`${path}_${fps}`];
	}
	const handle = delayRender(`meta_${path}`);
	const response = await fetch(`${API_URL}/meta/${fps}/${path}`);
	if (response.status!==200) {
		throw new Error(await response.text())
	}
	const result: EpMeta = await response.json();
	cachedMeta[`${path}_${fps}`] = result;
	continueRender(handle);
	return result;
}

async function fetchEditorComposition(
	path: string,
	fps: number,
	targetDuration: number
) {
	const handle = delayRender(`composition_${path}`);
	const response = await fetch(
		`${API_URL}/comp/editor/${fps}/${targetDuration}/${path}`
	);
	if (response.status!==200) {
		throw new Error(await response.text())
	}
	const result: {
		composition: EpComposition;
		duration: number;
		cuts: EditorMeta;
	} = await response.json();

	continueRender(handle);
	return result;
}

export function useEpisodeComposition(
	id: string,
	path: string,
	fps: number,
	duration: number
) {
	const [scriptMeta, setScriptMeta] = useLocalStorage<
		EpComposition | undefined
	>(`meta_${id}_${path}`, undefined);

	const editorContext = useContext(EditorContext);

	useLayoutEffect(() => {
		if (!scriptMeta && !editorContext) {
			(async () => {
				const label = `episode ${id}`;
				console.time(label);
				setScriptMeta(await fetchComposition(path, fps, duration));
				console.timeEnd(label);
			})();
		}
	}, [duration, fps, id, path, scriptMeta, setScriptMeta, editorContext]);

	return editorContext || scriptMeta;
}

export function useEditorComposition(
	id: string,
	path: string,
	fps: number,
	targetDuration: number
) {
	const [scriptMeta, setScriptMeta] = useState<EpComposition | undefined>(
		undefined
	);

	const [scriptDuration, setScriptDuration] = useState<number | undefined>(
		undefined
	);

	const [cuts, setCuts] = useState<EditorMeta | undefined>(undefined);

	useLayoutEffect(() => {
		if (!scriptMeta) {
			(async () => {
				const label = `episode editor ${id}`;
				console.time(label);
				const {composition, duration, cuts} = await fetchEditorComposition(
					path,
					fps,
					targetDuration
				);
				console.log(composition);
				setScriptMeta(composition);
				setScriptDuration(duration);
				setCuts(cuts);
				console.timeEnd(label);
			})();
		}
	}, [
		fps,
		id,
		path,
		scriptMeta,
		setScriptDuration,
		setScriptMeta,
		targetDuration,
	]);

	return {
		composition: scriptMeta,
		duration: scriptMeta ? scriptDuration : 0,
		cuts,
	};
}

export function useEpisodeMeta(path: string, fps: number) {
	return useAsync(() => fetchMeta(path, fps), [path, fps]);
}

export function useFrameMapping<T>(mapping: FrameMapping<T>[]) {
	const frame = useCurrentFrame();
	const [last, setLast] = useState([0, 0, null] as FrameMapping<T | null>);

	useLayoutEffect(() => {
		setLast((val) => {
			const [from, to] = val;
			if (from <= frame && frame <= to) {
				return val;
			}
			const next = mapping.find(
				([from, to]) => from <= frame && frame <= to
			) || [0, 0, null];
			return next;
		});
	}, [frame, mapping]);
	return last;
}

export function useRenderWs(id: string) {
	const socket = useRef<WebSocket | undefined>(undefined);
	// console.log({id, from})
	const [progress, setProgress] = useState('');
	const renderCb = useCallback((from?: number) => {
		socket.current = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/render`, [
			'POST',
		]);
		socket.current.onopen = (e) => {
			setProgress('calling server...');
			socket.current?.send(JSON.stringify({id, from}));
		};
		socket.current.onmessage = (e) => {
			setProgress(e.data);
		};
		socket.current.onclose = (e) => {
			setProgress(
				(v) => `${v}
closed: ${e.code}`
			);
		};
	}, [id]);

	const cancelCb = useCallback(() => {
		socket.current?.send('abort')
	}, [])

	return {progress, renderCb, cancelCb};
}
