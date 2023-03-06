import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia} from '@remotion/renderer';
import path from 'path';
import os from 'os'
import {EpProps} from '../Episodes/Standard/types';

const entry = './src/index.ts';

export async function makeBundle() {
	// You only have to do this once, you can reuse the bundle.
	console.log('Creating a Webpack bundle of the video');
	return bundle(path.resolve(entry), (p) => {
		console.log('bundling', p)
	}, {
		// If you have a Webpack override, make sure to add it here
		webpackOverride: (config) => {
			config.module?.rules?.push({test: /\.yaml$/, use: 'raw-loader'});
			return config;
		},
	});
}

export async function render(
	compositionId: string,
	chunked: {chunk: number; ofChunks: number; chunkDuration: number},
	bundleLocation: string,
	envVariables: Record<string, string>
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
		throw new Error(`No composition with the ID ${compositionId} found.
  Review "${entry}" for the correct ID.`);
	}
	const outputLocation = `out/${compositionId}_${chunked.chunk}.mp4`;
	console.log('Attempting to render:', outputLocation);
	await renderMedia({
		envVariables,
		composition,
		serveUrl: bundleLocation,
		codec: 'h264',
		outputLocation,
		timeoutInMilliseconds: 90000,
		inputProps,
		audioBitrate: '64K',
		concurrency: os.cpus().length,
		onProgress: (d) => {
			console.log(d.renderedFrames, 'of', chunked.chunkDuration)
		}
	});
	console.log('Render done!');
}
