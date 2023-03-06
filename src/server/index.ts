import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Koa from 'koa';
import Router from '@koa/router';
import {koaBody} from 'koa-body';
import cors from '@koa/cors';
import logger from 'koa-logger';
import objectHash from 'object-hash';
import {EP_DURATION_FRAMES} from '../Episodes/constants';
import {EpisodeVideoProps, SingleSlideProps} from '../Episodes/Standard/types';
import {processSlidesMeta, processVideoClipMeta} from './meta';
import {makeBundle, render} from './render';

const cacheFilePath = path.join(process.cwd(), './cache/metaCache.json');
let cache: {[key: string]: any} = {};

const file = dotenv.config();
const env = file.parsed || {};

const app = new Koa();
const router = new Router();

router.post('analyze video', '/analyze/video', koaBody(), async (ctx, next) => {
	const {props, fps} = ctx.request.body as {
		props: EpisodeVideoProps;
		fps: number;
	};
	const id = objectHash({props, fps, video: true});
	let meta;
	if (cache[id]) {
		meta = cache[id];
	} else {
		meta = await processVideoClipMeta(props.props, fps);
		cache[id] = meta;
	}
	ctx.response.headers['Content-Type'] = 'application/json';
	ctx.body = JSON.stringify(meta);
	await next();
	try {
		fs.writeFileSync(cacheFilePath, JSON.stringify(cache));
	} catch {
		console.log('failed to write cache');
	}
});

router.post(
	'analyze slides',
	'/analyze/slides',
	koaBody(),
	async (ctx, next) => {
		const {props, fps} = ctx.request.body as {
			props: SingleSlideProps[];
			fps: number;
		};
		const id = objectHash({props, fps, slides: true});
		let meta;
		if (cache[id]) {
			meta = cache[id];
		} else {
			meta = await processSlidesMeta(props, fps);
			cache[id] = meta;
		}
		ctx.response.headers.ContentType = 'application/json';
		ctx.body = JSON.stringify(meta);
		await next();
		try {
			fs.writeFileSync(cacheFilePath, JSON.stringify(cache));
		} catch {
			console.log('failed to write cache');
		}
	}
);

router.post('render video', '/render/:id', async (ctx, next) => {
	const {id} = ctx.params;
	const chunkDuration = parseInt(env.CHUNK_SIZE_FRAMES, 10);
	const ofChunks = EP_DURATION_FRAMES / chunkDuration;
	console.log(chunkDuration, ofChunks);
	const bundleLocation = await makeBundle();
	for (let chunk = 0; chunk < ofChunks; chunk++) {
		await render(id, {chunk, ofChunks, chunkDuration}, bundleLocation, env);
	}
	console.log('all chunks');
});

router.post('clear cache', '/cache/clear', (ctx, ) => {
	fs.writeFileSync(cacheFilePath, JSON.stringify({}));
	ctx.body='ok'
})

app.use(logger());
app.use(cors());
app.use(router.routes());

const server = app.listen(env.REMOTION_API_PORT);

server.addListener('listening', () => {
	console.log('app listening', env.REMOTION_API_PORT);
	fs.readFile(cacheFilePath, {encoding: 'utf-8'}, (err, data) => {
		try {
			cache = JSON.parse(data);
		} catch {
			console.log('cant read cache');
		}
	});
});
