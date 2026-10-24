// Hand tracking is served from the site itself rather than jsDelivr and Google's model
// bucket: two hosts fewer to be slow or blocked, and no third party learns who turned the
// camera on. The runtime comes from the pinned npm package; the two models are fetched
// once, checked against the hashes below, and cached in node_modules/.cache.
//
// The big files are gzipped here, so the download is the compressed size wherever the
// site is hosted (and the hand model shrinks by a quarter, 7.8 to 5.8 MB, which no host
// does for a .task file). The page unzips them with DecompressionStream; see
// trackerFiles() in src/tracking/camera.ts.
//
// Writes to dist/mediapipe/ on build, and serves the same files at /mediapipe/ in dev.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

const root = fileURLToPath(new URL('../../', import.meta.url));
const runtime = `${root}node_modules/@mediapipe/tasks-vision/`;
const cache = `${root}node_modules/.cache/mediapipe/`;
const MODELS = {
  'hand_landmarker.task': {
    url: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    sha256: 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1',
  },
  'blaze_face_short_range.tflite': {
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    sha256: 'b4578f35940bf5a1a655214a1cce5cab13eba73c1297cd78e1a04c2380b0152f',
  },
};

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
async function model(name: keyof typeof MODELS) {
  const { url, sha256: want } = MODELS[name];
  const cached = await readFile(cache + name).catch(() => null);
  if (cached && sha256(cached) === want) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MediaPipe model ${name}: ${res.status} from ${url}`);
  const got = new Uint8Array(await res.arrayBuffer());
  if (sha256(got) !== want) throw new Error(`MediaPipe model ${name} changed upstream (sha256 ${sha256(got)}). Check it, then update the hash in scripts/mediapipe/plugin.ts.`);
  await mkdir(cache, { recursive: true });
  await writeFile(cache + name, got);
  return got;
}

// The CDN fallback in src/config.ts must load the same version and models, so the two
// can't drift apart.
async function checkConfig() {
  const pkg = JSON.parse(await readFile(`${runtime}package.json`, 'utf8')).version;
  const config = await readFile(`${root}src/config.ts`, 'utf8');
  const ver = config.match(/MP_VER = '([^']+)'/)?.[1];
  if (pkg !== ver) throw new Error(`@mediapipe/tasks-vision is ${pkg} but MP_VER in src/config.ts is ${ver}; make them match.`);
  for (const [name, { url }] of Object.entries(MODELS)) if (!config.includes(url)) throw new Error(`src/config.ts doesn't load ${name} from ${url}; make it match scripts/mediapipe/plugin.ts.`);
}

// Only the SIMD build is served: every browser with DecompressionStream runs SIMD, and
// the few without either get the CDN.
let files: Promise<Record<string, Uint8Array>> | null = null;
// Gzipping 19 MB takes seconds, so the result is cached by what went in.
async function gz(b: Uint8Array) {
  const at = `${cache}${sha256(b).slice(0, 24)}.gz`;
  const cached = await readFile(at).catch(() => null);
  if (cached) return cached;
  const out = gzipSync(b, { level: 9 });
  await mkdir(cache, { recursive: true });
  await writeFile(at, out);
  return out;
}
const build = () => (files ??= (async () => {
  await checkConfig();
  const [loader, wasm, hand, face, license] = await Promise.all([
    readFile(`${runtime}wasm/vision_wasm_internal.js`),
    readFile(`${runtime}wasm/vision_wasm_internal.wasm`),
    model('hand_landmarker.task'),
    model('blaze_face_short_range.tflite'),
    readFile(fileURLToPath(new URL('./LICENSE', import.meta.url))),
  ]);
  return {
    'vision_wasm_internal.js': loader,
    'vision_wasm_internal.wasm.gz': await gz(wasm),
    'hand_landmarker.task.gz': await gz(hand),
    'blaze_face_short_range.tflite.gz': await gz(face),
    'LICENSE.txt': license,
  };
})());

export function mediapipe(): Plugin {
  return {
    name: 'cave-mediapipe',
    configureServer(server) {
      server.middlewares.use('/mediapipe/', async (req, res, next) => {
        const name = decodeURIComponent((req.url || '').split('?')[0].replace(/^\//, ''));
        const all = await build().catch((e) => { next(e); return null; });
        if (!all) return;
        if (!(name in all)) return next();
        res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.txt') ? 'text/plain' : 'application/octet-stream');
        res.end(all[name]);
      });
    },
    async generateBundle() {
      for (const [name, source] of Object.entries(await build())) this.emitFile({ type: 'asset', fileName: `mediapipe/${name}`, source });
    },
  };
}
