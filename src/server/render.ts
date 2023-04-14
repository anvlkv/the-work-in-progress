import {bundle} from '@remotion/bundler';
import {getCompositions, makeCancelSignal, renderMedia} from '@remotion/renderer';
import {WebSocket} from 'ws';
import path from 'path';
import os from 'os';
import {EpProps} from '../Episodes/Standard/types';

const entry = './src/index.ts';

export async function makeBundle(ws: WebSocket) {
	// You only have to do this once, you can reuse the bundle.
	console.log('Creating a Webpack bundle of the video');
	return bundle(
		path.resolve(entry),
		(p) => {
			ws.send(`bundling: ${p}%`);
		},
		{
			// If you have a Webpack override, make sure to add it here
			webpackOverride: (config) => {
				config.module?.rules?.push({test: /\.yaml$/, use: 'raw-loader'});
				return config;
			},
			enableCaching: false
		}
	);
}

export async function render(
	compositionId: string,
	chunked: {chunk: number; ofChunks: number; chunkDuration: number},
	bundleLocation: string,
	envVariables: Record<string, string>,
	ws: WebSocket
) {
	// Parametrize the video by passing arbitrary props to your component.
	const inputProps: Partial<EpProps> = {
		durationInFrames: chunked.chunkDuration,
		chunked,
	};
	// Extract all the compositions you have defined in your project
	// from the webpack bundle.
	const comps = await getCompositions(bundleLocation, {
		// You can pass custom input props that you can retrieve using getInputProps()
		// in the composition list. Use this if you want to dynamically set the duration or
		// dimensions of the video.
		envVariables,
		inputProps,
	});
	// Select the composition you want to render.
	const composition = comps.find((c) => c.id === compositionId);
	// Ensure the composition exists
	if (!composition) {
		throw new Error(`
		No composition with the ID ${compositionId} found.
		Review "${entry}" for the correct ID:
		${comps.map(({id}) => id).join('\n')}
	`);
	}
	const outputLocation = `out/${compositionId}_${chunked.chunk}.mp4`;
	const { cancelSignal, cancel } = makeCancelSignal();
	ws.send(`Attempting to render: ${outputLocation}`);
	ws.on('message', (m) => {
		if (m.toString() === 'abort') {
			cancel()
		}
	})
	let start = new Date();
	await renderMedia({
		envVariables,
		composition,
		serveUrl: bundleLocation,
		codec: 'h264',
		chromiumOptions: {gl: "angle"},
		cancelSignal,
		outputLocation,
		timeoutInMilliseconds: 9000000,
		inputProps,
		audioBitrate: '128K',
		concurrency: os.cpus().length - 1,
		dumpBrowserLogs: true,
		onProgress: (d) => {
			const elapsedMs = new Date().valueOf() - start.valueOf();
			const rFPS = Math.floor(elapsedMs/1000);
			start = new Date();
			ws.send(
				`Rendering: ${JSON.stringify(
					{
						...d,
						...chunked,
						renderedFromStart:
							chunked.chunk * chunked.chunkDuration + d.renderedFrames,
						rFPS,
						ETA: new Date(
							elapsedMs *
								((chunked.ofChunks - chunked.chunk) * chunked.chunkDuration -
									d.renderedFrames) + start.valueOf()
						).toUTCString(),
					},
					null,
					4
				)}`
			);
		},
		onBrowserLog: (l) => {
			console.log(l.text);
		},
	});
	console.log('Render done!');
}
