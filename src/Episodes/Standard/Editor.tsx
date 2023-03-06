import {useCallback, useMemo} from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {API_URL, SPLASH_DURATION_S, VIDEO_CONFIG} from '../../constants';
import {useScriptFromYaml} from './scriptFromYaml';
import {useEpisodeMeta} from './useEpisodeMeta';



export const Editor: React.FC<{
	component: React.ComponentType<{editorMode?: boolean}>;
	id: string;
}> = ({component: Component, id}) => {
	const scriptContent = useMemo(
		() => require('../' + id + '.yaml').default,
		[id]
	);
	const script = useScriptFromYaml(scriptContent);
	const {epMeta} = useEpisodeMeta(`${id}_editor`, script, VIDEO_CONFIG.fps);
	const rawDuration = Math.round(
		(SPLASH_DURATION_S * 2 + epMeta.totalVideoDurationInSeconds) *
			VIDEO_CONFIG.fps +
			epMeta.totalSlidesDuration
	);

	const startRender = useCallback(() => {
		fetch(`${API_URL}/render/${id}`, {method: 'POST'}).then(() => {
			console.log('done')
		})
	}, [id])
	const clearCache = useCallback(() => {
		fetch(`${API_URL}/render/cache/clear`, {method: 'POST'}).then(() => {
			console.log('done')
			localStorage.clear()
		})
	}, [])

	

	const RenderButton = useCallback(() => {
		return <AbsoluteFill>
			<Component/>
			<AbsoluteFill style={{width: 'auto', maxWidth: '100%', height: 'auto', top: '5%', left: '5%'}}>
				<button type='button' style={{width: 'max-content', fontSize: '3em'}} onClick={startRender}>render {id}</button>
				<button type='button' style={{width: 'max-content', fontSize: '3em'}} onClick={clearCache}>clear caches</button>
			</AbsoluteFill>
		</AbsoluteFill>
	}, [Component, id, startRender, clearCache])

	return (
		<Composition
			id={`${id}Editor`}
			component={RenderButton}
			{...VIDEO_CONFIG}
			durationInFrames={rawDuration}
			defaultProps={{editorMode: true}}
		/>
	);
};
