import React, {useState} from 'react';
import {useCallback} from 'react';
import {useAsync} from 'react-use';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import {API_URL, SPLASH_DURATION_S, VIDEO_CONFIG} from '../../constants';
import {Episode} from './Episode';
import {useEditorComposition, useEpisodeMeta, useRenderWs} from './hooks';
import {EpComposition} from './types';

export const EditorContext = React.createContext<undefined | EpComposition>(
	undefined
);

const RenderButton = React.memo<{id: string}>(({id}) => {
	const [from, setFrom] = useState(0);
	const {progress, renderCb, cancelCb} = useRenderWs(id);

	const clearCache = useCallback(async () => {
		await fetch(`${API_URL}/cache/clear`, {method: 'POST'});
		localStorage.clear();
		window.location.reload();
	}, []);

	return (
		<AbsoluteFill
			style={{
				width: 'min-content',
				maxWidth: '100%',
				height: 'min-content',
				background: 'white',
				fontSize: '3em',
				fontFamily: 'monospace',
				top: '5%',
				left: '5%',
			}}
		>
			<div style={{display: 'flex'}}>
				{progress ? (
					<button
						type="button"
						style={{width: 'max-content', fontSize: '1em'}}
						onClick={cancelCb}
					>
						cancel
					</button>
				) : (
					<>
						<button
							type="button"
							style={{width: 'max-content', fontSize: '1em'}}
							onClick={(e) => renderCb(from)}
						>
							Render {id}
						</button>
						<label>
							From chunk
							<input
								type="number"
								style={{fontSize: '1em'}}
								value={from}
								onChange={(e) => setFrom(parseInt(e.target.value, 10))}
							/>
						</label>
					</>
				)}
			</div>
			<p
				style={{width: 'max-content', maxWidth: '90%', whiteSpace: 'pre-line'}}
			>
				{progress}
			</p>
			<button
				type="button"
				style={{width: 'max-content', fontSize: '1em'}}
				onClick={clearCache}
			>
				Clear caches
			</button>
		</AbsoluteFill>
	);
});

export const Editor: React.FC<{
	id: string;
	path: string;
	targetContentDuration: number;
}> = ({id, path, targetContentDuration: targetDuration}) => {
	const {duration, composition, cuts} =
		useEditorComposition(id, path, VIDEO_CONFIG.fps, targetDuration) || {};

	const {value: meta} = useEpisodeMeta(path, VIDEO_CONFIG.fps);

	const DecoratedComponent = useCallback(() => {
		return (
			<AbsoluteFill>
				<Episode editorMode path={path} id={`${id}_editor`} />
				{cuts && (
					<>
						{meta?.totalSlidesDuration && (
							<Sequence
								durationInFrames={meta.totalSlidesDuration}
								name={`Slides duration: ${meta.totalSlidesDuration}`}
							>
								<></>
							</Sequence>
						)}
						{meta?.totalFastForwardFrames && (
							<Sequence
								from={(duration || 0) - meta.totalFastForwardFrames}
								durationInFrames={meta.totalFastForwardFrames}
								name={`Fast Forward Frames duration: ${meta.totalFastForwardFrames}`}
							>
								<></>
							</Sequence>
						)}
						{cuts.safeSpeedCut[0] > 0 && (
							<Sequence
								durationInFrames={cuts.safeSpeedCut[0]}
								name={`Safe speed: ${cuts.safeSpeedCut[1]}`}
							>
								<></>
							</Sequence>
						)}
						{cuts.compositeCut[0] > 0 && (
							<Sequence
								durationInFrames={cuts.compositeCut[0]}
								name={`Composite speed: ${cuts.compositeCut[1]}`}
							>
								<></>
							</Sequence>
						)}
						{cuts.normalSpeedCut[0] > 0 && (
							<Sequence
								durationInFrames={cuts.normalSpeedCut[0]}
								name={`Normal speed: ${cuts.normalSpeedCut[1]}`}
							>
								<></>
							</Sequence>
						)}
					</>
				)}
				<RenderButton id={id} />
			</AbsoluteFill>
		);
	}, [
		path,
		id,
		cuts,
		meta?.totalSlidesDuration,
		meta?.totalFastForwardFrames,
		duration,
	]);

	return (
		<>
			<EditorContext.Provider value={composition}>
				{duration && (
					<Composition
						id={`${id}Editor`}
						component={DecoratedComponent}
						{...VIDEO_CONFIG}
						durationInFrames={
							duration + SPLASH_DURATION_S * VIDEO_CONFIG.fps * 2
						}
					/>
				)}
			</EditorContext.Provider>
		</>
	);
};
