import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import logger from 'koa-logger';
import makeWs from 'koa-websocket';
import route from 'koa-route';
import {computeEpisodeMeta, ffprobeCache} from './meta';
import {scriptFromFile} from './scriptFromYaml';
import {composeEpisode, suggestCuts, validateComposition} from './composition';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import {makeBundle, render} from './render';
const cacheFilePath = path.join(process.cwd(), './cache/metaCache.json');
const file = dotenv.config();
const env = file.parsed || {};

const app = makeWs(new Koa());
const router = new Router();

app.ws.use(
	route.all('/render', (ctx, next) => {
		ctx.websocket.on('message', async (message) => {
			const chunkDuration = parseInt(env.CHUNK_SIZE_FRAMES, 10);
			const ofChunks = EP_DURATION_FRAMES / chunkDuration;
			console.log(chunkDuration, ofChunks);
			const bundleLocation = await makeBundle(ctx.websocket);
			const {id, from} = JSON.parse(message.toString('utf8')) as {
				id: string;
				from?: number;
			};
			console.log(id, from)
			try {
				for (let chunk = from || 0; chunk < ofChunks; chunk++) {
					await render(
						id,
						{chunk: chunk > ofChunks ? ofChunks : chunk, ofChunks, chunkDuration},
						bundleLocation,
						env,
						ctx.websocket
					);
				}
			} catch (e) {
				ctx.websocket.send(`failed to render ${id}: ${e}`);
				ctx.websocket.close(1002);
			}
		});
	})
);

router.get('episode script', '/script/:path*', async (ctx) => {
	ctx.body = await scriptFromFile(ctx.params.path);
});

router.get('episode meta', '/meta/:fps/:path*', async (ctx) => {
	const fps = parseFloat(ctx.params.fps);
	const script = await scriptFromFile(ctx.params.path);
	const meta = await computeEpisodeMeta(script, fps);
	ctx.body = meta;
});

router.get(
	'episode editor composition',
	'/comp/editor/:fps/:duration/:path*',
	async (ctx) => {
		const fps = parseFloat(ctx.params.fps);
		const script = await scriptFromFile(ctx.params.path);
		const meta = await computeEpisodeMeta(script, fps);
		const duration = meta.totalVideoDuration + meta.totalSlidesDuration;
		const targetDuration = parseInt(ctx.params.duration, 10);
		const composition = composeEpisode(script, meta, duration);
		const cuts = suggestCuts(meta, targetDuration);
		ctx.body = {composition, duration, cuts};
	}
);

router.get(
	'episode composition',
	'/comp/:fps/:duration/:path*',
	async (ctx) => {
		const fps = parseFloat(ctx.params.fps);
		const duration = parseInt(ctx.params.duration, 10);
		console.time(`scriptFromFile ${ctx.params.path}`);
		const script = await scriptFromFile(ctx.params.path);
		console.timeEnd(`scriptFromFile ${ctx.params.path}`);
		console.time(`computeEpisodeMeta ${ctx.params.path}`);
		const meta = await computeEpisodeMeta(script, fps);
		console.timeEnd(`computeEpisodeMeta ${ctx.params.path}`);
		console.time(`composeEpisode ${ctx.params.path}`);
		const composition = composeEpisode(script, meta, duration);
		console.timeEnd(`composeEpisode ${ctx.params.path}`);
		console.time(`validateComposition ${ctx.params.path}`);
		const compositionErrors = validateComposition(composition);
		console.timeEnd(`validateComposition ${ctx.params.path}`);
		if (compositionErrors) {
			ctx.status = 400;
			ctx.body = {
				composition,
				compositionErrors: compositionErrors.map((e) => e.message),
			};
		} else {
			ctx.body = composition;
		}
	}
);
router.post('clear cache', '/cache/clear', (ctx) => {
	fs.writeFileSync(cacheFilePath, JSON.stringify({}));
	Object.keys(ffprobeCache).forEach((k) => {
		delete ffprobeCache[k];
	});
	ctx.body = 'ok';
});
app.use(logger());
app.use(cors());
app.use(router.routes());

const server = app.listen(env.REMOTION_API_PORT);

function loadCache() {
	fs.readFile(cacheFilePath, {encoding: 'utf-8'}, (err, data) => {
		try {
			const cache = JSON.parse(data);
			Object.entries(cache).forEach(([k, v]) => {
				ffprobeCache[k] = v as any;
			});
			console.log('restored cache');
		} catch {
			console.log('cant read cache');
		}
	});
}

server.addListener('listening', () => {
	console.log('app listening', env.REMOTION_API_PORT);
	loadCache();
});

server.addListener('request', (ctx) => {
	ctx.on('end', () => {
		fs.writeFile(cacheFilePath, JSON.stringify(ffprobeCache), (e) => {
			if (e) {
				console.error(e.message);
			} else {
				console.log('wrote meta cache');
			}
		});
	});
});
