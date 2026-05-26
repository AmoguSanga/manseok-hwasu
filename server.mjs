import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const CACHE_DIR = join(ROOT, '.cache');
const TIDE_CACHE = join(CACHE_DIR, 'tide.json');
const PORT = Number(process.env.PORT || 8080);
const LAT = Number(process.env.TIDE_LAT || 37.488407);
const LNG = Number(process.env.TIDE_LNG || 126.612296);
const REQUESTS_PER_DAY = 6;
const REFRESH_MS = Math.floor(24 * 60 * 60 * 1000 / REQUESTS_PER_DAY);
const STORMGLASS_ENDPOINT = 'https://api.stormglass.io/v2/tide/extremes/point';

loadDotEnv();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.ico': 'image/x-icon'
};

let tideRefreshPromise = null;

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/tide') {
      await sendTide(res);
      return;
    }

    await sendStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'server_error' });
  }
}).listen(PORT, () => {
  console.log(`Manseok-Hwasu server running at http://localhost:${PORT}`);
  warmTideCache();
  setInterval(warmTideCache, REFRESH_MS).unref();
});

async function sendTide(res) {
  const cached = await readCache();
  if (!cached || cacheAge(cached) > REFRESH_MS) {
    warmTideCache();
  }

  sendJson(res, 200, cached || buildFallbackTide('empty_cache'));
}

function warmTideCache() {
  if (tideRefreshPromise) return tideRefreshPromise;

  tideRefreshPromise = refreshTide()
    .catch(error => {
      console.warn('Tide refresh failed:', error.message);
    })
    .finally(() => {
      tideRefreshPromise = null;
    });

  return tideRefreshPromise;
}

async function refreshTide() {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) {
    await writeCache(buildFallbackTide('missing_api_key'));
    return;
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const url = new URL(STORMGLASS_ENDPOINT);
  url.searchParams.set('lat', String(LAT));
  url.searchParams.set('lng', String(LNG));
  url.searchParams.set('start', String(Math.floor(start.getTime() / 1000)));
  url.searchParams.set('end', String(Math.floor(end.getTime() / 1000)));

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Stormglass ${response.status}`);
  }

  const raw = await response.json();
  const payload = normalizeTide(raw);
  await writeCache(payload);
}

function normalizeTide(raw) {
  const extremes = Array.isArray(raw?.data) ? raw.data : [];
  const sorted = extremes
    .map(item => ({
      time: item.time,
      type: normalizeTideType(item.type),
      height: typeof item.height === 'number' ? item.height : null
    }))
    .filter(item => item.time && item.type)
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  const now = Date.now();
  const previousExtreme = [...sorted].reverse().find(item => new Date(item.time).getTime() <= now) || null;
  const nextExtreme = sorted.find(item => new Date(item.time).getTime() > now) || null;
  const nearest = getNearestExtreme(sorted, now);

  return {
    stage: getStage(previousExtreme, nextExtreme, nearest, now),
    previousExtreme,
    nextExtreme,
    extremes: sorted,
    station: raw?.meta?.station || raw?.meta || null,
    updatedAt: new Date().toISOString(),
    source: 'stormglass'
  };
}

function normalizeTideType(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('high')) return 'high';
  if (value.includes('low')) return 'low';
  return '';
}

function getNearestExtreme(extremes, now) {
  return extremes.reduce((nearest, item) => {
    const distance = Math.abs(new Date(item.time).getTime() - now);
    if (!nearest || distance < nearest.distance) return { ...item, distance };
    return nearest;
  }, null);
}

function getStage(previousExtreme, nextExtreme, nearest, now) {
  if (!nearest) return 'unknown';

  const twoHours = 2 * 60 * 60 * 1000;
  if (nearest.distance <= twoHours) return nearest.type;
  if (previousExtreme?.type === 'low' && nextExtreme?.type === 'high') return 'rising';
  if (previousExtreme?.type === 'high' && nextExtreme?.type === 'low') return 'falling';
  return nearest.type || 'unknown';
}

async function readCache() {
  try {
    const text = await readFile(TIDE_CACHE, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeCache(payload) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(TIDE_CACHE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function cacheAge(cache) {
  const updated = new Date(cache?.updatedAt || 0).getTime();
  return Number.isFinite(updated) ? Date.now() - updated : Infinity;
}

function buildFallbackTide(reason) {
  return {
    stage: 'high',
    displayStage: 'high',
    previousExtreme: null,
    nextExtreme: null,
    extremes: [],
    station: null,
    updatedAt: new Date().toISOString(),
    source: reason
  };
}

async function sendStatic(pathname, res) {
  const cleanPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = normalize(resolve(join(ROOT, cleanPath)));

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: 'not_found' });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(`${JSON.stringify(payload)}\n`);
}

function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const [, key, rawValue] = match;
    if (process.env[key]) return;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  });
}
