const COMMENTS_KEY = 'manseok-hwasu:community:comments:v1';
const STATS_KEY = 'manseok-hwasu:community:stats:v1';
const TOKEN_PREFIX = 'manseok-hwasu:community:admin-token:';
const TOKEN_TTL = 60 * 60 * 2;
const MAX_COMMENTS = 240;
const MAX_VISITORS = 2500;
const DEFAULT_ADMIN_PASSWORD = '9919BOMa1!';
const PROFANITY = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'dick',
  'cunt', 'slut', 'whore', 'crap', 'piss'
];

export async function onRequestGet(context) {
  return handleRequest(context);
}

export async function onRequestPost(context) {
  return handleRequest(context);
}

export async function onRequestDelete(context) {
  return handleRequest(context);
}

async function handleRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'comments';
  const store = getStore(env);

  if (!store) {
    return json({ error: 'missing_kv_binding' }, 503);
  }

  try {
    if (request.method === 'GET' && action === 'comments') {
      const channel = cleanChannel(url.searchParams.get('channel'));
      return json({ comments: await listComments(store, channel) });
    }

    if (request.method === 'GET' && action === 'admin-stats') {
      await requireAdmin(store, request);
      return json({
        stats: await readJson(store, STATS_KEY, emptyStats()),
        comments: await readJson(store, COMMENTS_KEY, [])
      });
    }

    if (request.method === 'POST') {
      const body = await readBody(request);
      if (body.action === 'admin-login') return adminLogin(store, env, body);
      if (body.action === 'comment') return saveComment(store, body);
      if (body.action === 'track') return saveTrack(store, body);
    }

    if (request.method === 'DELETE' && action === 'comment') {
      await requireAdmin(store, request);
      const id = cleanText(url.searchParams.get('id'), 80);
      const comments = await readJson(store, COMMENTS_KEY, []);
      const next = comments.filter(comment => comment.id !== id);
      await store.put(COMMENTS_KEY, JSON.stringify(next));
      return json({ ok: true, removed: comments.length - next.length });
    }

    return json({ error: 'not_found' }, 404);
  } catch (error) {
    const status = error.status || 500;
    return json({ error: error.publicMessage || 'server_error' }, status);
  }
}

function getStore(env) {
  return env?.ENGAGEMENT_STORE || env?.TIDE_CACHE || null;
}

async function adminLogin(store, env, body) {
  const expected = env?.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if (!expected) return json({ ok: false, error: 'admin_disabled' }, 403);

  const name = cleanText(body.name, 40).toLowerCase();
  if (name !== 'sangaisadmin' || String(body.password || '') !== expected) {
    return json({ ok: false, error: 'invalid_admin' }, 403);
  }

  const token = crypto.randomUUID();
  await store.put(`${TOKEN_PREFIX}${token}`, '1', { expirationTtl: TOKEN_TTL });
  await incrementStats(store, { event: 'admin_login' });
  return json({ ok: true, token, expiresIn: TOKEN_TTL });
}

async function requireAdmin(store, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw httpError(401, 'admin_required');
  const exists = await store.get(`${TOKEN_PREFIX}${token}`);
  if (!exists) throw httpError(401, 'admin_required');
}

async function saveComment(store, body) {
  const text = filterProfanity(cleanText(body.text, 360));
  if (!text) return json({ error: 'empty_comment' }, 400);

  const profile = sanitizeProfile(body.profile);
  const channel = cleanChannel(body.channel);
  const comment = {
    id: crypto.randomUUID(),
    channel,
    eventId: cleanText(body.eventId, 80),
    text,
    profile,
    createdAt: new Date().toISOString()
  };

  const comments = await readJson(store, COMMENTS_KEY, []);
  comments.unshift(comment);
  await store.put(COMMENTS_KEY, JSON.stringify(comments.slice(0, MAX_COMMENTS)));
  await incrementStats(store, { event: 'comment_posted', channel });
  return json({ ok: true, comment });
}

async function saveTrack(store, body) {
  await incrementStats(store, body);
  return json({ ok: true });
}

async function listComments(store, channel) {
  const comments = await readJson(store, COMMENTS_KEY, []);
  return comments.filter(comment => comment.channel === channel).slice(0, 80);
}

async function incrementStats(store, body) {
  const stats = await readJson(store, STATS_KEY, emptyStats());
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

  trimVisitors(stats);
  await store.put(STATS_KEY, JSON.stringify(stats));
}

function trimVisitors(stats) {
  const entries = Object.entries(stats.visitors || {});
  if (entries.length <= MAX_VISITORS) return;
  entries
    .sort((a, b) => new Date(b[1].lastSeen) - new Date(a[1].lastSeen))
    .slice(MAX_VISITORS)
    .forEach(([id]) => delete stats.visitors[id]);
}

function emptyStats() {
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
  const fallbackCat = 'SpringQuiet.webp';
  return {
    id: cleanText(profile.id, 80) || crypto.randomUUID(),
    name: filterProfanity(cleanText(profile.name, 40)) || 'Coast Friend',
    cat: cleanText(profile.cat, 80) || fallbackCat
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

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function readJson(store, key, fallback) {
  try {
    const text = await store.get(key);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function httpError(status, publicMessage) {
  const error = new Error(publicMessage);
  error.status = status;
  error.publicMessage = publicMessage;
  return error;
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
