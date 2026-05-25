const CACHE_KEY = 'manseok-hwasu:tide:v1';
const LOCK_KEY = 'manseok-hwasu:tide-refresh-lock:v1';
const REQUESTS_PER_DAY = 6;
const REFRESH_SECONDS = Math.floor(24 * 60 * 60 / REQUESTS_PER_DAY);
const LOCK_SECONDS = 90;
const DEFAULT_LAT = 37.488407;
const DEFAULT_LNG = 126.612296;
const STORMGLASS_ENDPOINT = 'https://api.stormglass.io/v2/tide/extremes/point';

export async function onRequestGet(context) {
  const { env } = context;
  const isProduction = isProductionDeployment(context);

  if (!isProduction) {
    return json(buildPendingHighTide('preview_pending'));
  }

  const cached = await readCache(env);

  if (cached && cacheAgeSeconds(cached) < REFRESH_SECONDS) {
    return json({ ...cached, cacheStatus: 'fresh' });
  }

  if (cached) {
    context.waitUntil(refreshIfUnlocked(env));
    return json({ ...cached, cacheStatus: 'stale-refreshing' });
  }

  const initial = await refreshIfUnlocked(env);
  return json(initial || buildFallbackTide(env?.TIDE_CACHE ? 'empty_cache' : 'missing_kv_binding'));
}

async function refreshIfUnlocked(env) {
  if (!env?.TIDE_CACHE || !env?.STORMGLASS_API_KEY) {
    const fallback = buildFallbackTide(!env?.TIDE_CACHE ? 'missing_kv_binding' : 'missing_api_key');
    await writeCache(env, fallback);
    return fallback;
  }

  const locked = await env.TIDE_CACHE.get(LOCK_KEY);
  if (locked) return readCache(env);

  await env.TIDE_CACHE.put(LOCK_KEY, '1', { expirationTtl: LOCK_SECONDS });

  try {
    const payload = await fetchStormglass(env);
    await writeCache(env, payload);
    return payload;
  } catch (error) {
    const cached = await readCache(env);
    if (cached) return { ...cached, cacheStatus: 'refresh_failed' };

    const fallback = buildFallbackTide('stormglass_error');
    fallback.error = error.message;
    await writeCache(env, fallback);
    return fallback;
  }
}

async function fetchStormglass(env) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const url = new URL(STORMGLASS_ENDPOINT);
  url.searchParams.set('lat', String(Number(env.TIDE_LAT) || DEFAULT_LAT));
  url.searchParams.set('lng', String(Number(env.TIDE_LNG) || DEFAULT_LNG));
  url.searchParams.set('start', String(Math.floor(start.getTime() / 1000)));
  url.searchParams.set('end', String(Math.floor(end.getTime() / 1000)));

  const response = await fetch(url, {
    headers: {
      Authorization: env.STORMGLASS_API_KEY,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Stormglass ${response.status}`);
  }

  return normalizeTide(await response.json());
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
    stage: getStage(previousExtreme, nextExtreme, nearest),
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

function getStage(previousExtreme, nextExtreme, nearest) {
  if (!nearest) return 'unknown';

  const twoHours = 2 * 60 * 60 * 1000;
  if (nearest.distance <= twoHours) return nearest.type;
  if (previousExtreme?.type === 'low' && nextExtreme?.type === 'high') return 'rising';
  if (previousExtreme?.type === 'high' && nextExtreme?.type === 'low') return 'falling';
  return nearest.type || 'unknown';
}

async function readCache(env) {
  if (!env?.TIDE_CACHE) return null;

  try {
    const text = await env.TIDE_CACHE.get(CACHE_KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function writeCache(env, payload) {
  if (!env?.TIDE_CACHE) return;
  await env.TIDE_CACHE.put(CACHE_KEY, JSON.stringify(payload), {
    expirationTtl: REFRESH_SECONDS * 3
  });
}

function cacheAgeSeconds(cache) {
  const updated = new Date(cache?.updatedAt || 0).getTime();
  return Number.isFinite(updated) ? Math.max(0, Math.floor((Date.now() - updated) / 1000)) : Infinity;
}

function buildFallbackTide(reason) {
  return {
    stage: 'high',
    displayStage: 'unknown',
    previousExtreme: null,
    nextExtreme: null,
    extremes: [],
    station: null,
    updatedAt: new Date().toISOString(),
    source: reason
  };
}

function buildPendingHighTide(reason) {
  return {
    stage: 'high',
    displayStage: 'unknown',
    previousExtreme: null,
    nextExtreme: null,
    extremes: [],
    station: null,
    updatedAt: new Date().toISOString(),
    source: reason
  };
}

function isProductionDeployment(context) {
  const { env, request } = context;

  if (String(env?.TIDE_API_ENABLED || '').toLowerCase() === 'true') return true;
  if (String(env?.TIDE_API_ENABLED || '').toLowerCase() === 'false') return false;

  const branch = env?.CF_PAGES_BRANCH || env?.PAGES_BRANCH || '';
  const productionBranch = env?.PRODUCTION_BRANCH || env?.CF_PAGES_PRODUCTION_BRANCH || 'main';
  if (branch) return branch === productionBranch;

  const hostname = new URL(request.url).hostname;
  const pagesProject = env?.CF_PAGES_PROJECT || env?.PAGES_PROJECT || '';
  if (pagesProject && hostname === `${pagesProject}.pages.dev`) return true;

  return false;
}

function json(payload, status = 200) {
  return new Response(`${JSON.stringify(payload)}\n`, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
