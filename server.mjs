import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const CACHE_DIR = join(ROOT, '.cache');
const TIDE_CACHE = join(CACHE_DIR, 'tide.json');
const COMMUNITY_COMMENTS = join(CACHE_DIR, 'community-comments.json');
const COMMUNITY_POSTS = join(CACHE_DIR, 'community-posts.json');
const COMMUNITY_STATS = join(CACHE_DIR, 'community-stats.json');
const PORT = Number(process.env.PORT || 8080);
const LAT = Number(process.env.TIDE_LAT || 37.488407);
const LNG = Number(process.env.TIDE_LNG || 126.612296);
const REQUESTS_PER_DAY = 6;
const REFRESH_MS = Math.floor(24 * 60 * 60 * 1000 / REQUESTS_PER_DAY);
const STORMGLASS_ENDPOINT = 'https://api.stormglass.io/v2/tide/extremes/point';
const DEFAULT_ADMIN_PASSWORD = '9919BOMa1!';
const COMMUNITY_MAX_COMMENTS = 240;
const COMMUNITY_MAX_POSTS = 140;
const COMMUNITY_MAX_REPLIES = 160;
const COMMUNITY_MAX_VISITORS = 2500;
const ADMIN_TOKENS = new Map();
const PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'dick',
  'cunt', 'slut', 'whore', 'crap', 'piss'
];

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
    if (url.pathname === '/api/community') {
      await sendCommunity(req, res, url);
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

async function sendCommunity(req, res, url) {
  const action = url.searchParams.get('action') || 'comments';

  try {
    if (req.method === 'GET' && action === 'comments') {
      const channel = cleanChannel(url.searchParams.get('channel'));
      const comments = await readJsonFile(COMMUNITY_COMMENTS, []);
      sendJson(res, 200, { comments: comments.filter(comment => comment.channel === channel).slice(0, 80) });
      return;
    }

    if (req.method === 'GET' && action === 'posts') {
      const posts = await readJsonFile(COMMUNITY_POSTS, []);
      sendJson(res, 200, {
        posts: posts.map(post => ({
          ...post,
          replies: Array.isArray(post.replies) ? post.replies.slice(0, 3) : [],
          replyCount: Array.isArray(post.replies) ? post.replies.length : 0
        })).slice(0, COMMUNITY_MAX_POSTS)
      });
      return;
    }

    if (req.method === 'GET' && action === 'post') {
      const id = cleanText(url.searchParams.get('id'), 80);
      const posts = await readJsonFile(COMMUNITY_POSTS, []);
      const post = posts.find(item => item.id === id);
      sendJson(res, post ? 200 : 404, post ? { post } : { error: 'not_found' });
      return;
    }

    if (req.method === 'GET' && action === 'admin-stats') {
      requireLocalAdmin(req);
      sendJson(res, 200, {
        stats: await readJsonFile(COMMUNITY_STATS, emptyCommunityStats()),
        comments: await readJsonFile(COMMUNITY_COMMENTS, []),
        posts: await readJsonFile(COMMUNITY_POSTS, [])
      });
      return;
    }

    if (req.method === 'POST') {
      const body = await readRequestJson(req);
      if (body.action === 'admin-login') {
        await localAdminLogin(res, body);
        return;
      }
      if (body.action === 'post') {
        await saveLocalPost(res, body);
        return;
      }
      if (body.action === 'reply') {
        await saveLocalReply(res, body);
        return;
      }
      if (body.action === 'comment') {
        await saveLocalComment(res, body);
        return;
      }
      if (body.action === 'track') {
        await incrementLocalStats(body);
        sendJson(res, 200, { ok: true });
        return;
      }
    }

    if (req.method === 'DELETE' && action === 'comment') {
      requireLocalAdmin(req);
      const id = cleanText(url.searchParams.get('id'), 80);
      const comments = await readJsonFile(COMMUNITY_COMMENTS, []);
      const next = comments.filter(comment => comment.id !== id);
      await writeJsonFile(COMMUNITY_COMMENTS, next);
      sendJson(res, 200, { ok: true, removed: comments.length - next.length });
      return;
    }

    if (req.method === 'DELETE' && action === 'post') {
      requireLocalAdmin(req);
      const id = cleanText(url.searchParams.get('id'), 80);
      const posts = await readJsonFile(COMMUNITY_POSTS, []);
      const next = posts.filter(post => post.id !== id);
      await writeJsonFile(COMMUNITY_POSTS, next);
      sendJson(res, 200, { ok: true, removed: posts.length - next.length });
      return;
    }

    if (req.method === 'DELETE' && action === 'reply') {
      requireLocalAdmin(req);
      const postId = cleanText(url.searchParams.get('postId'), 80);
      const id = cleanText(url.searchParams.get('id'), 80);
      const posts = await readJsonFile(COMMUNITY_POSTS, []);
      const post = posts.find(item => item.id === postId);
      if (!post) {
        sendJson(res, 200, { ok: true, removed: 0 });
        return;
      }
      const before = Array.isArray(post.replies) ? post.replies.length : 0;
      post.replies = (post.replies || []).filter(reply => reply.id !== id);
      post.updatedAt = new Date().toISOString();
      await writeJsonFile(COMMUNITY_POSTS, posts);
      sendJson(res, 200, { ok: true, removed: before - post.replies.length });
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.publicMessage || 'server_error' });
  }
}

async function localAdminLogin(res, body) {
  const expected = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if (!expected) {
    sendJson(res, 403, { ok: false, error: 'admin_disabled' });
    return;
  }

  const name = cleanText(body.name, 40).toLowerCase();
  if (name !== 'sangaisadmin' || String(body.password || '') !== expected) {
    sendJson(res, 403, { ok: false, error: 'invalid_admin' });
    return;
  }

  const token = randomUUID();
  ADMIN_TOKENS.set(token, Date.now() + (2 * 60 * 60 * 1000));
  await incrementLocalStats({ event: 'admin_login' });
  sendJson(res, 200, { ok: true, token, expiresIn: 7200 });
}

function requireLocalAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const expires = ADMIN_TOKENS.get(token);
  if (!expires || expires <= Date.now()) {
    if (token) ADMIN_TOKENS.delete(token);
    throw httpError(401, 'admin_required');
  }
}

async function saveLocalComment(res, body) {
  const text = filterProfanity(cleanText(body.text, 360));
  if (!text) {
    sendJson(res, 400, { error: 'empty_comment' });
    return;
  }

  const comment = {
    id: randomUUID(),
    channel: cleanChannel(body.channel),
    eventId: cleanText(body.eventId, 80),
    text,
    profile: sanitizeProfile(body.profile),
    createdAt: new Date().toISOString()
  };

  const comments = await readJsonFile(COMMUNITY_COMMENTS, []);
  comments.unshift(comment);
  await writeJsonFile(COMMUNITY_COMMENTS, comments.slice(0, COMMUNITY_MAX_COMMENTS));
  await incrementLocalStats({ event: 'comment_posted', channel: comment.channel });
  sendJson(res, 200, { ok: true, comment });
}

async function saveLocalPost(res, body) {
  const title = filterProfanity(cleanText(body.title, 100));
  const text = filterProfanity(cleanText(body.text, 800));
  if (!title || !text) {
    sendJson(res, 400, { error: 'empty_post' });
    return;
  }

  const now = new Date().toISOString();
  const post = {
    id: randomUUID(),
    title,
    text,
    profile: sanitizeProfile(body.profile),
    replies: [],
    createdAt: now,
    updatedAt: now
  };

  const posts = await readJsonFile(COMMUNITY_POSTS, []);
  posts.unshift(post);
  await writeJsonFile(COMMUNITY_POSTS, posts.slice(0, COMMUNITY_MAX_POSTS));
  await incrementLocalStats({ event: 'forum_post_created' });
  sendJson(res, 200, { ok: true, post });
}

async function saveLocalReply(res, body) {
  const postId = cleanText(body.postId, 80);
  const text = filterProfanity(cleanText(body.text, 500));
  if (!postId || !text) {
    sendJson(res, 400, { error: 'empty_reply' });
    return;
  }

  const posts = await readJsonFile(COMMUNITY_POSTS, []);
  const post = posts.find(item => item.id === postId);
  if (!post) {
    sendJson(res, 404, { error: 'post_not_found' });
    return;
  }

  const reply = {
    id: randomUUID(),
    text,
    profile: sanitizeProfile(body.profile),
    createdAt: new Date().toISOString()
  };

  post.replies = [reply, ...(post.replies || [])].slice(0, COMMUNITY_MAX_REPLIES);
  post.updatedAt = new Date().toISOString();
  await writeJsonFile(COMMUNITY_POSTS, posts);
  await incrementLocalStats({ event: 'forum_reply_created' });
  sendJson(res, 200, { ok: true, reply, post });
}

async function incrementLocalStats(body) {
  const stats = await readJsonFile(COMMUNITY_STATS, emptyCommunityStats());
  const now = new Date().toISOString();
  const event = cleanText(body.event, 60) || 'unknown';
  const visitorId = cleanText(body.visitorId, 80);
  const section = cleanText(body.section, 80);
  const durationMs = Math.max(0, Math.min(Number(body.durationMs) || 0, 30 * 60 * 1000));

  stats.updatedAt = now;
  stats.events[event] = (stats.events[event] || 0) + 1;

  if (visitorId) {
    if (!stats.visitors[visitorId]) {
      stats.visitors[visitorId] = { firstSeen: now, lastSeen: now, visits: 0 };
      stats.uniqueVisitors += 1;
    }
    stats.visitors[visitorId].lastSeen = now;
    if (event === 'visit') stats.visitors[visitorId].visits += 1;
  }

  if (event === 'visit') stats.totalPageViews += 1;

  if (section) {
    stats.sections[section] ||= { views: 0, totalMs: 0 };
    if (durationMs > 0) stats.sections[section].totalMs += durationMs;
    else stats.sections[section].views += 1;
  }

  const visitorEntries = Object.entries(stats.visitors || {});
  if (visitorEntries.length > COMMUNITY_MAX_VISITORS) {
    visitorEntries
      .sort((a, b) => new Date(b[1].lastSeen) - new Date(a[1].lastSeen))
      .slice(COMMUNITY_MAX_VISITORS)
      .forEach(([id]) => delete stats.visitors[id]);
  }

  await writeJsonFile(COMMUNITY_STATS, stats);
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

async function readJsonFile(path, fallback) {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path, payload) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function emptyCommunityStats() {
  return {
    totalPageViews: 0,
    uniqueVisitors: 0,
    visitors: {},
    sections: {},
    events: {},
    updatedAt: null
  };
}

function sanitizeProfile(profile = {}) {
  return {
    id: cleanText(profile.id, 80) || randomUUID(),
    name: filterProfanity(cleanText(profile.name, 40)) || 'Coast Friend',
    cat: cleanText(profile.cat, 80) || 'SpringQuiet.webp'
  };
}

function filterProfanity(value) {
  return PROFANITY.reduce((next, word) => {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    return next.replace(pattern, 'meow');
  }, String(value || ''));
}

function cleanChannel(value) {
  return cleanText(value, 80).replace(/[^a-z0-9:_-]/gi, '') || 'forum';
}

function cleanText(value, max = 200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function httpError(status, publicMessage) {
  const error = new Error(publicMessage);
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
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
