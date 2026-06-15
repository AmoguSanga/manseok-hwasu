/* ============================================================
   MANSEOK-HWASU — App Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();

  initThemeToggle();
  initOceanMotion();
  initHeroPaintDrops();
  initNav();
  initPlaceholderLinks();
  initLangToggle();
  initIncheonLinks();
  initCommunityEngagement();
  initVisitCardLinks();
  initScrollReveal();
  initActiveNavLink();
  initHeroCarousel();
  initTideStatus();
  initSurveyPage();
  initCurrentEvents();
  initDiscoverMap();
  initCalendar();
  initAreaBooking();
  initSeasonalTabs();
  initPromenadeMap();
  initBookingModal();
});

/* ─── Hero Paint Drops ──────────────────────── */
function initHeroPaintDrops() {
  const heroCard = document.querySelector('.hero__copy');
  if (!heroCard || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'hero__paint-drop-layer';
  layer.setAttribute('aria-hidden', 'true');
  heroCard.appendChild(layer);

  const positions = [
    { x: -8, y: 42 }, { x: 0, y: 72 }, { x: 18, y: 104 },
    { x: 48, y: 106 }, { x: 82, y: 104 }, { x: 108, y: 42 },
    { x: 102, y: 70 }, { x: 94, y: 92 }, { x: 44, y: 64 },
    { x: 58, y: 72 }, { x: 50, y: 86 }
  ];
  let timer = 0;
  let activeDrops = 0;
  let pendingInSequence = 0;

  const scheduleNextSequence = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(spawnDrop, 5000);
  };

  const spawnOneDrop = () => {
    if (activeDrops >= 2) return;
    const spot = positions[Math.floor(Math.random() * positions.length)];
    const drop = document.createElement('span');
    const size = Math.round(window.innerWidth <= 640
      ? 320 + Math.random() * 180
      : 480 + Math.random() * 300);
    const duration = 9300 + Math.random() * 3600;

    activeDrops += 1;
    drop.className = 'hero__paint-drop';
    drop.style.setProperty('--drop-x', `${spot.x + (Math.random() * 6 - 3)}%`);
    drop.style.setProperty('--drop-y', `${spot.y + (Math.random() * 6 - 3)}%`);
    drop.style.setProperty('--drop-size', `${size}px`);
    drop.style.setProperty('--drop-duration', `${duration}ms`);
    drop.style.setProperty('--drop-rotate', `${Math.random() * 80 - 40}deg`);
    layer.appendChild(drop);
    drop.addEventListener('animationend', () => {
      activeDrops = Math.max(0, activeDrops - 1);
      drop.remove();
      if (activeDrops === 0 && pendingInSequence === 0) scheduleNextSequence();
    }, { once: true });
  };

  const spawnDrop = () => {
    const openSlots = Math.max(0, 2 - activeDrops);
    const count = Math.min(openSlots, Math.random() < 0.25 ? 2 : 1);
    pendingInSequence = count;
    for (let i = 0; i < count; i++) {
      window.setTimeout(() => {
        pendingInSequence = Math.max(0, pendingInSequence - 1);
        spawnOneDrop();
        if (activeDrops === 0 && pendingInSequence === 0) scheduleNextSequence();
      }, i * (1600 + Math.random() * 900));
    }
  };

  timer = window.setTimeout(spawnDrop, 1800);
  window.addEventListener('pagehide', () => window.clearTimeout(timer), { once: true });
}

/* ─── Ocean Motion Layer ────────────────────── */
function initOceanMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const water = document.createElement('div');
  water.className = 'page-water';
  water.setAttribute('aria-hidden', 'true');

  const rippleLayer = document.createElement('div');
  rippleLayer.className = 'page-ripple-layer';
  rippleLayer.setAttribute('aria-hidden', 'true');

  document.body.prepend(water);
  document.body.appendChild(rippleLayer);

  let targetY = window.scrollY;
  let currentY = targetY;
  let lastY = targetY;
  let raf = 0;

  const setOceanVars = (value, velocity = 0) => {
    document.body.style.setProperty('--ocean-x', `${Math.sin(value * 0.0028) * 28}px`);
    document.body.style.setProperty('--ocean-y', `${(value % 900) * 0.035}px`);
    document.body.style.setProperty('--ocean-drift', `${Math.max(-1.8, Math.min(1.8, velocity * 0.08))}deg`);
    document.body.style.setProperty('--ocean-scroll', String(value));
  };

  const render = () => {
    currentY += (targetY - currentY) * 0.075;
    const velocity = currentY - lastY;
    lastY = currentY;
    setOceanVars(currentY, velocity);

    if (Math.abs(targetY - currentY) < 0.2 && Math.abs(velocity) < 0.08) {
      currentY = targetY;
      setOceanVars(currentY, 0);
      raf = 0;
      return;
    }

    raf = requestAnimationFrame(render);
  };

  const startOceanMotion = () => {
    targetY = window.scrollY;
    if (!raf) raf = requestAnimationFrame(render);
  };

  setOceanVars(currentY, 0);
  window.addEventListener('scroll', startOceanMotion, { passive: true });
  window.addEventListener('pagehide', () => {
    if (raf) cancelAnimationFrame(raf);
  }, { once: true });

  document.addEventListener('pointerdown', (event) => {
    const eventTarget = event.target instanceof Element ? event.target : event.target?.parentElement;
    const target = eventTarget?.closest('button, .btn, a, [role="button"]');
    if (!target) return;

    const ripple = document.createElement('span');
    ripple.className = 'page-ripple';
    ripple.style.setProperty('--ripple-x', `${event.clientX}px`);
    ripple.style.setProperty('--ripple-y', `${event.clientY}px`);
    rippleLayer.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, { passive: true });
}

/* ─── Theme Toggle (logo click) ───────────────────── */
function initThemeToggle() {
  const logo = document.querySelector('.nav__logo');
  if (!logo) return;

  logo.setAttribute('role', 'button');
  logo.setAttribute('tabindex', '0');
  logo.title = 'Toggle dark / light mode';

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('mh-theme', theme); } catch (e) {}
    logo.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    // Spin + pulse feedback
    logo.animate([
      { transform: 'scale(1)    rotate(0deg)',   boxShadow: '' },
      { transform: 'scale(1.22) rotate(180deg)', offset: 0.5 },
      { transform: 'scale(1)    rotate(360deg)', boxShadow: '' }
    ], { duration: 520, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'none' });
  };

  logo.addEventListener('click', toggle);
  logo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggle(e);
  });
}

/* ─── Hero Carousel ───────────────────────────────── */
function initHeroCarousel() {
  const root = document.getElementById('heroCarousel');
  if (!root) return;

  const photos = Array.from(root.querySelectorAll('.hero__photo'));
  const dots = root.querySelector('.hero__carousel-dots');
  if (photos.length < 2 || !dots) return;

  photos.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = index === 0 ? 'is-active' : '';
    dots.appendChild(dot);
  });

  const dotEls = Array.from(dots.children);
  let active = 0;

  const show = (index) => {
    const previous = active;
    active = index % photos.length;
    photos.forEach((photo, i) => {
      photo.classList.toggle('is-active', i === active);
      photo.classList.toggle('is-prev', i === previous && i !== active);
    });
    dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => show(active + 1), 4200);
}

/* ─── Navigation ──────────────────────────────────── */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
  // Close menu when a link is clicked (mobile)
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function initPlaceholderLinks() {
  document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', event => event.preventDefault());
  });
}

function initLangToggle() {
  const btn = document.querySelector('.nav__lang');
  if (!btn) return;
  btn.addEventListener('click', () => i18n.toggle());
}

function initIncheonLinks() {
  const links = document.querySelectorAll('[data-incheon-link]');
  if (!links.length) return;

  const urls = {
    en: 'https://www.incheon.go.kr/en/index',
    ko: 'https://www.incheon.go.kr/index'
  };

  const apply = (lang = window.i18n?.currentLang || 'en') => {
    const href = urls[lang] || urls.en;
    links.forEach(link => { link.href = href; });
  };

  apply();
  document.addEventListener('i18n:applied', (event) => apply(event.detail?.lang));
}

/* ─── Community Profile, Comments, Stats ───────────── */
const COMMUNITY_PROFILE_KEY = 'mh-community-profile-v1';
const COMMUNITY_PROFILE_COLLAPSED_KEY = 'mh-community-profile-collapsed-v1';
const COMMUNITY_ADMIN_KEY = 'mh-community-admin-token-v1';
const COMMUNITY_FALLBACK_POSTS_KEY = 'mh-community-fallback-posts-v1';
const COMMUNITY_FALLBACK_COMMENTS_KEY = 'mh-community-fallback-comments-v1';
const COMMUNITY_CATS = [
  { file: 'SpringQuiet.webp', label: 'Spring Quiet' },
  { file: 'SpringActive.webp', label: 'Spring Active' },
  { file: 'SummerQuiet.webp', label: 'Summer Quiet' },
  { file: 'SummerActive.webp', label: 'Summer Active' },
  { file: 'AutumnQuiet.webp', label: 'Autumn Quiet' },
  { file: 'AutumnActive..webp', label: 'Autumn Active' },
  { file: 'WinterQuiet.webp', label: 'Winter Quiet' },
  { file: 'WinterActive.webp', label: 'Winter Active' }
];

const communityState = {
  profile: null,
  adminToken: null,
  isAdmin: false,
  activePostId: '',
  usingLocalForum: false,
  activeSectionId: '',
  activeSectionAt: 0
};

function initCommunityEngagement() {
  communityState.profile = loadCommunityProfile();
  try { communityState.adminToken = sessionStorage.getItem(COMMUNITY_ADMIN_KEY) || ''; } catch (e) {}
  communityState.isAdmin = Boolean(communityState.adminToken);

  renderCommunityProfile();
  bindCommunityModal();
  initEngagementTracking();
  syncEventCommentProfile();
}

function loadCommunityProfile() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(COMMUNITY_PROFILE_KEY) || 'null'); } catch (e) {}
  const randomId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const profile = {
    id: saved?.id || randomId,
    name: cleanCommunityText(saved?.name, 40) || 'Coast Friend',
    cat: COMMUNITY_CATS.some(cat => cat.file === saved?.cat) ? saved.cat : COMMUNITY_CATS[0].file
  };
  saveCommunityProfile(profile);
  return profile;
}

function saveCommunityProfile(profile) {
  communityState.profile = profile;
  try { localStorage.setItem(COMMUNITY_PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
}

function renderCommunityProfile() {
  const profile = communityState.profile;
  const imgs = document.querySelectorAll('[data-community-profile-img]');
  const names = document.querySelectorAll('[data-community-profile-name]');
  const form = document.querySelector('[data-community-profile-form]');
  const cats = document.querySelector('[data-community-cats]');
  const admin = document.querySelector('[data-community-admin]');

  imgs.forEach(img => { img.src = catImage(profile.cat); });
  names.forEach(name => { name.textContent = profile.name; });
  if (form?.elements.name) form.elements.name.value = profile.name;
  if (admin) admin.hidden = profile.name.toLowerCase() !== 'sangaisadmin';

  if (cats) {
    cats.innerHTML = '';
    COMMUNITY_CATS.forEach(cat => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `community-cat${cat.file === profile.cat ? ' is-active' : ''}`;
      button.setAttribute('aria-label', cat.label);
      button.innerHTML = `<img src="${catImage(cat.file)}" alt="">`;
      button.addEventListener('click', () => {
        saveCommunityProfile({ ...communityState.profile, cat: cat.file });
        renderCommunityProfile();
        syncEventCommentProfile();
      });
      cats.appendChild(button);
    });
  }
}

function bindCommunityModal() {
  const modal = document.getElementById('communityModal');
  const page = document.querySelector('[data-community-page]');
  if (!modal && !page) return;

  document.querySelectorAll('[data-community-open]').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openCommunityModal();
    });
  });

  modal?.querySelectorAll('[data-community-close]').forEach(button => {
    button.addEventListener('click', closeCommunityModal);
  });

  document.querySelector('[data-community-profile-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nextName = cleanCommunityText(form.elements.name.value, 40) || 'Coast Friend';
    saveCommunityProfile({ ...communityState.profile, name: nextName });
    renderCommunityProfile();
    setCommunityProfileCollapsed(true);
    syncEventCommentProfile();
    trackCommunityEvent('profile_saved');
  });

  document.querySelector('[data-community-profile-toggle]')?.addEventListener('click', () => {
    const panel = document.querySelector('[data-community-profile-panel]');
    setCommunityProfileCollapsed(panel ? !panel.hidden : false);
  });

  document.querySelector('[data-community-post-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = cleanCommunityText(form.elements.title.value, 100);
    const text = cleanCommunityText(form.elements.text.value, 800);
    if (!title || !text) return;
    const post = await createForumPost(title, text);
    form.reset();
    communityState.activePostId = post?.id || communityState.activePostId;
    await loadForumPosts();
  });

  document.querySelector('[data-community-reply-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = cleanCommunityText(form.elements.reply.value, 500);
    if (!communityState.activePostId || !text) return;
    await createForumReply(communityState.activePostId, text);
    form.reset();
    await openForumPost(communityState.activePostId);
    await loadForumPosts();
  });

  document.querySelector('[data-community-refresh]')?.addEventListener('click', loadForumPosts);
  document.querySelector('[data-community-admin-login]')?.addEventListener('submit', handleAdminLogin);
  document.querySelector('[data-community-stats-refresh]')?.addEventListener('click', loadAdminStats);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeCommunityModal();
  });

  if (page) {
    setCommunityProfileCollapsed(getCommunityProfileCollapsedDefault());
    loadForumPosts();
    if (communityState.isAdmin) loadAdminStats();
    trackCommunityEvent('forum_page_open');
  }
}

function openCommunityModal() {
  const modal = document.getElementById('communityModal');
  if (!modal) {
    window.location.href = 'community.html';
    return;
  }
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  renderCommunityProfile();
  loadForumPosts();
  if (communityState.isAdmin) loadAdminStats();
  trackCommunityEvent('forum_open');
}

function closeCommunityModal() {
  const modal = document.getElementById('communityModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  if (!document.querySelector('.event-modal.is-open, .booking-modal.is-open')) {
    document.body.style.overflow = '';
  }
}

function getCommunityProfileCollapsedDefault() {
  try {
    const savedProfile = localStorage.getItem(COMMUNITY_PROFILE_KEY);
    const savedCollapse = localStorage.getItem(COMMUNITY_PROFILE_COLLAPSED_KEY);
    if (savedCollapse !== null) return savedCollapse === 'true';
    return Boolean(savedProfile);
  } catch (e) {
    return true;
  }
}

function setCommunityProfileCollapsed(collapsed) {
  const panel = document.querySelector('[data-community-profile-panel]');
  const toggle = document.querySelector('[data-community-profile-toggle]');
  if (!panel || !toggle) return;
  panel.hidden = collapsed;
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.classList.toggle('is-open', !collapsed);
  try { localStorage.setItem(COMMUNITY_PROFILE_COLLAPSED_KEY, String(collapsed)); } catch (e) {}
}

async function loadForumPosts() {
  const list = document.querySelector('[data-community-posts]');
  if (!list) return;
  list.innerHTML = '<div class="community-post is-loading"><strong>Loading posts...</strong></div>';

  try {
    const data = await communityApi('?action=posts');
    communityState.usingLocalForum = false;
    setCommunityStatus('');
    renderForumPosts(data.posts || []);
    if (communityState.activePostId) await openForumPost(communityState.activePostId, { skipList: true });
  } catch (error) {
    communityState.usingLocalForum = true;
    setCommunityStatus('Static/local mode: posts are saved in this browser only. Use node server.mjs or Cloudflare KV for shared live posts.');
    const posts = readFallbackPosts();
    renderForumPosts(posts);
    if (communityState.activePostId) await openForumPost(communityState.activePostId, { skipList: true });
  }
}

function renderForumPosts(posts) {
  const list = document.querySelector('[data-community-posts]');
  if (!list) return;
  list.innerHTML = '';

  if (!posts.length) {
    list.innerHTML = '<div class="community-post"><strong>No posts yet</strong><p>Create the first thread for this coast.</p></div>';
    renderForumThread(null);
    return;
  }

  if (!posts.some(post => post.id === communityState.activePostId)) {
    communityState.activePostId = posts[0].id;
  }

  posts.forEach(post => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `community-post${post.id === communityState.activePostId ? ' is-active' : ''}`;
    const avatar = document.createElement('img');
    avatar.src = catImage(post.profile?.cat);
    avatar.alt = '';

    const body = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = post.title || 'Untitled post';
    const meta = document.createElement('span');
    meta.textContent = `${post.profile?.name || 'Coast Friend'} · ${formatCommunityDate(post.createdAt)} · ${post.replyCount || post.replies?.length || 0} replies`;
    const text = document.createElement('p');
    text.textContent = post.text || '';
    body.append(title, meta, text);

    item.append(avatar, body);
    item.addEventListener('click', () => openForumPost(post.id));

    list.appendChild(item);
  });

  openForumPost(communityState.activePostId, { skipList: true });
}

async function openForumPost(id, options = {}) {
  if (!id) {
    renderForumThread(null);
    return;
  }

  communityState.activePostId = id;
  try {
    const data = communityState.usingLocalForum
      ? { post: readFallbackPosts().find(post => post.id === id) }
      : await communityApi(`?action=post&id=${encodeURIComponent(id)}`);
    renderForumThread(data.post || null);
    if (!options.skipList) await loadForumPosts();
  } catch (error) {
    const post = readFallbackPosts().find(item => item.id === id);
    renderForumThread(post || null);
  }
}

function renderForumThread(post) {
  const empty = document.querySelector('[data-community-thread-empty]');
  const content = document.querySelector('[data-community-thread-content]');
  const postEl = document.querySelector('[data-community-thread-post]');
  const repliesEl = document.querySelector('[data-community-replies]');
  if (!empty || !content || !postEl || !repliesEl) return;

  empty.hidden = Boolean(post);
  content.hidden = !post;
  postEl.innerHTML = '';
  repliesEl.innerHTML = '';
  if (!post) return;

  const header = document.createElement('div');
  header.className = 'community-thread__post-head';
  header.innerHTML = '<img alt=""><div><h2></h2><span></span></div>';
  header.querySelector('img').src = catImage(post.profile?.cat);
  header.querySelector('h2').textContent = post.title || 'Untitled post';
  header.querySelector('span').textContent = `${post.profile?.name || 'Coast Friend'} · ${formatCommunityDate(post.createdAt)}`;
  const body = document.createElement('p');
  body.textContent = post.text || '';
  postEl.append(header, body);

  if (communityState.isAdmin) {
    const removePost = document.createElement('button');
    removePost.type = 'button';
    removePost.className = 'community-thread__delete';
    removePost.textContent = 'Delete Post';
    removePost.addEventListener('click', () => deleteForumPost(post.id));
    postEl.appendChild(removePost);
  }

  const replies = Array.isArray(post.replies) ? post.replies : [];
  if (!replies.length) {
    repliesEl.innerHTML = '<div class="community-reply"><strong>No replies yet</strong><p>Be the first to answer.</p></div>';
    return;
  }

  replies.forEach(reply => {
    const item = document.createElement('article');
    item.className = 'community-reply';
    item.innerHTML = '<img alt=""><div><strong></strong><time></time><p></p></div>';
    item.querySelector('img').src = catImage(reply.profile?.cat);
    item.querySelector('strong').textContent = reply.profile?.name || 'Coast Friend';
    item.querySelector('time').textContent = formatCommunityDate(reply.createdAt);
    item.querySelector('p').textContent = reply.text || '';
    if (communityState.isAdmin) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'community-comment__delete';
      remove.setAttribute('aria-label', 'Delete reply');
      remove.textContent = '×';
      remove.addEventListener('click', () => deleteForumReply(post.id, reply.id));
      item.appendChild(remove);
    }
    repliesEl.appendChild(item);
  });
}

async function createForumPost(title, text) {
  try {
    const result = await communityApi('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'post',
        title,
        text,
        profile: communityState.profile
      })
    });
    communityState.usingLocalForum = false;
    setCommunityStatus('');
    trackCommunityEvent('forum_post_created_client');
    return result.post;
  } catch (error) {
    communityState.usingLocalForum = true;
    const post = saveFallbackPost(title, text);
    setCommunityStatus('Saved locally in this browser. Start node server.mjs or configure Cloudflare KV for shared posts.');
    return post;
  }
}

async function createForumReply(postId, text) {
  try {
    const result = await communityApi('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reply',
        postId,
        text,
        profile: communityState.profile
      })
    });
    communityState.usingLocalForum = false;
    setCommunityStatus('');
    trackCommunityEvent('forum_reply_created_client');
    return result.reply;
  } catch (error) {
    communityState.usingLocalForum = true;
    const reply = saveFallbackReply(postId, text);
    setCommunityStatus('Reply saved locally in this browser.');
    return reply;
  }
}

function readFallbackPosts() {
  try {
    const posts = JSON.parse(localStorage.getItem(COMMUNITY_FALLBACK_POSTS_KEY) || '[]');
    return Array.isArray(posts) ? posts : [];
  } catch (e) {
    return [];
  }
}

function writeFallbackPosts(posts) {
  try { localStorage.setItem(COMMUNITY_FALLBACK_POSTS_KEY, JSON.stringify(posts.slice(0, 140))); } catch (e) {}
}

function saveFallbackPost(title, text) {
  const now = new Date().toISOString();
  const post = {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `post-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: filterCommunityProfanity(title),
    text: filterCommunityProfanity(text),
    profile: { ...communityState.profile },
    replies: [],
    replyCount: 0,
    createdAt: now,
    updatedAt: now
  };
  const posts = readFallbackPosts();
  posts.unshift(post);
  writeFallbackPosts(posts);
  return post;
}

function saveFallbackReply(postId, text) {
  const posts = readFallbackPosts();
  const post = posts.find(item => item.id === postId);
  if (!post) return null;
  const reply = {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `reply-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: filterCommunityProfanity(text),
    profile: { ...communityState.profile },
    createdAt: new Date().toISOString()
  };
  post.replies = [reply, ...(post.replies || [])].slice(0, 160);
  post.replyCount = post.replies.length;
  post.updatedAt = new Date().toISOString();
  writeFallbackPosts(posts);
  return reply;
}

function readFallbackComments(channel) {
  try {
    const comments = JSON.parse(localStorage.getItem(COMMUNITY_FALLBACK_COMMENTS_KEY) || '[]');
    return Array.isArray(comments) ? comments.filter(comment => comment.channel === channel).slice(0, 80) : [];
  } catch (e) {
    return [];
  }
}

function saveFallbackComment(channel, text, eventId = '') {
  const comment = {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    channel,
    eventId,
    text: filterCommunityProfanity(text),
    profile: { ...communityState.profile },
    createdAt: new Date().toISOString()
  };
  try {
    const comments = JSON.parse(localStorage.getItem(COMMUNITY_FALLBACK_COMMENTS_KEY) || '[]');
    const next = [comment, ...(Array.isArray(comments) ? comments : [])].slice(0, 240);
    localStorage.setItem(COMMUNITY_FALLBACK_COMMENTS_KEY, JSON.stringify(next));
  } catch (e) {}
  return comment;
}

function setCommunityStatus(message) {
  const status = document.querySelector('[data-community-status]');
  if (!status) return;
  status.textContent = message || '';
  status.hidden = !message;
}

function filterCommunityProfanity(value) {
  const words = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'dick', 'cunt', 'slut', 'whore', 'crap', 'piss'];
  return words.reduce((next, word) => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return next.replace(pattern, 'meow');
  }, String(value || ''));
}

async function postCommunityComment(channel, text, eventId = '') {
  try {
    const result = await communityApi('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'comment',
        channel,
        eventId,
        text,
        profile: communityState.profile
      })
    });
    trackCommunityEvent('comment_posted_client', { channel });
    return result.comment;
  } catch (error) {
    const comment = saveFallbackComment(channel, text, eventId);
    trackCommunityEvent('comment_posted_local', { channel });
    return comment;
  }
}

async function deleteForumPost(id) {
  if (!id) return;
  if (communityState.usingLocalForum) {
    writeFallbackPosts(readFallbackPosts().filter(post => post.id !== id));
    communityState.activePostId = '';
    await loadForumPosts();
    return;
  }
  if (!communityState.adminToken) return;
  await communityApi(`?action=post&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${communityState.adminToken}` }
  });
  communityState.activePostId = '';
  await loadForumPosts();
  await loadAdminStats();
}

async function deleteForumReply(postId, id) {
  if (!postId || !id) return;
  if (communityState.usingLocalForum) {
    const posts = readFallbackPosts();
    const post = posts.find(item => item.id === postId);
    if (post) post.replies = (post.replies || []).filter(reply => reply.id !== id);
    writeFallbackPosts(posts);
    await openForumPost(postId);
    await loadForumPosts();
    return;
  }
  if (!communityState.adminToken) return;
  await communityApi(`?action=reply&postId=${encodeURIComponent(postId)}&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${communityState.adminToken}` }
  });
  await openForumPost(postId);
  await loadForumPosts();
  await loadAdminStats();
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('[data-community-admin-status]');
  const password = form.elements.password.value;

  try {
    const data = await communityApi('', {
      method: 'POST',
      body: JSON.stringify({
        action: 'admin-login',
        name: communityState.profile.name,
        password
      })
    });
    communityState.adminToken = data.token;
    communityState.isAdmin = true;
    try { sessionStorage.setItem(COMMUNITY_ADMIN_KEY, data.token); } catch (e) {}
    form.reset();
    if (status) status.textContent = 'Admin unlocked.';
    await loadAdminStats();
    await loadForumPosts();
  } catch (error) {
    if (status) status.textContent = 'Admin login failed. Check the password or server secret.';
  }
}

async function loadAdminStats() {
  const statsPanel = document.querySelector('[data-community-stats]');
  const statGrid = document.querySelector('[data-community-stat-grid]');
  const sectionStats = document.querySelector('[data-community-section-stats]');
  if (!communityState.adminToken || !statsPanel || !statGrid || !sectionStats) return;

  try {
    const data = await communityApi('?action=admin-stats', {
      headers: { Authorization: `Bearer ${communityState.adminToken}` }
    });
    const stats = data.stats || {};
    statsPanel.hidden = false;
    statGrid.innerHTML = '';
    [
      ['Page Views', stats.totalPageViews || 0],
      ['Unique Visitors', stats.uniqueVisitors || 0],
      ['Forum Posts', (data.posts || []).length],
      ['Replies', (data.posts || []).reduce((total, post) => total + (post.replies?.length || 0), 0)],
      ['Event Comments', (data.comments || []).length],
      ['Forum Opens', stats.events?.forum_open || 0],
      ['Bookings', stats.events?.booking_confirm || 0],
      ['Event Opens', stats.events?.event_modal_open || 0]
    ].forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'community-stat';
      item.innerHTML = '<span></span><strong></strong>';
      item.querySelector('span').textContent = label;
      item.querySelector('strong').textContent = value;
      statGrid.appendChild(item);
    });

    sectionStats.innerHTML = '';
    Object.entries(stats.sections || {})
      .sort((a, b) => (b[1].totalMs || 0) - (a[1].totalMs || 0))
      .forEach(([section, value]) => {
        const row = document.createElement('div');
        row.className = 'community-section-stat';
        row.innerHTML = '<strong></strong><span></span><span></span>';
        row.querySelector('strong').textContent = section;
        row.querySelectorAll('span')[0].textContent = `${value.views || 0} views`;
        row.querySelectorAll('span')[1].textContent = `${formatDuration(value.totalMs || 0)} stayed`;
        sectionStats.appendChild(row);
      });
  } catch (error) {
    communityState.isAdmin = false;
    try { sessionStorage.removeItem(COMMUNITY_ADMIN_KEY); } catch (e) {}
  }
}

async function communityApi(query = '', options = {}) {
  const response = await fetch(`/api/community${query}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'community_api_error');
    error.data = data;
    throw error;
  }
  return data;
}

function initEngagementTracking() {
  trackCommunityEvent('visit');

  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const visible = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
      else visible.delete(entry.target.id);
    });
    const next = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    setActiveTrackedSection(next);
  }, { threshold: [0.35, 0.55, 0.75] });

  sections.forEach(section => observer.observe(section));
  window.addEventListener('pagehide', flushActiveSectionDwell);
}

function setActiveTrackedSection(sectionId) {
  if (!sectionId || communityState.activeSectionId === sectionId) return;
  flushActiveSectionDwell();
  communityState.activeSectionId = sectionId;
  communityState.activeSectionAt = Date.now();
  trackCommunityEvent('section_view', { section: sectionId });
}

function flushActiveSectionDwell() {
  if (!communityState.activeSectionId || !communityState.activeSectionAt) return;
  const durationMs = Date.now() - communityState.activeSectionAt;
  if (durationMs > 1000) {
    trackCommunityEvent('section_dwell', {
      section: communityState.activeSectionId,
      durationMs
    }, true);
  }
  communityState.activeSectionAt = Date.now();
}

function trackCommunityEvent(event, extra = {}, immediate = false) {
  const profile = communityState.profile || loadCommunityProfile();
  const payload = JSON.stringify({
    action: 'track',
    visitorId: profile.id,
    event,
    ...extra
  });

  if (immediate && navigator.sendBeacon) {
    navigator.sendBeacon('/api/community', new Blob([payload], { type: 'application/json' }));
    return;
  }

  fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: payload,
    keepalive: immediate
  }).catch(() => {});
}

function syncEventCommentProfile() {
  const form = document.querySelector('[data-event-comment-form]');
  if (!form?.elements.name || !communityState.profile) return;
  form.elements.name.value = communityState.profile.name;
  form.elements.name.readOnly = true;
  form.elements.name.title = 'Uses your community profile name';
}

function catImage(file) {
  const safeFile = COMMUNITY_CATS.some(cat => cat.file === file) ? file : COMMUNITY_CATS[0].file;
  return `assets/images/catresults/${safeFile}`;
}

function cleanCommunityText(value, max = 200) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function formatCommunityDate(value) {
  const date = new Date(value || Date.now());
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function initVisitCardLinks() {
  document.querySelectorAll('[data-open-discover-space]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const id = link.dataset.openDiscoverSpace;
      const discover = document.getElementById('discover');
      if (!discover || !id) return;

      let opened = false;
      const openSpace = () => {
        if (opened) return;
        opened = true;
        window.removeEventListener('scrollend', openSpace);
        document.dispatchEvent(new CustomEvent('discover:open-space', { detail: { id } }));
      };

      discover.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.addEventListener('scrollend', openSpace, { once: true });
      window.setTimeout(openSpace, 1100);
    });
  });
}

/* ─── Discover What Suits You Survey ───────────────── */
function initSurveyPage() {
  const root = document.querySelector('[data-survey]');
  if (!root) return;

  const questionEl = root.querySelector('[data-survey-question]');
  const introEl = root.querySelector('[data-survey-intro]');
  const optionsEl = root.querySelector('[data-survey-options]');
  const progressEl = root.querySelector('[data-survey-progress]');
  const nextButton = root.querySelector('[data-survey-next]');
  const resultPanel = document.querySelector('[data-survey-result]');
  const restartButton = resultPanel?.querySelector('[data-survey-restart]');
  const resultTitle = resultPanel?.querySelector('[data-result-title]');
  const resultCopy = resultPanel?.querySelector('[data-result-copy]');
  const resultPass = resultPanel?.querySelector('[data-result-pass]');
  const resultReward = resultPanel?.querySelector('[data-result-reward]');
  const resultLink = resultPanel?.querySelector('[data-result-link]');
  const resultImage = resultPanel?.querySelector('[data-result-image]');
  const resultTag = resultPanel?.querySelector('[data-result-tag]');
  const resultName = resultPanel?.querySelector('[data-result-name]');
  const resultSave = resultPanel?.querySelector('[data-result-save]');
  const resultShare = resultPanel?.querySelector('[data-result-share]');
  const resultStatus = resultPanel?.querySelector('[data-result-status]');
  if (!questionEl || !optionsEl || !progressEl || !nextButton || !resultPanel || !resultTitle || !resultCopy || !resultPass || !resultReward || !resultLink || !resultImage || !resultTag) return;

  const questions = [
    {
      text: 'You stand at the starting point of a new path. What calls to you first?',
      options: [
        { text: 'A gentle breeze carrying the scent of new blooms.', season: 'spring' },
        { text: 'The intense glare of the sun dancing on the water.', season: 'summer' },
        { text: 'The deep, warm gradient of the evening sunset.', season: 'autumn' },
        { text: 'The sharp, frosty bite of the clear open air.', season: 'winter' }
      ]
    },
    {
      text: 'You find a hidden spot right at the entrance. Your instinct is to?',
      options: [
        { text: 'Pause your pace entirely and settle into the stillness.', style: 'quiet' },
        { text: 'Keep moving forward to see what lies around the corner.', style: 'active' }
      ]
    },
    {
      text: 'You encounter a lively flow of people on the trail. How do you tune in?',
      options: [
        { text: 'Find a quiet corner to observe the energy from a distance.', style: 'quiet' },
        { text: 'Join them and blend into the shared movement.', style: 'active' }
      ]
    },
    {
      text: 'You notice a series of markers along the path. What sparks your curiosity?',
      options: [
        { text: 'The hidden layers of meaning and history behind them.', style: 'quiet' },
        { text: 'The physical journey of tracking them down one by one.', style: 'active' }
      ]
    },
    {
      text: 'You finally reach the edge of the coast where the land ends. What completes this moment?',
      options: [
        { text: 'The fading sounds and space for your own thoughts.', style: 'quiet' },
        { text: 'The lingering energy and the shared vibe of the crowd.', style: 'active' }
      ]
    }
  ];

  // Edit result content here: each season/style maps to one cat image,
  // personality text, reward copy, coupon code, and fallback PNG colors.
  const results = {
    spring: {
      quiet: {
        key: 'spring_quiet_cat',
        season: 'Spring',
        style: 'Quiet',
        petName: 'Momo',
        catName: 'The Shore Reader',
        traits: ['Quiet', 'Reflective', 'Bloom-Led'],
        title: 'Spring Quiet: Shore Reader',
        copy: 'Your best match is a gentle spring visit with reading zones, slow deck pauses, and solo ocean-horizon viewing.',
        personality: 'Gentle, reflective, and detail-loving. You notice small changes in light, the texture of the deck, and the first bloom before anyone else does.',
        pass: '60-Minute Reading Zone Reservation Coupon',
        reward: 'Use this digital pass for a calm reading-zone reservation or a quiet deck seat during spring bloom weeks.',
        coupon: 'MHS-SPQ-READ',
        image: 'assets/images/catresults/SpringQuiet.webp',
        palette: ['#d9f1d4', '#84e3e9', '#ffcf66'],
        link: 'index.html#reading'
      },
      active: {
        key: 'spring_active_cat',
        season: 'Spring',
        style: 'Active',
        petName: 'Bori',
        catName: 'The Bloom Explorer',
        traits: ['Curious', 'Fresh-Air', 'Art-Loving'],
        title: 'Spring Active: Bloom Explorer',
        copy: 'Your route likes fresh morning air, light movement, and an art stop at Crocat House after the coast wakes up.',
        personality: 'Bright, curious, and lightly restless. You follow fresh air, new posters, morning routes, and the first open door on the coast.',
        pass: 'Crocat House Exhibition Perk',
        reward: 'Use this pass for an exhibition-linked visitor perk or a small partner discount after your morning route.',
        coupon: 'MHS-SPA-ART',
        image: 'assets/images/catresults/SpringActive.webp',
        palette: ['#c9f3d3', '#ffb95f', '#7fd8e5'],
        link: 'index.html#seasonal'
      }
    },
    summer: {
      quiet: {
        key: 'summer_quiet_cat',
        season: 'Summer',
        style: 'Quiet',
        petName: 'Nori',
        catName: 'The Shade Keeper',
        traits: ['Quiet', 'Thoughtful', 'Protective'],
        title: 'Summer Quiet: Shade Keeper',
        copy: 'You fit a cool summer plan: shaded canopy shelters, reading-zone breaks, and slow water watching away from the heat.',
        personality: 'Soft-spoken, observant, and excellent at finding comfort. You know where the shade lands and when the water feels calmest.',
        pass: 'Canopy Reading Shelter Coupon',
        reward: 'Use this digital pass toward a shaded reading-zone reservation during peak summer hours.',
        coupon: 'MHS-SUQ-SHADE',
        image: 'assets/images/catresults/SummerQuiet.webp',
        palette: ['#97d5ff', '#fff2b8', '#65cfdc'],
        link: 'index.html#reading'
      },
      active: {
        key: 'summer_active_cat',
        season: 'Summer',
        style: 'Active',
        petName: 'Toto',
        catName: 'The Tide Chaser',
        traits: ['Active', 'Social', 'Tide-Tuned'],
        title: 'Summer Active: Tide Chaser',
        copy: 'Your best route follows QR tracking points, open-air sunset watching, and the changing tide along the promenade.',
        personality: 'Energetic, social, and tide-tuned. You like a route with checkpoints, changing views, and a little sparkle at the finish.',
        pass: 'Promenade Pop-Up Voucher',
        reward: 'Use this pass for a promenade pop-up market voucher after completing your QR route.',
        coupon: 'MHS-SUA-TIDE',
        image: 'assets/images/catresults/SummerActive.webp',
        palette: ['#54c6e8', '#ffce53', '#ff7b46'],
        link: 'index.html#discover'
      }
    },
    autumn: {
      quiet: {
        key: 'autumn_quiet_cat',
        season: 'Autumn',
        style: 'Quiet',
        petName: 'Daru',
        catName: 'The Memory Walker',
        traits: ['Quiet', 'Historic', 'Warm-Eyed'],
        title: 'Autumn Quiet: Memory Walker',
        copy: 'Your route is a slow promenade walk with time for the layered history of Manseok-Hwasu and the warm evening gradient.',
        personality: 'Thoughtful, steady, and memory-led. You prefer places that hold stories, old edges, and warm colors that take time to read.',
        pass: 'Heritage Route Reward Pass',
        reward: 'Use this pass for a guided-story add-on or a quiet reading reward tied to the history route.',
        coupon: 'MHS-AUQ-MEMORY',
        image: 'assets/images/catresults/AutumnQuiet.webp',
        palette: ['#e7a94c', '#a96238', '#ffe0a6'],
        link: 'index.html#current'
      },
      active: {
        key: 'autumn_active_cat',
        season: 'Autumn',
        style: 'Active',
        petName: 'Sari',
        catName: 'The Festival Tracker',
        traits: ['Active', 'Expressive', 'Event-Led'],
        title: 'Autumn Active: Festival Tracker',
        copy: 'You match exhibition stops, seasonal event walks, and promenade market moments while the coast turns golden.',
        personality: 'Warm, expressive, and event-hungry. You collect moments, stops, and seasonal energy like stamps along the promenade.',
        pass: 'Promenade Market Voucher',
        reward: 'Use this digital pass for a small pop-up market voucher during autumn event days.',
        coupon: 'MHS-AUA-MARKET',
        image: 'assets/images/catresults/AutumnActive..webp',
        palette: ['#ffb84f', '#f06b3f', '#7f4a2f'],
        link: 'index.html#seasonal'
      }
    },
    winter: {
      quiet: {
        key: 'winter_quiet_cat',
        season: 'Winter',
        style: 'Quiet',
        petName: 'Nunu',
        catName: 'The Sunset Sipper',
        traits: ['Quiet', 'Cozy', 'Composed'],
        title: 'Winter Quiet: Sunset Sipper',
        copy: 'Your best match is crisp air, a warm drink at a sunset-view cafe, and a tucked-away Crocat House pause.',
        personality: 'Calm, composed, and comfort-seeking. You turn cold air into a ritual with warm drinks, slow views, and quiet windows.',
        pass: 'Sunset Drink Discount Coupon',
        reward: 'Use this pass for a drink discount at a participating cafe after your winter coast visit.',
        coupon: 'MHS-WIQ-CAFE',
        image: 'assets/images/catresults/WinterQuiet.webp',
        palette: ['#eaf6ff', '#98c9ec', '#5f7fa0'],
        link: 'index.html#current'
      },
      active: {
        key: 'winter_active_cat',
        season: 'Winter',
        style: 'Active',
        petName: 'Kkomi',
        catName: 'The Crisp-Air Runner',
        traits: ['Active', 'Focused', 'Brave'],
        title: 'Winter Active: Crisp-Air Runner',
        copy: 'You fit a winter sea jog: clear air, bright water, and a clean route that keeps the body moving.',
        personality: 'Focused, brave, and refresh-seeking. You like the coast when it feels sharp, clean, and wide open for motion.',
        pass: 'Winter Route Finisher Pass',
        reward: 'Use this pass for a route-finisher perk or partner drink discount after your winter jog.',
        coupon: 'MHS-WIA-RUN',
        image: 'assets/images/catresults/WinterActive.webp',
        palette: ['#cfe9ff', '#6f9ec4', '#f4fbff'],
        link: 'index.html#seasonal'
      }
    }
  };

  const state = {
    index: 0,
    answers: Array(questions.length).fill(null),
    result: null
  };

  const render = () => {
    const question = questions[state.index];
    questionEl.textContent = `Q${state.index + 1}. ${question.text}`;
    if (introEl) introEl.textContent = `Question ${state.index + 1} of ${questions.length}`;
    progressEl.style.width = `${((state.index + 1) / questions.length) * 100}%`;
    optionsEl.querySelectorAll('label').forEach(label => label.remove());

    question.options.forEach((option, optionIndex) => {
      const id = `survey-q${state.index}-o${optionIndex}`;
      const label = document.createElement('label');
      const input = document.createElement('input');
      const span = document.createElement('span');
      input.type = 'radio';
      input.name = `survey-q${state.index}`;
      input.id = id;
      input.value = String(optionIndex);
      input.checked = state.answers[state.index] === optionIndex;
      span.textContent = option.text;
      label.htmlFor = id;
      label.classList.toggle('is-selected', input.checked);
      label.append(input, span);

      input.addEventListener('change', () => {
        state.answers[state.index] = optionIndex;
        nextButton.disabled = false;
        optionsEl.querySelectorAll('label').forEach(item => item.classList.remove('is-selected'));
        label.classList.add('is-selected');
      });

      optionsEl.appendChild(label);
    });

    nextButton.disabled = state.answers[state.index] === null;
    nextButton.querySelector('span').textContent = state.index === questions.length - 1 ? 'Reveal Result' : 'Next';
  };

  const moveToNextQuestion = () => {
    const startHeight = root.offsetHeight;
    root.style.height = `${startHeight}px`;
    root.classList.add('is-switching');
    nextButton.disabled = true;

    window.setTimeout(() => {
      state.index += 1;
      render();
      const endHeight = root.scrollHeight;
      root.style.height = `${startHeight}px`;

      window.requestAnimationFrame(() => {
        root.style.height = `${endHeight}px`;
        root.classList.remove('is-switching');
      });

      window.setTimeout(() => {
        root.style.height = '';
      }, 260);
    }, 180);
  };

  const sanitizeFilePart = (value) => {
    const cleaned = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
    return cleaned || 'guest';
  };

  const loadResultImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  const hexToRgb = (hex) => {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  };

  const rgbToCss = ({ r, g, b }, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

  const extractImagePalette = (image, fallback) => {
    const canvas = document.createElement('canvas');
    const size = 60;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback.map(hexToRgb);

    ctx.drawImage(image, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size).data;
    const samples = [];
    for (let i = 0; i < pixels.length; i += 4 * 11) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a < 180) continue;
      const brightness = (r + g + b) / 3;
      if (brightness > 245 || brightness < 18) continue;
      samples.push({ r, g, b, brightness, warmth: r + g * 0.35 - b * 0.6 });
    }
    if (samples.length < 3) return fallback.map(hexToRgb);

    samples.sort((a, b) => b.warmth - a.warmth);
    const warm = samples[Math.floor(samples.length * 0.18)];
    const cool = samples[Math.floor(samples.length * 0.78)];
    const mid = samples.sort((a, b) => a.brightness - b.brightness)[Math.floor(samples.length * 0.58)];
    return [warm, mid, cool].map(({ r, g, b }) => ({ r, g, b }));
  };

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawRoundedImage = (ctx, image, x, y, width, height, radius) => {
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    let sourceWidth = image.width;
    let sourceHeight = image.height;
    let sourceX = 0;
    let sourceY = 0;
    if (imageRatio > targetRatio) {
      sourceWidth = image.height * targetRatio;
      sourceX = (image.width - sourceWidth) / 2;
    } else {
      sourceHeight = image.width / targetRatio;
      sourceY = (image.height - sourceHeight) / 2;
    }

    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    ctx.restore();
  };

  const drawContainedRoundedImage = (ctx, image, x, y, width, height, radius) => {
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    if (imageRatio > targetRatio) {
      drawHeight = width / imageRatio;
    } else {
      drawWidth = height * imageRatio;
    }
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  };

  const drawSoftCoverRoundedImage = (ctx, image, x, y, width, height, radius) => {
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    const scale = imageRatio > targetRatio ? height / image.height : width / image.width;
    const drawWidth = image.width * scale * 1.04;
    const drawHeight = image.height * scale * 1.04;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.save();
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.clip();
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) => {
    const words = String(text).split(/\s+/);
    let line = '';
    let lines = 0;

    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        if (lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
        lines += 1;
        line = word;
      } else {
        line = test;
      }
    });

    if (line && lines < maxLines) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
    }
    return y + lines * lineHeight;
  };

  const code128Patterns = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
  ];

  const encodeCode128B = (value) => {
    const clean = String(value).toUpperCase().replace(/[^\x20-\x7E]/g, '').slice(0, 28);
    const values = Array.from(clean).map(char => char.charCodeAt(0) - 32);
    const checksum = (104 + values.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
    return [104, ...values, checksum, 106];
  };

  const drawCode128Barcode = (ctx, code, x, y, width, height) => {
    ctx.save();
    ctx.fillStyle = '#fffaf3';
    drawRoundedRect(ctx, x, y, width, height, 14);
    ctx.fill();

    const encoded = encodeCode128B(code);
    const modules = encoded.reduce((sum, codeValue) => {
      return sum + code128Patterns[codeValue].split('').reduce((patternSum, widthValue) => patternSum + Number(widthValue), 0);
    }, 0);
    const moduleWidth = (width - 52) / modules;
    let cursor = x + 26;

    ctx.fillStyle = '#1f1818';
    encoded.forEach((codeValue) => {
      const pattern = code128Patterns[codeValue];
      Array.from(pattern).forEach((widthValue, index) => {
        const segmentWidth = Number(widthValue) * moduleWidth;
        if (index % 2 === 0) ctx.fillRect(cursor, y + 14, Math.ceil(segmentWidth), height - 28);
        cursor += segmentWidth;
      });
    });
    ctx.restore();
  };

  const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  const createResultPngBlob = async () => {
    const result = state.result;
    if (!result) throw new Error('No survey result selected.');
    const name = resultName?.value?.trim() || 'Coastal Guest';
    const image = await loadResultImage(result.image);
    const palette = extractImagePalette(image, result.palette);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    const displayTitle = result.title.includes(':') ? result.title.split(':').pop().trim() : result.title;

    ctx.fillStyle = '#fff8ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 250, 243, 0.2)';
    for (let i = 0; i < 190; i += 1) {
      const x = (i * 79) % canvas.width;
      const y = (i * 137) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = 'rgba(255, 250, 243, 0.92)';
    drawRoundedRect(ctx, 58, 58, 964, 1234, 54);
    ctx.fill();

    drawSoftCoverRoundedImage(ctx, image, 76, 26, 928, 930, 34);

    ctx.textAlign = 'center';
    ctx.font = '700 27px Inter, Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${result.petName.toUpperCase()} · ${displayTitle.toUpperCase()}`, 540, 988);

    ctx.fillStyle = 'rgba(255, 250, 243, 0.94)';
    drawRoundedRect(ctx, 76, 1014, 928, 240, 34);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '700 58px Fraunces, Georgia, serif';
    ctx.fillStyle = '#211919';
    wrapText(ctx, name, 112, 1084, 540, 60, 1);

    let traitX = 112;
    result.traits.forEach((trait) => {
      ctx.font = '700 20px Inter, Arial, sans-serif';
      const pillWidth = Math.min(210, ctx.measureText(trait).width + 42);
      ctx.fillStyle = 'rgba(255, 250, 243, 0.86)';
      drawRoundedRect(ctx, traitX, 1118, pillWidth, 42, 21);
      ctx.fill();
      ctx.fillStyle = '#405261';
      ctx.fillText(trait, traitX + 22, 1146);
      traitX += pillWidth + 12;
    });

    ctx.font = '500 21px Inter, Arial, sans-serif';
    ctx.fillStyle = '#5f666f';
    wrapText(ctx, result.personality, 112, 1184, 520, 26, 2);

    ctx.textAlign = 'left';
    ctx.font = '700 29px Inter, Arial, sans-serif';
    ctx.fillStyle = '#211919';
    wrapText(ctx, result.pass.toUpperCase(), 704, 1086, 264, 34, 3);

    drawCode128Barcode(ctx, result.coupon, 704, 1200, 264, 58);

    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error('PNG generation failed.');
    return blob;
  };

  const resultFilename = () => {
    const name = sanitizeFilePart(resultName?.value);
    const key = state.result?.key || 'coastal_cat';
    return `${name}_${key}.png`;
  };

  const setExportStatus = (message) => {
    if (resultStatus) resultStatus.textContent = message;
  };

  const showResult = () => {
    const seasonOption = questions[0].options[state.answers[0]];
    const scores = state.answers.slice(1).reduce((total, answerIndex, offset) => {
      const style = questions[offset + 1].options[answerIndex]?.style;
      if (style) total[style] += 1;
      return total;
    }, { quiet: 0, active: 0 });
    const season = seasonOption?.season || 'spring';
    const style = scores.active > scores.quiet ? 'active' : 'quiet';
    const result = results[season][style];
    state.result = result;

    resultTitle.textContent = result.title;
    resultCopy.textContent = result.copy;
    resultPass.textContent = result.pass;
    resultReward.textContent = result.reward;
    resultLink.href = result.link;
    resultImage.src = result.image;
    resultImage.alt = `${result.title} character image`;
    resultTag.textContent = `${result.petName} · ${result.season} ${result.style} Cat`;
    setExportStatus('');
    root.hidden = true;
    resultPanel.hidden = false;
    resultPanel.dataset.season = season;
    resultPanel.dataset.style = style;
    window.requestAnimationFrame(() => resultPanel.classList.add('is-visible'));
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  nextButton.addEventListener('click', () => {
    if (state.answers[state.index] === null) return;
    if (state.index < questions.length - 1) {
      moveToNextQuestion();
      return;
    }
    showResult();
  });

  restartButton?.addEventListener('click', () => {
    state.index = 0;
    state.answers = Array(questions.length).fill(null);
    state.result = null;
    root.hidden = false;
    resultPanel.hidden = true;
    resultPanel.classList.remove('is-visible');
    if (resultName) resultName.value = '';
    setExportStatus('');
    render();
    root.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  resultSave?.addEventListener('click', async () => {
    try {
      setExportStatus('Generating your PNG...');
      const blob = await createResultPngBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resultFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportStatus('PNG ready for your device.');
    } catch (error) {
      console.error(error);
      setExportStatus('PNG export could not be created on this device.');
    }
  });

  resultShare?.addEventListener('click', async () => {
    try {
      setExportStatus('Preparing share image...');
      const blob = await createResultPngBlob();
      const file = new File([blob], resultFilename(), { type: 'image/png' });
      const shareData = {
        title: state.result?.title || 'Manseok-Hwasu result',
        text: 'Here is my Manseok-Hwasu coastal character and reward pass.',
        files: [file]
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setExportStatus('Share sheet opened.');
        return;
      }

      const subject = encodeURIComponent(state.result?.title || 'My Manseok-Hwasu result');
      const body = encodeURIComponent('My Manseok-Hwasu result PNG is ready. On this browser, use Save PNG first, then attach it to your email.');
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setExportStatus('Email opened. Attach the saved PNG if your browser cannot share files.');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        setExportStatus('Sharing is not available on this device. Try Save PNG.');
      } else {
        setExportStatus('');
      }
    }
  });

  render();
}

/* ─── Scroll reveals ──────────────────────────────── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  // Respect user's reduced motion preference — show everything immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));

  // Safety net: if any reveal element has been on the page for >2s without firing
  // (e.g., it was already in viewport at load), force-show it.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      const inView = r.top < window.innerHeight && r.bottom > 0;
      if (inView) el.classList.add('is-visible');
    });
  }, 1200);
}

/* ─── Active nav link based on scroll position ────── */
function initActiveNavLink() {
  const links = document.querySelectorAll('.nav__link[data-target]');
  const sections = Array.from(links).map(l => document.getElementById(l.dataset.target)).filter(Boolean);

  const setActive = (id) => {
    links.forEach(l => l.classList.toggle('is-active', l.dataset.target === id));
  };

  const io = new IntersectionObserver((entries) => {
    // Pick the entry closest to top of viewport that is intersecting
    const visible = entries.filter(e => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) setActive(visible[0].target.id);
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.dataset.target;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ─── Discover Map ────────────────────────────────── */
function initDiscoverMap() {
  const pins = document.querySelectorAll('.discover-pin');
  const map = document.querySelector('.discover__map');
  const viewerLayer = document.querySelector('.discover__viewer');
  const previewPanel = map?.querySelector('.discover__panel');
  const previewImage = previewPanel?.querySelector('[data-node-preview]');
  const previewTitle = previewPanel?.querySelector('[data-node-title]');
  const previewDesc = previewPanel?.querySelector('[data-node-desc]');
  const watchButton = previewPanel?.querySelector('[data-watch-360]');
  const clearNodeButtons = map?.querySelectorAll('[data-node-clear]');
  const viewerFrame = viewerLayer?.querySelector('[data-panorama-viewer]');
  const fallbackFrame = viewerLayer?.querySelector('[data-panorama-fallback]');
  const viewerTitle = viewerLayer?.querySelector('[data-viewer-title]');
  const viewerDesc = viewerLayer?.querySelector('[data-viewer-desc]');
  const viewerNote = viewerLayer?.querySelector('[data-viewer-note]');
  const viewerStatus = viewerLayer?.querySelector('[data-panorama-status]');
  const spaceJump = viewerLayer?.querySelector('[data-space-jump]');
  const spaceJumpToggle = viewerLayer?.querySelector('[data-space-jump-toggle]');
  const spaceJumpPanel = viewerLayer?.querySelector('[data-space-jump-panel]');

  if (!map || !pins.length || !viewerLayer || !viewerFrame || !fallbackFrame) return;

  const MARZIPANO_URL = 'https://cdnjs.cloudflare.com/ajax/libs/marzipano/0.10.2/marzipano.js';
  let marzipanoLoad;
  let panoramaViewer;
  let activeScene;
  let activeId;

  const hotspotOverlay = document.createElement('article');
  hotspotOverlay.className = 'discover-hotspot-overlay';
  hotspotOverlay.hidden = true;
  hotspotOverlay.innerHTML = `
    <button class="discover-hotspot__close" type="button" data-hotspot-overlay-close aria-label="Close hotspot card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <span class="discover-hotspot__image" data-hotspot-overlay-image></span>
    <strong data-hotspot-overlay-title></strong>
    <span data-hotspot-overlay-body></span>
  `;
  viewerLayer.appendChild(hotspotOverlay);
  const hotspotOverlayImage = hotspotOverlay.querySelector('[data-hotspot-overlay-image]');
  const hotspotOverlayTitle = hotspotOverlay.querySelector('[data-hotspot-overlay-title]');
  const hotspotOverlayBody = hotspotOverlay.querySelector('[data-hotspot-overlay-body]');
  let selectedId;
  let viewerRequest = 0;

  const panoramaSpaces = {
    lounge: { image: 'assets/images/3dspaces/lounge.png', fallback: false },
    terrace: { image: 'assets/images/3dspaces/terracereading.png', fallback: false },
    parking: { image: 'assets/images/3dspaces/parking.png', fallback: false },
    cafe: { image: 'assets/images/3dspaces/cafe.png', fallback: false },
    gallery: { image: 'assets/images/3dspaces/gallery.png', fallback: false },
    beachfront: { image: 'assets/images/3dspaces/beachfront_benches.png', fallback: false },
    tidalstage: { image: 'assets/images/3dspaces/tidalstage_high.png', fallback: false },
    readingshore: { image: 'assets/images/3dspaces/readingshore.png', fallback: false },
    neighborpath: { image: 'assets/images/3dspaces/neighborpath.jpg', fallback: false },
    catisland: { image: 'assets/images/3dspaces/catisland.png', fallback: false }
  };

  const pinImages = {
    house: 'assets/images/discover/sea-lookout.webp',
    lounge: 'assets/images/3dspaces/lounge.png',
    terrace: 'assets/images/3dspaces/terracereading.png',
    parking: 'assets/images/3dspaces/parking.png',
    cafe: 'assets/images/3dspaces/cafe.png',
    gallery: 'assets/images/discover/art-gallery.webp',
    beachfront: 'assets/images/seasonal/summer.webp',
    tidalstage: 'assets/images/3dspaces/tidalstage_high.png',
    readingshore: 'assets/images/events/readingevent.webp',
    neighborpath: 'assets/images/discover/morning_circuit.webp',
    catisland: 'assets/images/discover/heritage_stop.webp'
  };

  const spaceOrder = ['lounge', 'terrace', 'parking', 'cafe', 'gallery', 'beachfront', 'tidalstage', 'readingshore', 'neighborpath', 'catisland'];

  // Edit 360 scene hotspots here. Each key matches a panoramaSpaces node id.
  // Each hotspot can have its own image, trigger label, title, body, yaw, and pitch.
  // If title/body are omitted, the card falls back to the node's translated title and description.
  const panoramaHotspots = {
  // Lounge 360 scene hotspot cards.
  lounge: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/3dspaces/lounge.png',
      en: {
        trigger: 'Story',
        title: 'Neighborhood Deck',
        body: 'This deck acts like the living room of the coast. It gives visitors a soft place to pause between walking, reading, and watching the harbor light shift throughout the day.'
      },
      ko: {
        trigger: '이야기',
        title: '네이버후드 데크',
        body: '이 데크는 해안의 거실 같은 역할을 합니다. 산책, 독서, 항구의 빛을 바라보는 시간 사이에 방문자가 잠시 머물 수 있는 부드러운 쉼터입니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/lounge.png',
      en: {
        trigger: 'Details',
        title: 'A Slower Social Zone',
        body: 'Unlike a normal bench area, this space is designed for staying. Wide seating, shade, and small tables make it useful for book clubs, casual conversations, morning coffee, and small community programs.'
      },
      ko: {
        trigger: '상세',
        title: '천천히 머무는 소셜 존',
        body: '일반적인 벤치 공간이 아니라 오래 머물 수 있도록 구성된 장소입니다. 넓은 좌석, 그늘, 작은 테이블은 북클럽, 가벼운 대화, 모닝 커피, 소규모 커뮤니티 프로그램에 활용됩니다.'
      }
    },
    {
      yaw: 1.28,
      pitch: 0.02,
      image: 'assets/images/3dspaces/lounge.png',
      en: {
        trigger: 'Program',
        title: 'A Flexible Event Point',
        body: 'During seasonal programs, this deck can become a check-in point, a post-walk stretching area, or a discussion circle. The goal is not to build a large facility, but to make simple coastal space work harder.'
      },
      ko: {
        trigger: '프로그램',
        title: '유연한 이벤트 거점',
        body: '계절 프로그램이 열릴 때 이 데크는 체크인 장소, 산책 후 스트레칭 공간, 토론 모임 장소로 바뀔 수 있습니다. 큰 시설을 새로 짓기보다 단순한 해안 공간을 더 잘 활용하는 것이 핵심입니다.'
      }
    }
  ],

  // Terrace Reading 360 scene hotspot cards.
  terrace: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/3dspaces/terracereading.png',
      en: {
        trigger: 'Reading',
        title: 'Golden Hour Reading Terrace',
        body: 'This terrace is imagined as a quiet reading balcony facing the water. In the late afternoon, the sea becomes brighter and the space turns into one of the most atmospheric reading spots on the route.'
      },
      ko: {
        trigger: '독서',
        title: '골든아워 리딩 테라스',
        body: '이 테라스는 바다를 향한 조용한 독서 발코니처럼 기획된 공간입니다. 늦은 오후에는 바다가 더 밝게 빛나며, 이곳은 동선에서 가장 분위기 있는 독서 장소 중 하나가 됩니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/terracereading.png',
      en: {
        trigger: 'Shade',
        title: 'Low-Cost, Warm Shade Design',
        body: 'The shade structure can use simple wood framing and fabric panels instead of expensive architecture. This keeps the proposal economical while still making the space feel cozy, intentional, and premium.'
      },
      ko: {
        trigger: '그늘',
        title: '경제적이지만 따뜻한 그늘 디자인',
        body: '그늘 구조물은 비싼 건축물보다 단순한 목재 프레임과 패브릭 패널을 활용할 수 있습니다. 비용은 낮추면서도 공간이 아늑하고 기획된 장소처럼 느껴지게 합니다.'
      }
    },
    {
      yaw: 1.36,
      pitch: -0.02,
      image: 'assets/images/3dspaces/terracereading.png',
      en: {
        trigger: 'Use',
        title: 'Not Just Silent Reading',
        body: 'This spot can support quiet reading during the day and small literary circles in the evening. Programs like the Han Kang Book Club would feel especially strong here because the changing tide becomes part of the discussion atmosphere.'
      },
      ko: {
        trigger: '활용',
        title: '조용한 독서 그 이상',
        body: '이 공간은 낮에는 조용한 독서 장소가 되고, 저녁에는 작은 문학 모임 장소가 될 수 있습니다. 한강 작가 북클럽 같은 프로그램은 조수의 변화가 토론 분위기의 일부가 되기 때문에 특히 잘 어울립니다.'
      }
    }
  ],

  // Parking Approach 360 scene hotspot cards.
  parking: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/3dspaces/parking.png',
      en: {
        trigger: 'Arrival',
        title: 'First Step Into the Coast',
        body: 'For many visitors, this is where the experience begins. The design challenge is to make the transition from parking to coastline feel welcoming instead of purely functional.'
      },
      ko: {
        trigger: '도착',
        title: '해안으로 들어가는 첫 지점',
        body: '많은 방문자에게 이곳은 경험이 시작되는 장소입니다. 주차장에서 해안으로 넘어가는 순간이 단순한 이동이 아니라 환영받는 느낌이 되도록 만드는 것이 디자인의 과제입니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/parking.png',
      en: {
        trigger: 'Wayfinding',
        title: 'Clear Route, Less Friction',
        body: 'Because access is still car-heavy, this node should reduce confusion. Simple signage, route markers, and a visible coastal map can help visitors understand where to go before they even reach the promenade.'
      },
      ko: {
        trigger: '길찾기',
        title: '명확한 동선, 낮은 진입 장벽',
        body: '현재 접근은 자동차 중심이기 때문에 이 지점에서는 혼란을 줄이는 것이 중요합니다. 간단한 안내판, 동선 표시, 눈에 잘 보이는 해안 지도는 방문자가 산책로에 도착하기 전부터 방향을 이해하도록 돕습니다.'
      }
    },
    {
      yaw: 1.18,
      pitch: 0.0,
      image: 'assets/images/3dspaces/parking.png',
      en: {
        trigger: 'Insight',
        title: 'Fixing the Weakest Moment',
        body: 'The project is not only about beautiful waterfront scenes. It also has to solve the less attractive moments, like arrival, parking pressure, and uncertainty. A better first impression makes the rest of the route easier to enjoy.'
      },
      ko: {
        trigger: '인사이트',
        title: '가장 약한 순간을 개선하기',
        body: '이 프로젝트는 아름다운 해안 장면만 다루는 것이 아닙니다. 도착, 주차 부담, 길을 찾는 불확실함처럼 덜 매력적인 순간도 개선해야 합니다. 첫인상이 좋아지면 이후 동선 전체를 더 쉽게 즐길 수 있습니다.'
      }
    }
  ],

  // Slow Cafe 360 scene hotspot cards.
  cafe: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/3dspaces/cafe.png',
      en: {
        trigger: 'Pause',
        title: 'Crocat House Pause',
        body: 'Crocat House becomes more than a cafe when it is connected to the walking route. It can work as a warm social anchor where visitors begin, end, or extend their coastal visit.'
      },
      ko: {
        trigger: '휴식',
        title: '크로캣 하우스의 쉼',
        body: '크로캣 하우스는 산책 동선과 연결될 때 단순한 카페 이상의 역할을 합니다. 방문자가 해안 방문을 시작하거나 마무리하고, 더 오래 머무는 따뜻한 사회적 거점이 될 수 있습니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/cafe.png',
      en: {
        trigger: 'Coffee',
        title: 'Morning Route Reward',
        body: 'After a phone-free jog or power walk, coffee becomes a small reward. This makes the route feel complete: movement first, then stretching, conversation, and a drink by the water.'
      },
      ko: {
        trigger: '커피',
        title: '아침 루트의 보상',
        body: '휴대폰 없는 조깅이나 파워 워킹이 끝난 뒤 커피는 작은 보상이 됩니다. 먼저 움직이고, 그다음 스트레칭과 대화, 물가의 음료로 이어지면서 동선이 하나의 완성된 경험처럼 느껴집니다.'
      }
    },
    {
      yaw: 1.32,
      pitch: 0.02,
      image: 'assets/images/3dspaces/cafe.png',
      en: {
        trigger: 'Identity',
        title: 'Local Character, Not Chain Branding',
        body: 'The cafe can help the project avoid feeling generic. Its local mascot, small menu rituals, and waterfront position give Manseok-Hwasu a friendlier identity than a standard public walkway.'
      },
      ko: {
        trigger: '정체성',
        title: '프랜차이즈가 아닌 지역 캐릭터',
        body: '카페는 프로젝트가 흔한 공공 산책로처럼 보이는 것을 막아줍니다. 지역 마스코트, 작은 메뉴 경험, 해안가 위치는 만석·화수에 더 친근한 정체성을 부여합니다.'
      }
    }
  ],

  // Rotating Art Gallery 360 scene hotspot cards.
  gallery: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/discover/art-gallery.webp',
      en: {
        trigger: 'Gallery',
        title: 'Rotating Local Art Wall',
        body: 'This small gallery point gives local creatives a visible place inside the coastal route. Instead of treating art as decoration, the wall becomes a changing record of the neighborhood.'
      },
      ko: {
        trigger: '전시',
        title: '지역 작가 순환 전시 월',
        body: '이 작은 갤러리 지점은 지역 창작자들이 해안 동선 안에서 보일 수 있는 장소를 제공합니다. 예술을 단순한 장식으로 두지 않고, 동네의 변화하는 기록으로 활용합니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/gallery.png',
      en: {
        trigger: 'Season',
        title: 'A Reason to Return',
        body: 'The exhibition can refresh with each season: spring reading posters, summer coastal photography, autumn Cat Island stories, and winter poetry. This gives visitors a reason to come back, not just pass through once.'
      },
      ko: {
        trigger: '시즌',
        title: '다시 방문할 이유',
        body: '전시는 계절마다 바뀔 수 있습니다. 봄에는 독서 포스터, 여름에는 해안 사진, 가을에는 묘도 이야기, 겨울에는 시와 짧은 글을 소개할 수 있습니다. 이는 방문자가 한 번 지나가는 것이 아니라 다시 오게 만드는 이유가 됩니다.'
      }
    },
    {
      yaw: 1.24,
      pitch: -0.01,
      image: 'assets/images/3dspaces/gallery.png',
      en: {
        trigger: 'Creative',
        title: 'Supporting Local Makers',
        body: 'This node can also connect to small art markets, workshops, or the Sunny Side Up style community exhibition model. The coast becomes a platform for local creative presence rather than only a scenic backdrop.'
      },
      ko: {
        trigger: '창작',
        title: '지역 창작자 지원',
        body: '이 지점은 작은 아트마켓, 워크숍, 써니사이드업 방식의 커뮤니티 전시 모델과도 연결될 수 있습니다. 해안은 단순한 배경이 아니라 지역 창작자들이 드러나는 플랫폼이 됩니다.'
      }
    }
  ],

  // Beachfront Benches 360 scene hotspot cards.
  beachfront: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/seasonal/summer.webp',
      en: {
        trigger: 'View',
        title: 'High Tide Benchline',
        body: 'At high tide, the water comes visually closer and the benches feel more immersive. This is one of the simplest but most powerful moments in the route: sitting still while the sea changes the mood around you.'
      },
      ko: {
        trigger: '전망',
        title: '만조의 벤치 라인',
        body: '만조 때는 물이 시각적으로 더 가까워지고 벤치 공간이 더 몰입감 있게 느껴집니다. 가만히 앉아 있는 동안 바다가 주변 분위기를 바꾸는, 단순하지만 강력한 순간입니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/beachfront_benches.png',
      en: {
        trigger: 'Rest',
        title: 'Designed for Doing Nothing',
        body: 'Not every activation needs a program. Some spaces should protect the right to do nothing: watch sunlight on the water, listen to the port, or sit with a book without being rushed.'
      },
      ko: {
        trigger: '휴식',
        title: '아무것도 하지 않기 위한 디자인',
        body: '모든 활성화가 프로그램일 필요는 없습니다. 어떤 공간은 아무것도 하지 않을 권리를 지켜야 합니다. 물 위의 햇빛을 보고, 항구 소리를 듣고, 책과 함께 서두르지 않고 앉아 있을 수 있어야 합니다.'
      }
    },
    {
      yaw: 1.3,
      pitch: 0.02,
      image: 'assets/images/3dspaces/beachfront_benches.png',
      en: {
        trigger: 'Detox',
        title: 'Phone-Free Sunset Seat',
        body: 'This bench line can become part of the digital detox identity. Visitors are encouraged to put their phones away for a few minutes and experience the coastline through sound, light, and air instead of a screen.'
      },
      ko: {
        trigger: '디톡스',
        title: '휴대폰 없는 노을 좌석',
        body: '이 벤치 라인은 디지털 디톡스 정체성의 일부가 될 수 있습니다. 방문자는 잠시 휴대폰을 내려놓고 화면이 아니라 소리, 빛, 공기로 해안을 경험하도록 유도됩니다.'
      }
    }
  ],

  // Tidal Stage 360 scene hotspot cards.
  tidalstage: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/3dspaces/tidalstage_high.png',
      en: {
        trigger: 'Tide',
        title: 'Tidal Stage',
        body: 'This point turns the tide into a visible event. As the water level changes, the same deck can feel like a quiet observatory, a performance edge, or a reflective sunset platform.'
      },
      ko: {
        trigger: '물때',
        title: '타이달 스테이지',
        body: '이 지점은 조수의 변화를 하나의 보이는 이벤트로 만듭니다. 수위가 바뀌면서 같은 데크가 조용한 전망대, 작은 공연 경계, 사색적인 노을 플랫폼처럼 달라질 수 있습니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/tidalstage_high.png',
      en: {
        trigger: 'Info',
        title: 'Why Tide Matters Here',
        body: 'Manseok-Hwasu is not a static park. The waterline, port light, and sea breeze change the experience throughout the day. Showing tide information helps visitors choose when the route will feel most alive.'
      },
      ko: {
        trigger: '정보',
        title: '이곳에서 물때가 중요한 이유',
        body: '만석·화수는 고정된 공원이 아닙니다. 수면 높이, 항구의 빛, 바닷바람이 하루 동안 경험을 계속 바꿉니다. 물때 정보를 보여주면 방문자가 가장 생동감 있는 시간을 선택할 수 있습니다.'
      }
    },
    {
      yaw: 1.25,
      pitch: -0.03,
      image: 'assets/images/3dspaces/tidalstage_high.png',
      en: {
        trigger: 'Event',
        title: 'Small Performances by the Water',
        body: 'This stage does not need heavy infrastructure. It can host poetry readings, acoustic sets, tide talks, or final sharing sessions after photography walks. The sea becomes the backdrop and the timer.'
      },
      ko: {
        trigger: '이벤트',
        title: '물가의 작은 공연',
        body: '이 스테이지에는 큰 시설이 필요하지 않습니다. 시 낭독, 어쿠스틱 공연, 조수 이야기, 사진 워크숍 후 공유 세션을 열 수 있습니다. 바다는 배경이자 시간의 기준이 됩니다.'
      }
    }
  ],

  // Reading Shore 360 scene hotspot cards.
  readingshore: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/events/readingevent.webp',
      en: {
        trigger: 'Reading',
        title: 'Reading Shore',
        body: 'Reading Shore is the intellectual anchor of the project. It gives the coast a clear reason to visit: not only to look at the sea, but to spend meaningful time with books, ideas, and other readers.'
      },
      ko: {
        trigger: '독서',
        title: '리딩 쇼어',
        body: '리딩 쇼어는 이 프로젝트의 지적 중심 공간입니다. 해안을 단순히 바라보는 장소가 아니라 책, 생각, 다른 독자들과 의미 있는 시간을 보내는 방문 이유로 만듭니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/readingshore.png',
      en: {
        trigger: 'Program',
        title: 'Bookable Seats and Weekly Themes',
        body: 'This area can connect directly to the website: reserve a reading seat, check this week’s theme, join a book club, or leave a short shelf note for the next visitor.'
      },
      ko: {
        trigger: '프로그램',
        title: '예약 좌석과 주간 테마',
        body: '이 공간은 웹사이트와 직접 연결될 수 있습니다. 독서 좌석 예약, 이번 주 테마 확인, 북클럽 참여, 다음 방문자를 위한 짧은 책장 메모 남기기가 가능합니다.'
      }
    },
    {
      yaw: 1.34,
      pitch: 0.01,
      image: 'assets/images/3dspaces/readingshore.png',
      en: {
        trigger: 'Club',
        title: 'From Quiet Reading to Debate',
        body: 'Some weeks can stay silent and meditative. Others can become active, like the Han Kang Book Club, where readers bring passages, compare interpretations, and debate under the open sky.'
      },
      ko: {
        trigger: '북클럽',
        title: '조용한 독서에서 토론까지',
        body: '어떤 주는 조용하고 명상적인 독서 시간으로 운영되고, 어떤 주는 한강 작가 북클럽처럼 활발한 토론으로 바뀔 수 있습니다. 독자들은 문장을 가져오고, 해석을 비교하며, 열린 하늘 아래 토론합니다.'
      }
    }
  ],

  // Neighbor Path 360 scene hotspot cards.
  neighborpath: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/discover/morning_circuit.webp',
      en: {
        trigger: 'Path',
        title: 'Morning Circuit',
        body: 'This path links the project back to everyday life. It is where residents, workers, and visitors can use the coast casually: a brisk walk before work, a slow route after lunch, or a quiet reset after sunset.'
      },
      ko: {
        trigger: '길',
        title: '모닝 서킷',
        body: '이 길은 프로젝트를 일상으로 다시 연결합니다. 주민, 직장인, 방문자가 출근 전 빠른 산책, 점심 후 느린 산책, 해질 무렵 조용한 리셋처럼 해안을 자연스럽게 사용할 수 있는 구간입니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/neighborpath.jpg',
      en: {
        trigger: 'Health',
        title: 'A Route for Walkers Too',
        body: 'The route should not only serve athletic runners. Power walkers, older visitors, beginners, and people looking for light movement need clear distance markers, rest points, and a rhythm that feels welcoming.'
      },
      ko: {
        trigger: '건강',
        title: '걷는 사람을 위한 루트',
        body: '이 루트는 운동을 잘하는 러너만을 위한 공간이 아니어야 합니다. 파워 워커, 고령 방문자, 초보자, 가벼운 움직임을 원하는 사람들을 위해 거리 표시, 휴식 지점, 편안한 리듬이 필요합니다.'
      }
    },
    {
      yaw: 1.22,
      pitch: -0.01,
      image: 'assets/images/3dspaces/neighborpath.jpg',
      en: {
        trigger: 'Connection',
        title: 'Making the Coast Feel Close',
        body: 'The strongest version of Manseok-Hwasu is not a destination you visit once. It is a route that slowly becomes familiar, where the coast feels close enough to become part of the week.'
      },
      ko: {
        trigger: '연결',
        title: '해안을 가까운 장소로 만들기',
        body: '만석·화수의 가장 강한 형태는 한 번 방문하는 목적지가 아닙니다. 점점 익숙해지는 동선이며, 해안이 일주일의 일부가 될 만큼 가까운 장소로 느껴지는 것입니다.'
      }
    }
  ],

  // Cat Island Memory 360 scene hotspot cards.
  catisland: [
    {
      yaw: -0.42,
      pitch: -0.05,
      image: 'assets/images/discover/heritage_stop.webp',
      en: {
        trigger: 'Memory',
        title: 'Cat Island Memory',
        body: 'This stop recalls the lost island identity and the fishing culture that shaped the shore. It gives the route a layer of memory instead of treating the coastline as empty scenery.'
      },
      ko: {
        trigger: '기억',
        title: '묘도의 기억',
        body: '이 지점은 사라진 섬의 정체성과 이 해안을 형성한 어업 문화를 떠올리게 합니다. 해안을 빈 풍경으로 두지 않고 기억의 층을 부여합니다.'
      }
    },
    {
      yaw: 0.72,
      pitch: 0.08,
      image: 'assets/images/3dspaces/catisland.png',
      en: {
        trigger: 'Story',
        title: 'Fish-Tailed Cats and Local Myth',
        body: 'The cat motif can become a playful way to introduce local history. Small illustrated cats, fish-tail details, or hidden trail markers can make heritage feel approachable instead of heavy.'
      },
      ko: {
        trigger: '이야기',
        title: '물고기 꼬리 고양이와 지역 이야기',
        body: '고양이 모티프는 지역 역사를 재미있게 소개하는 장치가 될 수 있습니다. 작은 일러스트 고양이, 물고기 꼬리 디테일, 숨은 길 표시를 통해 역사 정보를 무겁지 않게 전달할 수 있습니다.'
      }
    },
    {
      yaw: 1.31,
      pitch: 0.02,
      image: 'assets/images/3dspaces/catisland.png',
      en: {
        trigger: 'Discovery',
        title: 'A Trail That Rewards Attention',
        body: 'This node can encourage visitors to look closer. Instead of one big monument, the story can unfold through small clues: plaques, QR stories, object markers, and seasonal Cat Island storytelling walks.'
      },
      ko: {
        trigger: '발견',
        title: '자세히 볼수록 보이는 길',
        body: '이 지점은 방문자가 더 자세히 보도록 유도할 수 있습니다. 하나의 큰 기념물보다 작은 단서들, 안내판, QR 이야기, 오브젝트 마커, 계절별 묘도 스토리텔링 산책을 통해 이야기가 펼쳐질 수 있습니다.'
      }
    }
  ]
};

  const developmentText = {
    en: 'This area is currently under development. Preview image shown for now.',
    ko: '이 구역은 현재 준비 중입니다. 지금은 임시 미리보기 이미지를 보여드립니다.'
  };

  const isMobileTour = () => window.matchMedia('(max-width: 640px)').matches;

  const getCurrentLang = () => document.documentElement.lang || localStorage.getItem('mh-lang') || 'en';

  const getPoint = (id) => {
    const dict = window.i18n?.dict;
    const point = dict?.discover?.points?.[id];
    if (point) return point;

    const fallbackTitle = String(id || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());

    return {
      title: fallbackTitle,
      description: 'Preview this coastal node, then step into the matching 360 scene.'
    };
  };

  const syncViewerCopy = (id) => {
    const point = getPoint(id);
    if (!point) return;
    if (viewerTitle) viewerTitle.textContent = point.title;
    if (viewerDesc) viewerDesc.textContent = point.description;
    if (viewerNote) viewerNote.textContent = developmentText[getCurrentLang().startsWith('ko') ? 'ko' : 'en'];
  };

  const loadMarzipano = () => {
    if (window.Marzipano) return Promise.resolve(window.Marzipano);
    if (marzipanoLoad) return marzipanoLoad;

    marzipanoLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MARZIPANO_URL;
      script.async = true;
      script.onload = () => window.Marzipano ? resolve(window.Marzipano) : reject(new Error('Marzipano did not initialize.'));
      script.onerror = () => reject(new Error('Marzipano could not be loaded.'));
      document.head.appendChild(script);
    });

    return marzipanoLoad;
  };

  const preloadImage = (src) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  const setLoading = (isLoading) => {
    viewerLayer.classList.toggle('is-loading', isLoading);
    if (viewerStatus) viewerStatus.textContent = isLoading ? 'Loading 3D space...' : '';
  };

  const setMapFullscreenMode = (isFullscreen) => {
    if (!isMobileTour()) return;
    map.classList.toggle('is-mobile-expanded', isFullscreen);
    map.classList.add('is-expanded');
    document.body.classList.toggle('is-discover-modal', isFullscreen);
    document.dispatchEvent(new CustomEvent('discover:interaction-reset'));
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  const requestTourFullscreen = async (target = map) => {
    try {
      const currentFullscreen = document.fullscreenElement;
      const isMapTarget = target === map;
      const isTargetFullscreen = currentFullscreen && (currentFullscreen === target || currentFullscreen.contains(target));
      const isMapCssFullscreen = isMapTarget && map.classList.contains('is-mobile-expanded');

      if (isTargetFullscreen || isMapCssFullscreen) {
        if (currentFullscreen) await document.exitFullscreen();
        if (isMapTarget) setMapFullscreenMode(false);
        return;
      }
      if (currentFullscreen) await document.exitFullscreen();

      if (isMapTarget) setMapFullscreenMode(true);
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      }
      if (isMobileTour() && screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (error) {
      // Fullscreen and orientation locks are browser/permission dependent.
    }
  };

  const exitTourFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (error) {
      // Ignore fullscreen exit failures.
    }
  };

  const openExpandedTour = () => {
    closeViewer();
    if (!selectedId) clearNodePreview();
    map.classList.remove('is-locked');
    map.classList.add('is-expanded');
    map.classList.remove('is-mobile-expanded');
    document.body.classList.remove('is-discover-modal');
    document.dispatchEvent(new CustomEvent('discover:interaction-reset'));
  };

  const closeExpandedTour = () => {
    closeViewer();
    clearNodePreview();
    selectedId = null;
    document.dispatchEvent(new CustomEvent('discover:hard-reset-view'));
    map.classList.add('is-locked');
    map.classList.remove('is-expanded', 'is-mobile-expanded');
    document.body.classList.remove('is-discover-modal');
    pins.forEach(p => p.classList.remove('is-active'));
    document.dispatchEvent(new CustomEvent('discover:interaction-reset'));
    exitTourFullscreen();
    requestAnimationFrame(() => {
      map.querySelector('[data-tour-enter]')?.focus({ preventScroll: true });
    });
  };

  const showFallbackImage = (imagePath) => {
    fallbackFrame.style.backgroundImage = `url('${imagePath}')`;
    viewerLayer.classList.add('is-fallback');
  };

  const showNodePreview = (id) => {
    const point = getPoint(id);
    const imagePath = pinImages[id] || panoramaSpaces[id]?.image;
    const activePin = Array.from(pins).find(pin => pin.dataset.id === id);
    selectedId = id;
    const isHouseCluster = id === 'house';
    const isHouseDetail = activePin?.dataset.cluster === 'house';

    if (previewImage && imagePath) previewImage.style.backgroundImage = `url('${imagePath}')`;
    if (previewTitle) previewTitle.textContent = point.title;
    if (previewDesc) previewDesc.textContent = point.description;
    if (watchButton) watchButton.disabled = isHouseCluster || !panoramaSpaces[id];

    previewPanel?.classList.add('is-visible');
    map.classList.add('is-node-focused');
    map.classList.toggle('is-house-expanded', isHouseCluster || isHouseDetail);
    pins.forEach(p => p.classList.toggle('is-active', p.dataset.id === id));
    document.dispatchEvent(new CustomEvent('discover:focus-node', { detail: { id } }));
  };

  const clearNodePreview = () => {
    selectedId = null;
    previewPanel?.classList.remove('is-visible');
    map.classList.remove('is-node-focused', 'is-house-expanded');
    pins.forEach(p => p.classList.remove('is-active'));
    document.dispatchEvent(new CustomEvent('discover:reset-view', { detail: { preserveOrientation: true } }));
  };

  const destroyPanorama = () => {
    try {
      activeScene?.destroy?.();
    } catch (error) {
      console.warn('Previous panorama scene could not be destroyed cleanly.', error);
    }

    try {
      panoramaViewer?.destroy?.();
    } catch (error) {
      console.warn('Previous panorama viewer could not be destroyed cleanly.', error);
    }

    activeScene = null;
    panoramaViewer = null;
    viewerFrame.replaceChildren();
  };

  const setSpaceJumpOpen = (isOpen) => {
    spaceJump?.classList.toggle('is-open', isOpen);
    spaceJumpToggle?.setAttribute('aria-expanded', String(isOpen));
  };

  const buildSpaceJumpList = () => {
    if (!spaceJumpPanel) return;
    spaceJumpPanel.innerHTML = '';

    spaceOrder.forEach((id) => {
      const point = getPoint(id);
      if (!point) return;

      const button = document.createElement('button');
      button.className = 'discover__space-jump-item';
      button.type = 'button';
      button.dataset.spaceId = id;
      button.classList.toggle('is-active', id === activeId);

      const preview = document.createElement('span');
      preview.className = 'discover__space-jump-thumb';
      preview.style.backgroundImage = `url('${pinImages[id] || panoramaSpaces[id]?.image}')`;

      const label = document.createElement('span');
      label.className = 'discover__space-jump-label';
      label.textContent = point.title;

      button.append(preview, label);
      spaceJumpPanel.appendChild(button);
    });
  };

  const getLocalizedHotspotText = (spot, point, imagePath) => {
    const lang = getCurrentLang().startsWith('ko') ? 'ko' : 'en';
    const copy = spot?.[lang] || spot?.en || {};
    return {
      trigger: copy.trigger || 'Details',
      title: copy.title || point.title,
      body: copy.body || point.description,
      image: copy.image || spot.image || imagePath
    };
  };

  const closeOpenHotspots = (exceptElement) => {
    viewerFrame.querySelectorAll('.discover-hotspot.is-open').forEach((node) => {
      if (node !== exceptElement) {
        node.classList.remove('is-open');
        node.style.removeProperty('--hotspot-card-screen-x');
        node.style.removeProperty('--hotspot-card-screen-y');
      }
    });
  };

  const closeHotspotOverlay = () => {
    hotspotOverlay.hidden = true;
    hotspotOverlay.classList.remove('is-visible');
    viewerFrame.querySelectorAll('.discover-hotspot.is-open').forEach((node) => {
      node.classList.remove('is-open');
      node.style.removeProperty('--hotspot-card-screen-x');
      node.style.removeProperty('--hotspot-card-screen-y');
    });
  };

  const showHotspotOverlay = (hotspot) => {
    const copy = hotspot?._hotspotCopy;
    if (!copy) return;
    if (hotspotOverlayImage) hotspotOverlayImage.style.backgroundImage = `url('${copy.image}')`;
    if (hotspotOverlayTitle) hotspotOverlayTitle.textContent = copy.title;
    if (hotspotOverlayBody) hotspotOverlayBody.textContent = copy.body;
    hotspotOverlay.hidden = false;
    window.requestAnimationFrame(() => hotspotOverlay.classList.add('is-visible'));
  };

  const centerHotspotCard = (hotspot) => {
    if (!hotspot) return;
    const rect = viewerLayer.getBoundingClientRect();
    hotspot.style.setProperty('--hotspot-card-screen-x', `${Math.round(rect.left + rect.width / 2)}px`);
    hotspot.style.setProperty('--hotspot-card-screen-y', `${Math.round(rect.top + rect.height * 0.52)}px`);
  };

  const addSceneHotspots = (scene, id, space) => {
    const point = getPoint(id);
    if (!point || !scene?.hotspotContainer) return;

    const hotspots = panoramaHotspots[id] || [];

    hotspots.forEach((spot) => {
      const copy = getLocalizedHotspotText(spot, point, pinImages[id] || space.image);
      const hotspot = document.createElement('div');
      hotspot.className = 'discover-hotspot';
      hotspot.dataset.hotspotYaw = String(spot.yaw);
      hotspot.dataset.hotspotPitch = String(spot.pitch);
      hotspot._hotspotCopy = copy;

      const button = document.createElement('button');
      button.className = 'discover-hotspot__trigger';
      button.type = 'button';
      button.textContent = copy.trigger;
      button.setAttribute('aria-label', `${copy.trigger}: ${point.title}`);
      button.dataset.hotspotTrigger = 'true';

      const card = document.createElement('article');
      card.className = 'discover-hotspot__card';

      const image = document.createElement('span');
      image.className = 'discover-hotspot__image';
      image.style.backgroundImage = `url('${copy.image}')`;

      const title = document.createElement('strong');
      title.textContent = copy.title;

      const body = document.createElement('span');
      body.textContent = copy.body;

      const close = document.createElement('button');
      close.className = 'discover-hotspot__close';
      close.type = 'button';
      close.dataset.hotspotClose = 'true';
      close.setAttribute('aria-label', 'Close hotspot card');
      close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

      card.append(close, image, title, body);
      hotspot.append(button, card);

      card.addEventListener('click', (event) => event.stopPropagation());
      scene.hotspotContainer().createHotspot(hotspot, { yaw: spot.yaw, pitch: spot.pitch });
    });
  };

  const openViewer = async (id) => {
    const space = panoramaSpaces[id] || panoramaSpaces.lounge;
    const requestId = viewerRequest + 1;
    viewerRequest = requestId;
    destroyPanorama();
    closeHotspotOverlay();
    activeId = id;
    syncViewerCopy(id);
    pins.forEach(p => p.classList.toggle('is-active', p.dataset.id === id));
    map.classList.add('is-viewer-open');
    viewerLayer.classList.add('is-visible');
    viewerLayer.setAttribute('aria-hidden', 'false');
    viewerLayer.classList.toggle('has-development-note', Boolean(space.fallback));
    if (viewerNote) viewerNote.hidden = !space.fallback;
    showFallbackImage(space.image);
    buildSpaceJumpList();
    setLoading(true);

    try {
      const [Marzipano, image] = await Promise.all([loadMarzipano(), preloadImage(space.image)]);
      if (requestId !== viewerRequest) return;

      viewerLayer.classList.remove('is-fallback');
      panoramaViewer = new Marzipano.Viewer(viewerFrame, {
        controls: { mouseViewMode: 'drag' }
      });

      const source = Marzipano.ImageUrlSource.fromString(space.image);
      const width = Math.max(2048, image.naturalWidth || 4096);
      const geometry = new Marzipano.EquirectGeometry([{ width }]);
      const limiter = Marzipano.RectilinearView.limit.traditional(1536, Math.PI * 0.72);
      const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: Math.PI / 2.25 }, limiter);
      activeScene = panoramaViewer.createScene({ source, geometry, view, pinFirstLevel: true });
      addSceneHotspots(activeScene, id, space);
      activeScene.switchTo({ transitionDuration: 360 });
      buildSpaceJumpList();
    } catch (error) {
      if (requestId !== viewerRequest) return;
      console.warn('Marzipano panorama unavailable. Showing fallback image.', error);
      showFallbackImage(space.image);
    } finally {
      if (requestId === viewerRequest) setLoading(false);
    }
  };

  async function closeViewer() {
    viewerRequest += 1;
    const fullElement = document.fullscreenElement;
    if (fullElement && (fullElement === viewerLayer || viewerLayer.contains(fullElement))) {
      await exitTourFullscreen();
    }

    destroyPanorama();
    map.classList.remove('is-viewer-open');
    viewerLayer.classList.remove('is-visible', 'is-loading');
    viewerLayer.setAttribute('aria-hidden', 'true');
    activeScene = null;
    activeId = null;
    setSpaceJumpOpen(false);
    pins.forEach(p => p.classList.toggle('is-active', Boolean(selectedId) && p.dataset.id === selectedId));
  }

  pins.forEach(pin => {
    pin.addEventListener('pointerdown', (event) => event.stopPropagation());
    pin.addEventListener('pointerup', (event) => event.stopPropagation());
    pin.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showNodePreview(pin.dataset.id);
    });
  });

  watchButton?.addEventListener('click', () => {
    if (selectedId) openViewer(selectedId);
  });

  document.addEventListener('discover:open-space', (event) => {
    const id = event.detail?.id;
    if (!id || !panoramaSpaces[id]) return;

    const openSelectedSpace = () => {
      showNodePreview(id);
      window.setTimeout(() => openViewer(id), 220);
    };

    if (map.classList.contains('is-locked')) {
      document.addEventListener('discover:tour-activated', () => {
        window.setTimeout(openSelectedSpace, 180);
      }, { once: true });
      document.dispatchEvent(new CustomEvent('discover:activate-tour'));
      return;
    }

    openExpandedTour();
    openSelectedSpace();
  });

  clearNodeButtons?.forEach(button => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearNodePreview();
    });
  });

  const handleViewerChromeClick = (event) => {
    const overlayClose = event.target.closest('[data-hotspot-overlay-close]');
    if (overlayClose) {
      event.preventDefault();
      event.stopPropagation();
      closeHotspotOverlay();
      return;
    }

    const hotspotClose = event.target.closest('[data-hotspot-close]');
    if (hotspotClose) {
      event.preventDefault();
      event.stopPropagation();
      closeHotspotOverlay();
      return;
    }

    const hotspotTrigger = event.target.closest('[data-hotspot-trigger]');
    if (hotspotTrigger) {
      event.preventDefault();
      event.stopPropagation();

      const hotspot = hotspotTrigger.closest('.discover-hotspot');
      if (!hotspot) return;

      const nextOpen = !hotspot.classList.contains('is-open');
      closeOpenHotspots(hotspot);
      hotspot.classList.toggle('is-open', nextOpen);
      if (nextOpen) {
        centerHotspotCard(hotspot);
        showHotspotOverlay(hotspot);
        activeScene?.lookTo?.({
          yaw: Number(hotspot.dataset.hotspotYaw) || 0,
          pitch: Number(hotspot.dataset.hotspotPitch) || 0,
          fov: Math.PI / 2.65
        }, { transitionDuration: 420 });
      } else {
        closeHotspotOverlay();
        hotspot.style.removeProperty('--hotspot-card-screen-x');
        hotspot.style.removeProperty('--hotspot-card-screen-y');
      }
      return;
    }

    const closeButton = event.target.closest('[data-viewer-close]');
    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      closeViewer();
      return;
    }

    const fullscreenButton = event.target.closest('[data-viewer-fullscreen]');
    if (fullscreenButton) {
      event.preventDefault();
      event.stopPropagation();
      requestTourFullscreen(viewerLayer);
      return;
    }

    const jumpToggle = event.target.closest('[data-space-jump-toggle]');
    if (jumpToggle) {
      event.preventDefault();
      event.stopPropagation();
      setSpaceJumpOpen(!spaceJump?.classList.contains('is-open'));
      return;
    }

    const jumpItem = event.target.closest('[data-space-id]');
    if (jumpItem) {
      event.preventDefault();
      event.stopPropagation();
      setSpaceJumpOpen(false);
      openViewer(jumpItem.dataset.spaceId);
    }
  };

  const stopViewerChromePointer = (event) => {
    if (event.target.closest('[data-viewer-close], [data-viewer-fullscreen], [data-space-jump], .discover-hotspot, .discover-hotspot-overlay')) {
      event.stopPropagation();
    }
  };

  viewerLayer.addEventListener('pointerdown', stopViewerChromePointer, true);
  viewerLayer.addEventListener('pointerup', stopViewerChromePointer, true);
  viewerLayer.addEventListener('click', handleViewerChromeClick, true);
  window.addEventListener('resize', () => {
    viewerFrame.querySelectorAll('.discover-hotspot.is-open').forEach(centerHotspotCard);
  });

  const handleStageControlClick = (event) => {
    const enterButton = event.target.closest('[data-tour-enter]');
    if (enterButton) {
      event.preventDefault();
      event.stopPropagation();
      document.dispatchEvent(new CustomEvent('discover:activate-tour'));
      return;
    }

    const fullscreenButton = event.target.closest('[data-tour-fullscreen]');
    if (fullscreenButton) {
      event.preventDefault();
      event.stopPropagation();
      requestTourFullscreen(map);
      return;
    }

    const closeButton = event.target.closest('[data-tour-close]');
    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      closeExpandedTour();
    }
  };

  const stopStageControlPointer = (event) => {
    if (event.target.closest('[data-tour-enter], [data-tour-fullscreen], [data-tour-close]')) {
      event.stopPropagation();
    }
  };

  map.addEventListener('pointerdown', stopStageControlPointer, true);
  map.addEventListener('pointerup', stopStageControlPointer, true);
  map.addEventListener('click', handleStageControlClick, true);

  spaceJump?.addEventListener('click', (event) => event.stopPropagation());

  viewerLayer.addEventListener('click', () => {
    closeOpenHotspots();
    setSpaceJumpOpen(false);
  });

  document.addEventListener('discover:tour-activated', openExpandedTour);

  document.querySelectorAll('.nav__link[data-target]').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.target !== 'discover' && !map.classList.contains('is-locked')) {
        closeExpandedTour();
      }
    });
  });

  const discoverSection = map.closest('.discover');
  if (discoverSection && 'IntersectionObserver' in window) {
    const discoverObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const isFullscreenVisit = document.fullscreenElement || map.classList.contains('is-mobile-expanded');
      if (!entry?.isIntersecting && !isFullscreenVisit && !map.classList.contains('is-locked')) {
        closeExpandedTour();
      }
    }, { threshold: 0.08 });
    discoverObserver.observe(discoverSection);
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && map.classList.contains('is-mobile-expanded')) {
      setMapFullscreenMode(false);
    }
  });

  document.addEventListener('i18n:applied', () => {
    if (activeId) syncViewerCopy(activeId);
    if (selectedId && !activeId) showNodePreview(selectedId);
  });
}

/* ─── Tide Status ─────────────────────────────────── */
function initTideStatus() {
  const root = document.querySelector('[data-tide-status]');
  if (!root) return;

  const stageEl = root.querySelector('[data-tide-stage]');
  const labelEl = root.querySelector('[data-tide-label]');
  const detailEl = root.querySelector('[data-tide-detail]');
  const miniBadges = document.querySelectorAll('[data-tide-mini]');

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(document.documentElement.lang?.startsWith('ko') ? 'ko-KR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const publish = (payload) => {
    const fallbackPreviewSources = new Set([
      'preview_pending',
      'static_pending',
      'missing_api_key',
      'missing_kv_binding',
      'empty_cache',
      'stormglass_error'
    ]);
    const rawStage = payload?.stage || 'unknown';
    const stage = rawStage === 'unknown' && fallbackPreviewSources.has(payload?.source) ? 'high' : rawStage;
    const rawDisplayStage = payload?.displayStage || stage;
    const displayStage = rawDisplayStage === 'unknown' && stage !== 'unknown' ? stage : rawDisplayStage;
    const next = payload?.nextExtreme;
    const previous = payload?.previousExtreme;
    const lang = document.documentElement.lang?.startsWith('ko') ? 'ko' : 'en';

    const stageLabel = {
      en: {
        high: 'High tide',
        low: 'Low tide',
        rising: 'Rising tide',
        falling: 'Falling tide',
        unknown: 'Tide pending'
      },
      ko: {
        high: '만조',
        low: '간조',
        rising: '밀물',
        falling: '썰물',
        unknown: '조위 확인 중'
      }
    };

    const moodText = {
      en: {
        high: 'Perfect time to go',
        low: 'Wide mudflat mood',
        rising: 'Sea is coming in',
        falling: 'Quiet shore window',
        unknown: 'High-tide preview'
      },
      ko: {
        high: '방문하기 좋은 물때',
        low: '넓은 갯벌 분위기',
        rising: '물이 들어오는 중',
        falling: '조용한 해안 시간',
        unknown: '만조 미리보기'
      }
    };

    const detailText = {
      en: {
        high: 'Full water, brighter reflections, and a good coast-walk mood.',
        low: 'The shore opens up with a calmer mudflat atmosphere.',
        rising: 'Nice for arriving now and watching the water return.',
        falling: 'A softer, slower edge for looking across the flats.',
        unknown: 'Production tide will update this automatically.'
      },
      ko: {
        high: '물이 차 있어 반사가 밝고 산책하기 좋은 분위기입니다.',
        low: '해안이 넓게 열리고 차분한 갯벌 분위기가 살아납니다.',
        rising: '지금 도착하면 물이 들어오는 장면을 보기 좋습니다.',
        falling: '갯벌 쪽으로 천천히 시선이 열리는 시간입니다.',
        unknown: '운영 환경에서 조위 정보가 자동으로 갱신됩니다.'
      }
    };

    if (labelEl) labelEl.textContent = stageLabel[lang][displayStage] || stageLabel[lang].unknown;
    if (stageEl) stageEl.textContent = moodText[lang][displayStage] || moodText[lang].unknown;
    miniBadges.forEach(badge => {
      const badgeStage = displayStage === 'unknown' ? 'preview' : displayStage;
      badge.dataset.tideVisualStage = badgeStage;
      const text = displayStage === 'unknown'
        ? (lang === 'ko' ? '조위 미리보기' : 'Tide preview')
        : stageLabel[lang][displayStage] || stageLabel[lang].unknown;
      const miniLabel = badge.querySelector('[data-tide-mini-label]');
      if (miniLabel) miniLabel.textContent = text;
    });
    if (detailEl) {
      const nextTime = formatTime(next?.time);
      const previousTime = formatTime(previous?.time);
      detailEl.textContent = payload?.source === 'preview_pending' || payload?.source === 'static_pending'
        ? detailText[lang].unknown
        : nextTime
        ? `${detailText[lang][displayStage] || detailText[lang].unknown} Next ${next?.type === 'low' ? 'low' : 'high'} tide around ${nextTime}.`
        : previousTime
          ? `${detailText[lang][displayStage] || detailText[lang].unknown} Last tide marker was around ${previousTime}.`
          : detailText[lang][displayStage] || detailText[lang].unknown;
    }

    root.dataset.tideStage = stage;
    document.dispatchEvent(new CustomEvent('mh:tide-updated', { detail: { ...(payload || {}), stage, displayStage } }));
  };

  fetch('/api/tide', { headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : Promise.reject(new Error(`Tide status ${response.status}`)))
    .then(publish)
    .catch(() => publish({ stage: 'high', displayStage: 'high', source: 'static_pending' }));
}

/* ─── Current Reading Themes ──────────────────────── */
const currentEventsState = {
  activeIndex: 0,
  view: new Date(2026, 4, 1),
  activeEventId: null
};

function initCurrentEvents() {
  const root = document.querySelector('.current');
  const events = Array.isArray(window.MH_READING_EVENTS) ? window.MH_READING_EVENTS : [];
  if (!root || !events.length) return;

  const today = new Date();
  const upcomingIndex = events.findIndex(event => parseEventDate(event.end) >= startOfDay(today));
  currentEventsState.activeIndex = upcomingIndex >= 0 ? upcomingIndex : 0;
  currentEventsState.view = new Date(parseEventDate(events[currentEventsState.activeIndex].start).getFullYear(), parseEventDate(events[currentEventsState.activeIndex].start).getMonth(), 1);

  root.querySelector('[data-current-prev]')?.addEventListener('click', () => {
    currentEventsState.activeIndex = (currentEventsState.activeIndex - 1 + events.length) % events.length;
    const active = events[currentEventsState.activeIndex];
    currentEventsState.view = new Date(parseEventDate(active.start).getFullYear(), parseEventDate(active.start).getMonth(), 1);
    renderCurrentEvents();
  });

  root.querySelector('[data-current-next]')?.addEventListener('click', () => {
    currentEventsState.activeIndex = (currentEventsState.activeIndex + 1) % events.length;
    const active = events[currentEventsState.activeIndex];
    currentEventsState.view = new Date(parseEventDate(active.start).getFullYear(), parseEventDate(active.start).getMonth(), 1);
    renderCurrentEvents();
  });

  root.querySelector('[data-current-cal-prev]')?.addEventListener('click', () => {
    currentEventsState.view = new Date(currentEventsState.view.getFullYear(), currentEventsState.view.getMonth() - 1, 1);
    renderCurrentCalendar();
  });

  root.querySelector('[data-current-cal-next]')?.addEventListener('click', () => {
    currentEventsState.view = new Date(currentEventsState.view.getFullYear(), currentEventsState.view.getMonth() + 1, 1);
    renderCurrentCalendar();
  });

  document.addEventListener('i18n:applied', () => {
    renderCurrentEvents();
    if (currentEventsState.activeEventId) populateEventModal(currentEventsState.activeEventId);
  });

  initEventModal();
  renderCurrentEvents();
}

function renderCurrentEvents() {
  renderCurrentFeature();
  renderCurrentList();
  renderCurrentCalendar();
}

function renderCurrentFeature() {
  const feature = document.querySelector('[data-current-feature]');
  const events = window.MH_READING_EVENTS || [];
  const event = events[currentEventsState.activeIndex];
  if (!feature || !event) return;

  feature.innerHTML = '';
  feature.style.setProperty('--event-accent', event.accent || 'var(--accent)');

  const image = document.createElement('div');
  image.className = 'current__feature-image';
  image.style.backgroundImage = `url('${event.image}')`;

  const body = document.createElement('div');
  body.className = 'current__feature-body';

  const status = document.createElement('span');
  status.className = 'current__status';
  status.textContent = event.status;

  const title = document.createElement('h3');
  title.textContent = localizeEventField(event.title);

  const excerpt = document.createElement('p');
  excerpt.textContent = localizeEventField(event.excerpt);

  const meta = document.createElement('div');
  meta.className = 'current__meta';
  meta.textContent = `${event.category} · ${formatEventRange(event)} · ${event.seats} places`;

  const actions = document.createElement('div');
  actions.className = 'current__actions';

  const details = document.createElement('button');
  details.className = 'btn btn--info';
  details.type = 'button';
  details.textContent = 'Read Details';
  details.addEventListener('click', () => openEventModal(event.id));

  const reserve = document.createElement('button');
  reserve.className = 'btn btn--reserve-flat';
  reserve.type = 'button';
  reserve.textContent = 'Reserve';
  reserve.addEventListener('click', () => openEventModal(event.id, { focusReserve: true }));

  actions.append(details, reserve);
  body.append(status, title, excerpt, meta, actions);
  feature.append(image, body);
}

function renderCurrentList() {
  const list = document.querySelector('[data-current-list]');
  const events = window.MH_READING_EVENTS || [];
  if (!list) return;

  list.innerHTML = '';
  events.forEach((event, index) => {
    const item = document.createElement('button');
    item.className = 'current__list-item';
    item.type = 'button';
    item.classList.toggle('is-active', index === currentEventsState.activeIndex);
    item.style.setProperty('--event-accent', event.accent || 'var(--accent)');

    const date = document.createElement('span');
    date.className = 'current__list-date';
    date.textContent = compactDateRange(event);

    const text = document.createElement('span');
    text.className = 'current__list-text';
    text.innerHTML = `<strong></strong><small></small>`;
    text.querySelector('strong').textContent = localizeEventField(event.title);
    text.querySelector('small').textContent = event.category;

    item.append(date, text);
    item.addEventListener('click', () => {
      currentEventsState.activeIndex = index;
      currentEventsState.view = new Date(parseEventDate(event.start).getFullYear(), parseEventDate(event.start).getMonth(), 1);
      renderCurrentEvents();
    });
    list.appendChild(item);
  });
}

function renderCurrentCalendar() {
  const calendar = document.querySelector('[data-current-calendar]');
  const agenda = document.querySelector('[data-current-agenda]');
  const title = document.querySelector('[data-current-cal-title]');
  const events = window.MH_READING_EVENTS || [];
  if (!calendar || !agenda || !title) return;

  const months = window.i18n?.dict?.reading?.months || ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = window.i18n?.dict?.reading?.weekdays || ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const view = currentEventsState.view;
  const year = view.getFullYear();
  const month = view.getMonth();
  title.textContent = `${months[month]} ${year}`;

  calendar.innerHTML = '';
  weekdays.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'current__cal-dow';
    cell.textContent = day;
    calendar.appendChild(cell);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const cell = document.createElement('span');
    cell.className = 'current__cal-day is-other';
    cell.textContent = daysInPrev - i;
    calendar.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dayEvents = events.filter(event => eventCoversDate(event, date));
    const cell = document.createElement('button');
    cell.className = 'current__cal-day';
    cell.type = 'button';
    cell.textContent = day;
    if (isSameCalendarDay(date, new Date())) cell.classList.add('is-today');
    if (dayEvents.length) {
      cell.classList.add('has-event');
      cell.style.setProperty('--event-accent', dayEvents[0].accent || 'var(--accent)');
      cell.setAttribute('aria-label', `${day}: ${localizeEventField(dayEvents[0].title)}`);
      cell.addEventListener('click', () => openEventModal(dayEvents[0].id));
    }
    calendar.appendChild(cell);
  }

  const totalCells = firstDay + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i += 1) {
    const cell = document.createElement('span');
    cell.className = 'current__cal-day is-other';
    cell.textContent = i;
    calendar.appendChild(cell);
  }

  agenda.innerHTML = '';
  const monthEvents = events.filter(event => eventTouchesMonth(event, year, month));
  monthEvents.forEach(event => {
    const item = document.createElement('button');
    item.className = 'current__agenda-item';
    item.type = 'button';
    item.style.setProperty('--event-accent', event.accent || 'var(--accent)');
    item.innerHTML = '<span></span><strong></strong><small></small>';
    item.querySelector('span').textContent = compactDateRange(event);
    item.querySelector('strong').textContent = localizeEventField(event.title);
    item.querySelector('small').textContent = event.category;
    item.addEventListener('click', () => openEventModal(event.id));
    agenda.appendChild(item);
  });
}

function initEventModal() {
  const modal = document.getElementById('eventModal');
  if (!modal) return;

  modal.querySelectorAll('[data-event-close]').forEach(button => {
    button.addEventListener('click', closeEventModal);
  });

  modal.querySelector('[data-event-comment-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const source = window.MH_READING_EVENTS?.find(item => item.id === currentEventsState.activeEventId);
    if (!source) return;
    const form = event.currentTarget;
    const text = form.elements.comment.value.trim();
    if (!text) return;
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      await postCommunityComment(`event:${source.id}`, text, source.id);
      await loadEventComments(source);
    } catch (error) {
      source.liveComments = [
        { profile: communityState.profile, text, createdAt: new Date().toISOString() },
        ...(source.liveComments || source.comments || [])
      ];
      populateEventComments(source);
    } finally {
      if (button) button.disabled = false;
    }
    form.reset();
    syncEventCommentProfile();
  });

  modal.querySelector('[data-event-reserve-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = modal.querySelector('[data-event-reserve-status]');
    if (status) status.textContent = 'Reservation interest noted for planning. No personal details were stored.';
    trackCommunityEvent('event_reservation_interest', { eventId: currentEventsState.activeEventId || '' });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeEventModal();
  });
}

function openEventModal(id, options = {}) {
  const modal = document.getElementById('eventModal');
  if (!modal) return;
  currentEventsState.activeEventId = id;
  populateEventModal(id);
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  trackCommunityEvent('event_modal_open', { eventId: id });
  if (options.focusReserve) {
    requestAnimationFrame(() => modal.querySelector('[data-event-reserve-form] input')?.focus({ preventScroll: true }));
  }
}

function closeEventModal() {
  const modal = document.getElementById('eventModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  currentEventsState.activeEventId = null;
  document.body.style.overflow = '';
}

function populateEventModal(id) {
  const modal = document.getElementById('eventModal');
  const event = window.MH_READING_EVENTS?.find(item => item.id === id);
  if (!modal || !event) return;

  modal.querySelector('[data-event-image]').style.backgroundImage = `url('${event.image}')`;
  modal.querySelector('[data-event-category]').textContent = event.category;
  modal.querySelector('[data-event-title]').textContent = localizeEventField(event.title);
  modal.querySelector('[data-event-meta]').textContent = `${formatEventRange(event)} · ${event.status} · ${event.seats} places`;

  const body = modal.querySelector('[data-event-body]');
  body.innerHTML = '';
  localizeEventField(event.body).forEach(paragraph => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    body.appendChild(p);
  });

  const schedule = modal.querySelector('[data-event-schedule]');
  schedule.innerHTML = '';
  event.schedule.forEach(item => {
    const row = document.createElement('button');
    row.className = 'event-post__schedule-row';
    row.type = 'button';
    row.innerHTML = '<span></span><strong></strong><small></small>';
    row.querySelector('span').textContent = formatShortDate(item.date);
    row.querySelector('strong').textContent = item.label;
    row.querySelector('small').textContent = item.time;
    row.addEventListener('click', () => {
      const select = modal.querySelector('[data-event-reserve-date]');
      if (select) select.value = item.date;
      modal.querySelector('[data-event-reserve-form] input')?.focus({ preventScroll: true });
    });
    schedule.appendChild(row);
  });

  const reserveSelect = modal.querySelector('[data-event-reserve-date]');
  reserveSelect.innerHTML = '';
  event.schedule.forEach(item => {
    const option = document.createElement('option');
    option.value = item.date;
    option.textContent = `${formatShortDate(item.date)} · ${item.time} · ${item.label}`;
    reserveSelect.appendChild(option);
  });
  const reserveStatus = modal.querySelector('[data-event-reserve-status]');
  if (reserveStatus) reserveStatus.textContent = '';
  syncEventCommentProfile();
  populateEventComments(event);
  loadEventComments(event);
}

function populateEventComments(event) {
  const comments = document.querySelector('[data-event-comments]');
  if (!comments) return;
  comments.innerHTML = '';
  const sourceComments = event.liveComments || event.comments || [];
  if (!sourceComments.length) {
    const empty = document.createElement('div');
    empty.className = 'event-post__comment';
    empty.innerHTML = '<strong></strong><p></p>';
    empty.querySelector('strong').textContent = 'No comments yet';
    empty.querySelector('p').textContent = 'Share the first note for this reading theme.';
    comments.appendChild(empty);
    return;
  }
  sourceComments.forEach(comment => {
    const item = document.createElement('div');
    item.className = 'event-post__comment';
    item.innerHTML = '<strong></strong><p></p>';
    item.querySelector('strong').textContent = comment.profile?.name || comment.name || 'Coast Friend';
    item.querySelector('p').textContent = comment.text;
    comments.appendChild(item);
  });
}

async function loadEventComments(event) {
  if (!event?.id) return;
  try {
    const data = await communityApi(`?action=comments&channel=${encodeURIComponent(`event:${event.id}`)}`);
    if (currentEventsState.activeEventId !== event.id) return;
    event.liveComments = data.comments || [];
    populateEventComments(event);
  } catch (error) {
    event.liveComments = readFallbackComments(`event:${event.id}`);
    populateEventComments(event);
  }
}

function localizeEventField(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return value || '';
  const lang = (document.documentElement.lang || localStorage.getItem('mh-lang') || 'en').startsWith('ko') ? 'ko' : 'en';
  return value[lang] || value.en || '';
}

function parseEventDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameCalendarDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventCoversDate(event, date) {
  const day = startOfDay(date);
  return day >= parseEventDate(event.start) && day <= parseEventDate(event.end);
}

function eventTouchesMonth(event, year, month) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  return parseEventDate(event.start) <= monthEnd && parseEventDate(event.end) >= monthStart;
}

function formatEventRange(event) {
  return `${formatShortDate(event.start)} - ${formatShortDate(event.end)}`;
}

function compactDateRange(event) {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end);
  return `${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
}

function formatShortDate(value) {
  const date = parseEventDate(value);
  const months = window.i18n?.dict?.reading?.months || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/* ─── Calendar ────────────────────────────────────── */
const calendarState = {
  view: new Date(),
  selected: null
};

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function syncNativeBookingDate() {
  const input = document.getElementById('bookingDateNative');
  if (!input || !calendarState.selected) return;
  input.value = formatDateInputValue(calendarState.selected);
}

function initCalendar() {
  const root = document.querySelector('.calendar');
  if (!root) return;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nativeDateInput = document.getElementById('bookingDateNative');
  calendarState.view = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  calendarState.selected = todayStart;

  if (nativeDateInput) {
    nativeDateInput.min = formatDateInputValue(todayStart);
    nativeDateInput.value = formatDateInputValue(todayStart);
    nativeDateInput.addEventListener('change', () => {
      const nextDate = parseDateInputValue(nativeDateInput.value);
      if (!nextDate) return;
      calendarState.selected = nextDate;
      calendarState.view = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
      renderCalendar();
      updateBookingSummary();
    });
  }

  root.querySelector('.calendar__nav--prev')?.addEventListener('click', () => {
    calendarState.view = new Date(calendarState.view.getFullYear(), calendarState.view.getMonth() - 1, 1);
    renderCalendar();
  });
  root.querySelector('.calendar__nav--next')?.addEventListener('click', () => {
    calendarState.view = new Date(calendarState.view.getFullYear(), calendarState.view.getMonth() + 1, 1);
    renderCalendar();
  });

  document.querySelectorAll('.timeslot').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.timeslot').forEach(s => s.classList.remove('is-active'));
      slot.classList.add('is-active');
      updateBookingSummary();
    });
  });

  document.addEventListener('i18n:applied', renderCalendar);
  renderCalendar();
  updateBookingSummary();
}

function renderCalendar() {
  const root = document.querySelector('.calendar');
  if (!root) return;

  const dict = window.i18n?.dict;
  const months = dict?.reading?.months || ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekdays = dict?.reading?.weekdays || ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const view = calendarState.view;
  const year = view.getFullYear();
  const month = view.getMonth();

  const titleEl = root.querySelector('.calendar__title');
  if (titleEl) titleEl.textContent = `${months[month]} ${year}`;

  const grid = root.querySelector('.calendar__grid');
  grid.innerHTML = '';

  // Weekday headers
  weekdays.forEach(d => {
    const el = document.createElement('div');
    el.className = 'calendar__dow';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const today = new Date();
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const btn = document.createElement('button');
    btn.className = 'calendar__day is-other';
    btn.textContent = d;
    grid.appendChild(btn);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const btn = document.createElement('button');
    btn.className = 'calendar__day';
    btn.textContent = d;
    if (isSameDay(date, today)) btn.classList.add('is-today');
    if (calendarState.selected && isSameDay(date, calendarState.selected)) btn.classList.add('is-selected');
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) btn.disabled = true;
    btn.addEventListener('click', () => {
      calendarState.selected = date;
      renderCalendar();
      updateBookingSummary();
    });
    grid.appendChild(btn);
  }

  // Trailing days to fill grid
  const totalCells = firstDay + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const btn = document.createElement('button');
    btn.className = 'calendar__day is-other';
    btn.textContent = i;
    grid.appendChild(btn);
  }

  syncNativeBookingDate();
}

/* ─── Area Booking ────────────────────────────────── */
const AREA_DATA = {
  coffee: {
    name: 'Coffee Shop',
    code: 'CF',
    tables: {
      A: { label: 'Table A — Window', seats: 2, booked: { 1: 'Ji-ho K.' } },
      B: { label: 'Table B — Left',   seats: 4, booked: { 2: 'Soyeon L.', 3: 'Minseo P.' } },
      C: { label: 'Table C — Center', seats: 4, booked: {} },
      D: { label: 'Table D — Corner', seats: 2, booked: { 1: 'Daehyun Y.' } },
      E: { label: 'Table E — Window', seats: 2, booked: {} },
    }
  },
  benches: {
    name: 'Outside Benches',
    code: 'OB',
    tables: {
      A: { label: 'Bench A', seats: 4, booked: { 1: 'Eunji S.', 2: 'Taeyang C.' } },
      B: { label: 'Bench B', seats: 4, booked: { 3: 'Hyejin N.' } },
      C: { label: 'Bench C', seats: 3, booked: {} },
    }
  },
  terrace: {
    name: 'Terrace',
    code: 'TR',
    tables: {
      A: { label: 'Table A — East',   seats: 4, booked: { 1: 'Wonho K.', 4: 'Seulgi R.' } },
      B: { label: 'Table B — West',   seats: 4, booked: { 2: 'Jimin B.' } },
      C: { label: 'Table C — Center', seats: 3, booked: {} },
      D: { label: 'Table D — Solo',   seats: 2, booked: { 1: 'Chaeyoung S.' } },
    }
  }
};

const bookingState = {
  area: 'coffee',
  table: null,
  seatCode: null,
};

function initAreaBooking() {
  const container = document.getElementById('areaMapContainer');
  const picker    = document.getElementById('seatPicker');
  const pickerClose = document.getElementById('seatPickerClose');
  if (!container) return;

  document.querySelectorAll('.area-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('is-active')) return;
      document.querySelectorAll('.area-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      bookingState.area     = tab.dataset.area;
      bookingState.table    = null;
      bookingState.seatCode = null;
      picker?.classList.remove('is-open');
      container.classList.add('is-switching');
      window.setTimeout(() => {
        renderAreaMap(tab.dataset.area);
        updateBookingSummary();
        requestAnimationFrame(() => container.classList.remove('is-switching'));
      }, 120);
    });
  });

  pickerClose?.addEventListener('click', () => {
    picker.classList.remove('is-open');
    document.querySelectorAll('.map-table').forEach(t => t.classList.remove('is-active'));
    bookingState.table    = null;
    bookingState.seatCode = null;
    updateBookingSummary();
  });

  const mobileMapQuery = window.matchMedia('(max-width: 640px)');
  const handleMapModeChange = () => {
    bookingState.table = null;
    bookingState.seatCode = null;
    picker?.classList.remove('is-open');
    renderAreaMap(bookingState.area);
    updateBookingSummary();
  };
  if (typeof mobileMapQuery.addEventListener === 'function') {
    mobileMapQuery.addEventListener('change', handleMapModeChange);
  } else if (typeof mobileMapQuery.addListener === 'function') {
    mobileMapQuery.addListener(handleMapModeChange);
  }

  renderAreaMap('coffee');
}

function renderAreaMap(areaKey) {
  const container = document.getElementById('areaMapContainer');
  if (!container) return;
  const mobileMap = window.matchMedia('(max-width: 640px)').matches;
  const fns = mobileMap
    ? { coffee: coffeeMobileSVG, benches: benchesMobileSVG, terrace: terraceMobileSVG }
    : { coffee: coffeeSVG, benches: benchesSVG, terrace: terraceSVG };
  container.innerHTML = (fns[areaKey] || coffeeSVG)();

  container.querySelectorAll('.map-table').forEach(tableEl => {
    const area = AREA_DATA[areaKey];
    const table = area?.tables[tableEl.dataset.table];
    if (table) {
      const bookedCount = Object.keys(table.booked || {}).length;
      const openCount = Math.max(0, table.seats - bookedCount);
      tableEl.classList.add(openCount === 0 ? 'map-table--full' : bookedCount > 0 ? 'map-table--partial' : 'map-table--open');
      tableEl.setAttribute('aria-label', `${table.label}, ${openCount} available of ${table.seats}`);
      tableEl.querySelector('text:last-child')?.classList.add('map-table__availability');
      const availabilityText = tableEl.querySelector('text:last-child');
      if (availabilityText) availabilityText.textContent = `${openCount}/${table.seats} open`;
    }

    tableEl.addEventListener('click', () => {
      container.querySelectorAll('.map-table').forEach(t => t.classList.remove('is-active'));
      tableEl.classList.add('is-active');
      bookingState.table    = tableEl.dataset.table;
      bookingState.seatCode = null;
      renderSeatPicker(bookingState.area, tableEl.dataset.table);
      updateBookingSummary();
    });
    tableEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') tableEl.click();
    });
  });
}

function renderSeatPicker(areaKey, tableKey) {
  const area  = AREA_DATA[areaKey];
  const table = area?.tables[tableKey];
  if (!table) return;

  const label  = document.getElementById('seatPickerLabel');
  const grid   = document.getElementById('seatPickerGrid');
  const picker = document.getElementById('seatPicker');
  if (!label || !grid || !picker) return;

  label.innerHTML = `<strong>${area.name}</strong><span class="seat-picker__sep">·</span>${table.label}`;
  grid.innerHTML  = '';

  for (let i = 1; i <= table.seats; i++) {
    const btn       = document.createElement('button');
    const bookedBy  = table.booked[i];
    const seatCode  = `${area.code}-${tableKey}${i}`;

    if (bookedBy) {
      btn.className = 'seat-btn seat-btn--occupied';
      btn.disabled  = true;
      const initials = bookedBy.split(' ').map(p => p[0]).join('').toUpperCase();
      btn.innerHTML = `
        <span class="seat-btn__initials">${initials}</span>
        <span class="seat-btn__status">Taken</span>
        <span class="seat-btn__name">${bookedBy}</span>
        <span class="seat-btn__code">${seatCode}</span>`;
    } else {
      btn.className       = 'seat-btn seat-btn--available';
      btn.dataset.code    = seatCode;
      btn.innerHTML = `
        <span class="seat-btn__code">${seatCode}</span>
        <span class="seat-btn__status">Available</span>
        <span class="seat-btn__sub">Seat ${i}</span>`;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.seat-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        bookingState.seatCode = seatCode;
        updateBookingSummary();
      });
    }
    grid.appendChild(btn);
  }

  picker.classList.add('is-open');
}

function coffeeMobileSVG() {
  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="340" height="340" rx="18" fill="none" stroke="#9aa3af" stroke-width="1.4" stroke-dasharray="5 7" opacity="0.34"/>
    <rect x="54" y="22" width="252" height="42" rx="10" fill="rgba(255,194,32,0.12)" stroke="rgba(255,194,32,0.45)" stroke-width="1.1"/>
    <text x="180" y="48" text-anchor="middle" font-size="13" letter-spacing="3" font-weight="600">COFFEE BAR</text>
    <rect x="330" y="86" width="8" height="186" rx="4" fill="rgba(151,213,255,0.34)"/>
    <text x="342" y="184" text-anchor="middle" font-size="10" letter-spacing="2" transform="rotate(90 342 184)">SEA VIEW</text>
    <rect x="138" y="338" width="84" height="6" rx="3" fill="rgba(151,213,255,0.35)"/>
    <text x="180" y="355" text-anchor="middle" font-size="10" letter-spacing="3">ENTRANCE</text>
    <circle cx="42" cy="308" r="13" fill="rgba(80,180,80,0.14)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <circle cx="312" cy="306" r="13" fill="rgba(80,180,80,0.14)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Table A, 2 seats">
      <rect x="226" y="88" width="86" height="58" rx="12"/>
      <text x="269" y="113" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE A</text>
      <text x="269" y="130" text-anchor="middle" font-size="10">2 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Table B, 4 seats">
      <rect x="36" y="92" width="112" height="78" rx="12"/>
      <text x="92" y="126" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE B</text>
      <text x="92" y="143" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Table C, 4 seats">
      <rect x="102" y="194" width="156" height="76" rx="12"/>
      <text x="180" y="227" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE C</text>
      <text x="180" y="244" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="D" role="button" tabindex="0" aria-label="Table D, 2 seats">
      <rect x="34" y="276" width="88" height="54" rx="12"/>
      <text x="78" y="299" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE D</text>
      <text x="78" y="316" text-anchor="middle" font-size="10">2 seats</text>
    </g>
    <g class="map-table" data-table="E" role="button" tabindex="0" aria-label="Table E, 2 seats">
      <rect x="238" y="276" width="88" height="54" rx="12"/>
      <text x="282" y="299" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE E</text>
      <text x="282" y="316" text-anchor="middle" font-size="10">2 seats</text>
    </g>
  </svg>`;
}

function benchesMobileSVG() {
  return `<svg viewBox="0 0 360 288" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="seaGradMobile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(151,213,255,0.24)"/>
        <stop offset="100%" stop-color="rgba(132,227,233,0.07)"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="340" height="86" rx="14" fill="url(#seaGradMobile)" stroke="rgba(151,213,255,0.35)" stroke-width="1"/>
    <text x="180" y="42" text-anchor="middle" font-size="13" letter-spacing="4" font-weight="600">SEA VIEW</text>
    <path d="M34 61 Q82 49 130 61 Q178 73 226 61 Q274 49 326 61" fill="none" stroke="rgba(151,213,255,0.44)" stroke-width="1.5"/>
    <path d="M34 78 Q82 66 130 78 Q178 90 226 78 Q274 66 326 78" fill="none" stroke="rgba(151,213,255,0.24)" stroke-width="1.2"/>
    <rect x="10" y="116" width="340" height="58" rx="0" fill="rgba(200,190,170,0.1)" stroke="rgba(200,190,170,0.25)" stroke-width="1"/>
    <text x="180" y="151" text-anchor="middle" font-size="12" letter-spacing="3" font-weight="600">PROMENADE</text>
    <rect x="10" y="192" width="340" height="86" rx="0" fill="rgba(80,180,80,0.07)" stroke="rgba(80,180,80,0.18)" stroke-width="1"/>
    <circle cx="44" cy="235" r="21" fill="rgba(80,180,80,0.17)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <circle cx="316" cy="232" r="21" fill="rgba(80,180,80,0.17)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Bench A, 4 seats">
      <rect x="30" y="105" width="94" height="48" rx="10"/>
      <text x="77" y="126" text-anchor="middle" font-size="11" letter-spacing="1.5" font-weight="700">BENCH A</text>
      <text x="77" y="141" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Bench B, 4 seats">
      <rect x="133" y="136" width="94" height="48" rx="10"/>
      <text x="180" y="157" text-anchor="middle" font-size="11" letter-spacing="1.5" font-weight="700">BENCH B</text>
      <text x="180" y="172" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Bench C, 3 seats">
      <rect x="236" y="105" width="94" height="48" rx="10"/>
      <text x="283" y="126" text-anchor="middle" font-size="11" letter-spacing="1.5" font-weight="700">BENCH C</text>
      <text x="283" y="141" text-anchor="middle" font-size="10">3 seats</text>
    </g>
  </svg>`;
}

function terraceMobileSVG() {
  const railLines = Array.from({length: 8}, (_, i) =>
    `<line x1="329" y1="${34 + i * 38}" x2="347" y2="${34 + i * 38}" stroke="rgba(151,213,255,0.3)" stroke-width="1.4"/>`
  ).join('');
  return `<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="340" height="340" rx="18" fill="none" stroke="#9aa3af" stroke-width="1.4" opacity="0.34"/>
    <rect x="326" y="20" width="20" height="302" rx="5" fill="rgba(151,213,255,0.08)" stroke="rgba(151,213,255,0.35)" stroke-width="1"/>
    ${railLines}
    <text x="350" y="174" text-anchor="middle" font-size="10" letter-spacing="2" transform="rotate(90 350 174)">SEA VIEW</text>
    <rect x="126" y="338" width="108" height="6" rx="3" fill="rgba(151,213,255,0.35)"/>
    <text x="180" y="355" text-anchor="middle" font-size="10" letter-spacing="3">ENTRANCE</text>
    <circle cx="180" cy="180" r="19" fill="rgba(255,194,32,0.1)" stroke="rgba(255,194,32,0.28)" stroke-width="1"/>
    <line x1="180" y1="161" x2="180" y2="199" stroke="rgba(255,194,32,0.34)" stroke-width="2"/>
    <line x1="156" y1="172" x2="204" y2="172" stroke="rgba(255,194,32,0.3)" stroke-width="1.5"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Table A, 4 seats">
      <ellipse cx="92" cy="98" rx="56" ry="42"/>
      <text x="92" y="94" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE A</text>
      <text x="92" y="111" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Table B, 4 seats">
      <ellipse cx="250" cy="116" rx="56" ry="42"/>
      <text x="250" y="112" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE B</text>
      <text x="250" y="129" text-anchor="middle" font-size="10">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Table C, 3 seats">
      <ellipse cx="100" cy="252" rx="56" ry="42"/>
      <text x="100" y="248" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE C</text>
      <text x="100" y="265" text-anchor="middle" font-size="10">3 seats</text>
    </g>
    <g class="map-table" data-table="D" role="button" tabindex="0" aria-label="Table D, 2 seats">
      <ellipse cx="250" cy="248" rx="56" ry="42"/>
      <text x="250" y="244" text-anchor="middle" font-size="12" letter-spacing="2" font-weight="700">TABLE D</text>
      <text x="250" y="261" text-anchor="middle" font-size="10">2 seats</text>
    </g>
  </svg>`;
}

function coffeeSVG() {
  return `<svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="780" height="440" rx="18" fill="none" stroke="#9aa3af" stroke-width="1.5" stroke-dasharray="5 7" opacity="0.4"/>
    <rect x="60" y="18" width="680" height="50" rx="10" fill="rgba(255,194,32,0.12)" stroke="rgba(255,194,32,0.5)" stroke-width="1.2"/>
    <text x="400" y="48" text-anchor="middle" font-size="14" letter-spacing="3" font-weight="600">COFFEE BAR</text>
    <rect x="774" y="90" width="10" height="280" rx="4" fill="rgba(151,213,255,0.4)"/>
    <text x="790" y="248" text-anchor="middle" font-size="12" letter-spacing="2" transform="rotate(90 790 248)">SEA VIEW</text>
    <rect x="340" y="452" width="120" height="6" rx="3" fill="rgba(151,213,255,0.35)"/>
    <text x="400" y="470" text-anchor="middle" font-size="12" letter-spacing="3">ENTRANCE</text>
    <circle cx="36" cy="428" r="16" fill="rgba(80,180,80,0.15)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <circle cx="764" cy="428" r="16" fill="rgba(80,180,80,0.15)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Table A, 2 seats">
      <rect x="638" y="90" width="118" height="66" rx="10"/>
      <text x="697" y="119" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE A</text>
      <text x="697" y="135" text-anchor="middle" font-size="11">2 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Table B, 4 seats">
      <rect x="46" y="100" width="160" height="100" rx="10"/>
      <text x="126" y="145" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE B</text>
      <text x="126" y="161" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Table C, 4 seats">
      <rect x="278" y="180" width="244" height="110" rx="10"/>
      <text x="400" y="230" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE C</text>
      <text x="400" y="246" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="D" role="button" tabindex="0" aria-label="Table D, 2 seats">
      <rect x="46" y="320" width="118" height="66" rx="10"/>
      <text x="105" y="349" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE D</text>
      <text x="105" y="365" text-anchor="middle" font-size="11">2 seats</text>
    </g>
    <g class="map-table" data-table="E" role="button" tabindex="0" aria-label="Table E, 2 seats">
      <rect x="638" y="320" width="118" height="66" rx="10"/>
      <text x="697" y="349" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE E</text>
      <text x="697" y="365" text-anchor="middle" font-size="11">2 seats</text>
    </g>
  </svg>`;
}

function benchesSVG() {
  return `<svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(151,213,255,0.22)"/>
        <stop offset="100%" stop-color="rgba(132,227,233,0.06)"/>
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="780" height="150" rx="14" fill="url(#seaGrad)" stroke="rgba(151,213,255,0.35)" stroke-width="1"/>
    <text x="400" y="55" text-anchor="middle" font-size="14" letter-spacing="4" font-weight="600">SEA VIEW</text>
    <path d="M50 90 Q140 74 230 90 Q320 106 410 90 Q500 74 590 90 Q680 106 750 90" fill="none" stroke="rgba(151,213,255,0.4)" stroke-width="1.5"/>
    <path d="M50 112 Q140 96 230 112 Q320 128 410 112 Q500 96 590 112 Q680 128 750 112" fill="none" stroke="rgba(151,213,255,0.22)" stroke-width="1"/>
    <rect x="10" y="180" width="780" height="90" rx="0" fill="rgba(200,190,170,0.1)" stroke="rgba(200,190,170,0.25)" stroke-width="1"/>
    <text x="400" y="232" text-anchor="middle" font-size="13" letter-spacing="3" font-weight="600">PROMENADE PATH</text>
    <rect x="10" y="288" width="780" height="162" rx="0" fill="rgba(80,180,80,0.07)" stroke="rgba(80,180,80,0.18)" stroke-width="1"/>
    <circle cx="78" cy="370" r="30" fill="rgba(80,180,80,0.18)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <circle cx="200" cy="352" r="22" fill="rgba(80,180,80,0.13)" stroke="rgba(80,180,80,0.25)" stroke-width="1"/>
    <circle cx="600" cy="362" r="26" fill="rgba(80,180,80,0.18)" stroke="rgba(80,180,80,0.3)" stroke-width="1"/>
    <circle cx="720" cy="348" r="20" fill="rgba(80,180,80,0.13)" stroke="rgba(80,180,80,0.25)" stroke-width="1"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Bench A, 4 seats">
      <rect x="50" y="162" width="168" height="38" rx="8"/>
      <text x="134" y="180" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">BENCH A</text>
      <text x="134" y="193" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Bench B, 4 seats">
      <rect x="316" y="162" width="168" height="38" rx="8"/>
      <text x="400" y="180" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">BENCH B</text>
      <text x="400" y="193" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Bench C, 3 seats">
      <rect x="582" y="162" width="168" height="38" rx="8"/>
      <text x="666" y="180" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">BENCH C</text>
      <text x="666" y="193" text-anchor="middle" font-size="11">3 seats</text>
    </g>
  </svg>`;
}

function terraceSVG() {
  const railLines = Array.from({length: 11}, (_, i) =>
    `<line x1="762" y1="${38 + i * 38}" x2="784" y2="${38 + i * 38}" stroke="rgba(151,213,255,0.3)" stroke-width="1.5"/>`
  ).join('');
  return `<svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="780" height="440" rx="16" fill="none" stroke="#9aa3af" stroke-width="1.5" opacity="0.35"/>
    <rect x="760" y="18" width="22" height="424" rx="4" fill="rgba(151,213,255,0.07)" stroke="rgba(151,213,255,0.35)" stroke-width="1"/>
    ${railLines}
    <text x="792" y="240" text-anchor="middle" font-size="12" letter-spacing="2" transform="rotate(90 792 240)">SEA VIEW</text>
    <rect x="330" y="452" width="140" height="6" rx="3" fill="rgba(151,213,255,0.35)"/>
    <text x="400" y="470" text-anchor="middle" font-size="12" letter-spacing="3">ENTRANCE</text>
    <circle cx="370" cy="230" r="22" fill="rgba(255,194,32,0.1)" stroke="rgba(255,194,32,0.28)" stroke-width="1"/>
    <line x1="370" y1="208" x2="370" y2="252" stroke="rgba(255,194,32,0.38)" stroke-width="2"/>
    <line x1="342" y1="220" x2="398" y2="220" stroke="rgba(255,194,32,0.3)" stroke-width="1.5"/>
    <g class="map-table" data-table="A" role="button" tabindex="0" aria-label="Table A, 4 seats">
      <ellipse cx="158" cy="132" rx="72" ry="52"/>
      <text x="158" y="128" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE A</text>
      <text x="158" y="144" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="B" role="button" tabindex="0" aria-label="Table B, 4 seats">
      <ellipse cx="560" cy="132" rx="72" ry="52"/>
      <text x="560" y="128" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE B</text>
      <text x="560" y="144" text-anchor="middle" font-size="11">4 seats</text>
    </g>
    <g class="map-table" data-table="C" role="button" tabindex="0" aria-label="Table C, 3 seats">
      <ellipse cx="158" cy="336" rx="72" ry="52"/>
      <text x="158" y="332" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE C</text>
      <text x="158" y="348" text-anchor="middle" font-size="11">3 seats</text>
    </g>
    <g class="map-table" data-table="D" role="button" tabindex="0" aria-label="Table D, 2 seats">
      <ellipse cx="560" cy="336" rx="72" ry="52"/>
      <text x="560" y="332" text-anchor="middle" font-size="13" letter-spacing="2" font-weight="700">TABLE D</text>
      <text x="560" y="348" text-anchor="middle" font-size="11">2 seats</text>
    </g>
  </svg>`;
}

function updateBookingSummary() {
  const el = document.querySelector('.booking-confirm__summary');
  if (!el) return;

  const dict   = window.i18n?.dict;
  const date   = calendarState.selected;
  const time   = document.querySelector('.timeslot.is-active')?.textContent;
  const months = dict?.reading?.months || [];

  const dateStr     = date ? `${months[date.getMonth()] || date.getMonth() + 1} ${date.getDate()}` : '—';
  const timeStr     = time || '—';
  const locationStr = bookingState.seatCode || (bookingState.table ? `${AREA_DATA[bookingState.area]?.code}-${bookingState.table}?` : '—');

  el.innerHTML = `<strong>${dateStr}</strong> · ${timeStr} · ${locationStr}`;
}

/* ─── Booking confirmation modal ─────────────────── */
function initBookingModal() {
  const modal      = document.getElementById('bookingModal');
  if (!modal) return;

  const overlay    = document.getElementById('bookingModalOverlay');
  const closeDone  = document.getElementById('bookingModalClose');
  const closeX     = document.getElementById('bookingModalCloseX');
  const confirmBtn = document.querySelector('.booking-confirm .btn--accent');
  const sparklesEl = document.getElementById('bookingSparkles');

  const SPARK_COLORS = ['#97D5FF','#84E3E9','#FFC229','#FF7746','#fff','#ffee93'];
  const AREA_ICONS   = { coffee: '☕', benches: '🌊', terrace: '✨' };

  const launchSparkles = () => {
    sparklesEl.innerHTML = '';
    const cx = sparklesEl.offsetWidth / 2;
    const cy = sparklesEl.offsetHeight * 0.3;
    for (let i = 0; i < 28; i++) {
      const el  = document.createElement('div');
      el.className = 'booking-success__spark';
      const angle = (i / 28) * Math.PI * 2;
      const dist  = 70 + Math.random() * 100;
      el.style.cssText = `left:${cx}px;top:${cy}px;background:${SPARK_COLORS[i % SPARK_COLORS.length]};--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist-50}px;animation-delay:${Math.random()*250}ms;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;border-radius:${Math.random()>0.5?'50%':'3px'};`;
      sparklesEl.appendChild(el);
    }
  };

  const openModal = () => {
    const dict   = window.i18n?.dict;
    const months = dict?.reading?.months || [];
    const date   = calendarState.selected;
    const time   = document.querySelector('.timeslot.is-active')?.textContent?.trim();
    const code   = bookingState.seatCode;
    const areaKey = bookingState.area;
    const area   = AREA_DATA[areaKey];
    const rawName = document.getElementById('guestName')?.value?.trim();
    const guestName = rawName || 'Guest';
    const firstName = guestName.split(' ')[0];

    document.getElementById('confirmName').textContent    = guestName;
    document.getElementById('confirmArea').textContent    = area?.name || '—';
    document.getElementById('confirmSeat').textContent    = code || '—';
    document.getElementById('confirmTime').textContent    = time || '—';
    document.getElementById('confirmDate').textContent    = date ? `${months[date.getMonth()] || ''} ${date.getDate()}` : '—';
    document.getElementById('confirmAreaIcon').textContent = AREA_ICONS[areaKey] || '✦';
    document.getElementById('confirmGreeting').textContent = `See you there, ${firstName}!`;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    launchSparkles();
    trackCommunityEvent('booking_confirm', {
      area: areaKey || '',
      seat: code || ''
    });
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  confirmBtn?.addEventListener('click', () => {
    if (!calendarState.selected || !document.querySelector('.timeslot.is-active') || !bookingState.seatCode) {
      const row = document.querySelector('.booking-confirm');
      row.style.animation = 'none';
      row.offsetHeight;
      row.style.animation = 'shake 400ms ease';
      return;
    }
    openModal();
  });

  overlay?.addEventListener('click', closeModal);
  closeDone?.addEventListener('click', closeModal);
  closeX?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

/* ─── Seasonal tabs ───────────────────────────────── */
function initSeasonalTabs() {
  const tabs = document.querySelectorAll('.seasonal__tab');
  const panel = document.querySelector('.seasonal__panel');
  if (!panel) return;
  const img = panel.querySelector('.seasonal__panel-img');
  const eyebrow = panel.querySelector('[data-season-label]');
  const title = panel.querySelector('[data-season-title]');
  const desc = panel.querySelector('[data-season-desc]');

  const seasonImgs = {
    spring: 'assets/images/seasonal/spring.webp',
    summer: 'assets/images/seasonal/summer.webp',
    autumn: 'assets/images/seasonal/autumn.webp',
    winter: 'assets/images/seasonal/winter.webp'
  };

  const show = (season) => {
    const applySeason = () => {
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.season === season));
      panel.dataset.activeSeason = season;
      const dict = window.i18n?.dict;
      const data = dict?.seasonal?.[season];
      if (data) {
        eyebrow.textContent = data.label;
        title.textContent = data.title;
        desc.textContent = data.description;
      }
      if (seasonImgs[season]) img.style.backgroundImage = `url('${seasonImgs[season]}')`;
      requestAnimationFrame(() => panel.classList.remove('is-changing'));
    };

    if (!panel.dataset.activeSeason) {
      applySeason();
      return;
    }

    panel.classList.add('is-changing');
    window.setTimeout(applySeason, 140);
  };

  tabs.forEach(tab => tab.addEventListener('click', () => show(tab.dataset.season)));
  document.addEventListener('i18n:applied', () => {
    if (panel.dataset.activeSeason) show(panel.dataset.activeSeason);
  });
  // Default season based on current month
  const month = new Date().getMonth();
  const currentSeason = month >= 2 && month <= 4 ? 'spring'
                      : month >= 5 && month <= 7 ? 'summer'
                      : month >= 8 && month <= 10 ? 'autumn'
                      : 'winter';
  show(currentSeason);
}

/* ─── Promenade zone map ─────────────────────────── */
function initPromenadeMap() {
  const root = document.getElementById('promenade-map');
  if (!root) return;

  const hitLayer = root.querySelector('[data-promenade-hit-areas]');
  const beamsLayer = root.querySelector('[data-promenade-beams]');
  const nodesLayer = root.querySelector('[data-promenade-nodes]');
  const photoPinsLayer = root.querySelector('[data-promenade-photo-pins]');
  const photoCard = root.querySelector('[data-promenade-photo-card]');
  const iframe = root.querySelector('[data-promenade-iframe]');
  const detail = root.querySelector('[data-promenade-detail]');
  if (!nodesLayer || !detail) return;

  const zoneEls = {
    image: detail.querySelector('[data-zone-image]'),
    kicker: detail.querySelector('[data-zone-kicker]'),
    title: detail.querySelector('[data-zone-title]'),
    tagline: detail.querySelector('[data-zone-tagline]'),
    description: detail.querySelector('[data-zone-description]'),
    gallery: detail.querySelector('[data-zone-gallery]'),
    free: detail.querySelector('[data-zone-free]'),
    premium: detail.querySelector('[data-zone-premium]'),
    activities: detail.querySelector('[data-zone-activities]')
  };

  const photoEls = {
    image: photoCard?.querySelector('[data-photo-card-image]'),
    zone: photoCard?.querySelector('[data-photo-card-zone]'),
    title: photoCard?.querySelector('[data-photo-card-title]'),
    description: photoCard?.querySelector('[data-photo-card-description]'),
    close: photoCard?.querySelector('[data-promenade-photo-close]')
  };

  const baseMapUrl = iframe?.src || '';

  const promenadeZones = [
    {
      id: 'reading',
      color: '#9DDDFF',
      kicker: 'Quiet zone',
      title: 'Reading Shore',
      titleKo: '독서 해변',
      tagline: 'Bring a book. Take your time.',
      description: 'Open-sided canopy shelter, staggered seating pods, book swap cabinet, and QR markers for seasonal reading lists.',
      free: 'Free: open seating, book swap, general access',
      premium: 'Premium: reserved shelter pod, 90-min slots',
      activities: ['Solo reading', 'Book borrowing and returning', 'Quiet sea-facing rest', 'Seasonal reading list discovery'],
      image: 'assets/images/reading/reading-zone-1.webp',
      gallery: [
        { title: 'Shelter Pods', image: 'assets/images/reading/reading-zone-1.webp', description: 'Small seating clusters for quiet reading and water-facing rest.' },
        { title: 'Book Swap Cabinet', image: 'assets/images/reading/reading-zone-2.webp', description: 'A weatherproof cabinet for borrowing, returning, and sharing books.' },
        { title: 'Reading QR', image: 'assets/images/reading/reading-zone-3.webp', description: 'Seasonal reading lists and booking links are one scan away.' }
      ],
      x: 82,
      y: 26,
      anchor: { x: 91, y: 36 },
      hit: { x: 66, y: 4, w: 28, h: 62 },
      map: { lat: 37.486561, lng: 126.610212, zoom: 18, label: 'Reading Shore Manseok-Hwasu' }
    },
    {
      id: 'social',
      color: '#FDC374',
      kicker: 'Social zone',
      title: 'Neighborhood Deck',
      titleKo: '동네 마당',
      tagline: 'A daily movement spine for local regulars.',
      description: 'Distributed walking, stretching, texture path, shaded pergola, and a morning movement platform with QR pass access.',
      free: 'Free: open circulation and resting after 9am',
      premium: 'Member: 6-9am platform priority and station slots',
      activities: ['Slow walking circuit', 'Individual stretching', 'Sensory walking path', 'Morning tai-chi and slow movement'],
      image: 'assets/images/discover/morning_circuit.webp',
      gallery: [
        { title: 'Morning Platform', image: 'assets/images/discover/morning_circuit.webp', description: 'A flat deck for 6-9am slow movement and health club routines.' },
        { title: 'Texture Path', image: 'assets/images/discover/bike-path.webp', description: 'Smooth, pebble, and soft walking textures slow the body down.' },
        { title: 'Pergola Rest', image: 'assets/images/discover/sea-lookout.webp', description: 'A shaded pause point where the view is the activity.' }
      ],
      x: 78,
      y: 15,
      anchor: { x: 60, y: 39 },
      hit: { x: 39, y: 2, w: 30, h: 65 },
      map: { lat: 37.486776, lng: 126.612482, zoom: 18, label: 'Neighborhood Deck Manseok-Hwasu' }
    },
    {
      id: 'heritage',
      color: '#84E3E9',
      kicker: 'Heritage zone',
      title: 'Cat Island Trail',
      titleKo: '묘도길',
      tagline: 'History appears as small stops along the water.',
      description: 'Five to seven lore marker posts, sea panorama points, seasonal installation space, and QR access to archival stories.',
      free: 'Free: self-guided heritage walk and QR archive',
      premium: 'Community: submit stories and vote on seasonal stops',
      activities: ['Lore stop sequence', 'Open Sea Panorama', 'Tidal lookout photography', 'Community memory submissions'],
      image: 'assets/images/discover/heritage_stop.webp',
      gallery: [
        { title: 'Lore Marker', image: 'assets/images/discover/heritage_stop.webp', description: 'Marker posts reveal the former Cat Island geography and port memory.' },
        { title: 'Open Sea Panorama', image: 'assets/images/discover/sea-lookout.webp', description: 'A wide view point for the main heritage cluster.' },
        { title: 'Archive Layer', image: 'assets/images/community/story-2.webp', description: 'Residents can submit stories and photos for seasonal updates.' }
      ],
      x: 24,
      y: 31,
      anchor: { x: 40, y: 9 },
      hit: { x: 6, y: 0, w: 38, h: 67 },
      map: { lat: 37.488059, lng: 126.613293, zoom: 18, label: 'Cat Island Trail Manseok-Hwasu' }
    },
    {
      id: 'event',
      color: '#FF7746',
      kicker: 'Event zone',
      title: 'Tidal Stage',
      titleKo: '해안 무대',
      tagline: 'The trail closes at the sea.',
      description: 'Movable low seating, sunset viewing, clear West Sea sightlines, and seasonal community-voted programs.',
      free: 'Free: sunset viewing, photography, quiet rest',
      premium: 'Seasonal: voted events and reserved gathering moments',
      activities: ['Tidal and sunset viewing', 'Open sea photography', 'Flexible seating', 'Small seasonal programs'],
      image: 'assets/images/discover/sea-lookout.webp',
      gallery: [
        { title: 'Tidal Lookout', image: 'assets/images/discover/sea-lookout.webp', description: 'A camera-ready end point for sunset, tides, and horizon watching.' },
        { title: 'Flexible Seating', image: 'assets/images/discover/waterfront-dock.webp', description: 'Movable low seating keeps the deck open for seasonal programs.' },
        { title: 'Seasonal Gathering', image: 'assets/images/community/story-3.webp', description: 'Community-voted events can happen without heavy fixed infrastructure.' }
      ],
      x: 17,
      y: 48,
      anchor: { x: 14, y: 63 },
      hit: { x: 5, y: 34, w: 29, h: 35 },
      map: { lat: 37.488854, lng: 126.615067, zoom: 18, label: 'Tidal Stage Manseok-Hwasu' }
    }
  ];

  const photoSpots = [
    {
      id: 'reading-books',
      zoneId: 'reading',
      title: 'Book Swap Cabinet',
      description: 'Borrow, return, or leave a coastal reading note for the next visitor.',
      image: 'assets/images/reading/reading-zone-2.webp',
      x: 88,
      y: 43
    },
    {
      id: 'social-platform',
      zoneId: 'social',
      title: 'Morning Movement Platform',
      description: 'A time-zoned deck for slow exercise groups before the promenade opens fully.',
      image: 'assets/images/discover/morning_circuit.webp',
      x: 61,
      y: 61
    },
    {
      id: 'heritage-marker',
      zoneId: 'heritage',
      title: 'Lore Stop Marker',
      description: 'A QR-linked stop for the Manseok name, Cat Island memory, and community archives.',
      image: 'assets/images/discover/heritage_stop.webp',
      x: 41,
      y: 24
    },
    {
      id: 'tidal-lookout',
      zoneId: 'event',
      title: 'Tidal Stage Lookout',
      description: 'The flexible end-of-trail deck for sunset watching and open sea photography.',
      image: 'assets/images/discover/sea-lookout.webp',
      x: 14,
      y: 64
    }
  ];

  const buildMapUrl = (zone) => {
    if (!zone?.map) return baseMapUrl;
    const query = encodeURIComponent(`${zone.map.lat},${zone.map.lng}`);
    return `https://www.google.com/maps?q=${query}&z=${zone.map.zoom || 18}&hl=en&output=embed`;
  };

  const isCompactZoneMap = () => window.matchMedia('(max-width: 740px)').matches;

  const getNodeCenter = (node) => {
    const paperRect = nodesLayer.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    return {
      x: ((nodeRect.left + nodeRect.width / 2 - paperRect.left) / paperRect.width) * 100,
      y: ((nodeRect.top + nodeRect.height / 2 - paperRect.top) / paperRect.height) * 100
    };
  };

  const clampNodeToPaper = (node, x, y) => {
    const paperRect = nodesLayer.getBoundingClientRect();
    if (!paperRect.width || !paperRect.height) return { x, y };

    node.style.setProperty('--node-x', `${x}%`);
    node.style.setProperty('--node-y', `${y}%`);

    const nodeRect = node.getBoundingClientRect();
    const padding = isCompactZoneMap() ? 5 : 10;
    let nextX = x;
    let nextY = y;

    if (nodeRect.left < paperRect.left + padding) {
      nextX += ((paperRect.left + padding - nodeRect.left) / paperRect.width) * 100;
    }
    if (nodeRect.right > paperRect.right - padding) {
      nextX -= ((nodeRect.right - (paperRect.right - padding)) / paperRect.width) * 100;
    }
    if (nodeRect.top < paperRect.top + padding) {
      nextY += ((paperRect.top + padding - nodeRect.top) / paperRect.height) * 100;
    }
    if (nodeRect.bottom > paperRect.bottom - padding) {
      nextY -= ((nodeRect.bottom - (paperRect.bottom - padding)) / paperRect.height) * 100;
    }

    return {
      x: Math.min(100, Math.max(0, nextX)),
      y: Math.min(100, Math.max(0, nextY))
    };
  };

  const clampRestingTitleCards = () => {
    nodesLayer.querySelectorAll('.promenade-node').forEach((node) => {
      const clamped = clampNodeToPaper(node, Number(node.dataset.homeX), Number(node.dataset.homeY));
      node.dataset.homeX = String(clamped.x);
      node.dataset.homeY = String(clamped.y);
      node.style.setProperty('--node-x', `${clamped.x}%`);
      node.style.setProperty('--node-y', `${clamped.y}%`);
    });
  };

  const clampCameraPins = () => {
    const pins = Array.from(photoPinsLayer?.querySelectorAll('.promenade-camera') || []);
    const paperRect = nodesLayer.getBoundingClientRect();
    if (!paperRect.width || !paperRect.height) return;

    pins.forEach((pin) => {
      const homeX = Number(pin.dataset.homeX);
      const homeY = Number(pin.dataset.homeY);
      if (!Number.isFinite(homeX) || !Number.isFinite(homeY)) return;

      pin.style.setProperty('--spot-x', `${homeX}%`);
      pin.style.setProperty('--spot-y', `${homeY}%`);

      const pinRect = pin.getBoundingClientRect();
      const padding = isCompactZoneMap() ? 8 : 18;
      let nextX = homeX;
      let nextY = homeY;

      if (pinRect.left < paperRect.left + padding) {
        nextX += ((paperRect.left + padding - pinRect.left) / paperRect.width) * 100;
      }
      if (pinRect.right > paperRect.right - padding) {
        nextX -= ((pinRect.right - (paperRect.right - padding)) / paperRect.width) * 100;
      }
      if (pinRect.top < paperRect.top + padding) {
        nextY += ((paperRect.top + padding - pinRect.top) / paperRect.height) * 100;
      }
      if (pinRect.bottom > paperRect.bottom - padding) {
        nextY -= ((pinRect.bottom - (paperRect.bottom - padding)) / paperRect.height) * 100;
      }

      pin.style.setProperty('--spot-x', `${Math.min(100, Math.max(0, nextX))}%`);
      pin.style.setProperty('--spot-y', `${Math.min(100, Math.max(0, nextY))}%`);
    });
  };

  const updateBeam = (zoneId) => {
    if (!beamsLayer) return;
    const zone = promenadeZones.find((item) => item.id === zoneId);
    const beam = beamsLayer.querySelector(`[data-zone-id="${zoneId}"]`);
    const node = nodesLayer.querySelector(`[data-zone-id="${zoneId}"]`);
    if (!zone || !beam || !node) return;

    const center = getNodeCenter(node);
    beam.setAttribute('x1', zone.anchor.x);
    beam.setAttribute('y1', zone.anchor.y);
    beam.setAttribute('x2', center.x.toFixed(2));
    beam.setAttribute('y2', center.y.toFixed(2));
  };

  const updateAllBeams = () => promenadeZones.forEach((zone) => updateBeam(zone.id));

  const resolveTitleCardOverlaps = () => {
    const nodes = Array.from(nodesLayer.querySelectorAll('.promenade-node'));
    const cameraPins = Array.from(photoPinsLayer?.querySelectorAll('.promenade-camera') || []);
    const paperRect = nodesLayer.getBoundingClientRect();
    if (!paperRect.width || !paperRect.height) return;

    const overlaps = (rect, otherRect) => !(rect.right + 12 < otherRect.left ||
      rect.left - 12 > otherRect.right ||
      rect.bottom + 12 < otherRect.top ||
      rect.top - 12 > otherRect.bottom);

    nodes.forEach((node, index) => {
      const current = promenadeZones.find((zone) => zone.id === node.dataset.zoneId);
      if (!current) return;

      for (let pass = 0; pass < 4; pass += 1) {
        const rect = node.getBoundingClientRect();
        const previousCard = nodes.find((other, otherIndex) => otherIndex < index && overlaps(rect, other.getBoundingClientRect()));
        const cameraOverlap = cameraPins.find((pin) => overlaps(rect, pin.getBoundingClientRect()));
        const overlap = previousCard || cameraOverlap;
        if (!overlap) break;

        const otherRect = overlap.getBoundingClientRect();
        const direction = rect.top + rect.height / 2 > otherRect.top + otherRect.height / 2 ? 1 : -1;
        const nextY = Math.min(62, Math.max(8, Number(node.dataset.homeY) + direction * 7));
        node.dataset.homeY = String(nextY);
        node.style.setProperty('--node-y', `${nextY}%`);
      }
    });

    clampRestingTitleCards();

    requestAnimationFrame(updateAllBeams);
  };

  const renderActivities = (activities) => {
    zoneEls.activities.innerHTML = '';
    activities.forEach((activity) => {
      const item = document.createElement('li');
      item.textContent = activity;
      zoneEls.activities.appendChild(item);
    });
  };

  const closePhotoCard = () => {
    if (!photoCard) return;
    photoCard.hidden = true;
    photoCard.classList.remove('is-open');
    root.querySelectorAll('.promenade-camera').forEach((pin) => pin.classList.remove('is-active'));
  };

  const openPhotoCard = (spot) => {
    const zone = promenadeZones.find((item) => item.id === spot.zoneId);
    if (!photoCard || !zone) return;

    photoEls.image.style.backgroundImage = `url('${spot.image}')`;
    photoEls.zone.textContent = zone.title;
    photoEls.title.textContent = spot.title;
    photoEls.description.textContent = spot.description;
    photoCard.style.setProperty('--card-x', `${Math.min(Math.max(spot.x + 3, 18), 72)}%`);
    photoCard.style.setProperty('--card-y', `${Math.min(Math.max(spot.y - 4, 14), 70)}%`);
    photoCard.hidden = false;
    requestAnimationFrame(() => photoCard.classList.add('is-open'));

    root.querySelectorAll('.promenade-camera').forEach((pin) => {
      pin.classList.toggle('is-active', pin.dataset.spotId === spot.id);
    });
  };

  const renderGallery = (zone) => {
    if (!zoneEls.gallery) return;
    zoneEls.gallery.innerHTML = '';

    zone.gallery.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'promenade-zone__thumb';
      button.style.backgroundImage = `url('${item.image}')`;
      button.setAttribute('aria-label', `Preview ${item.title}`);
      button.addEventListener('click', () => openPhotoCard({
        id: `${zone.id}-${item.title.toLowerCase().replace(/\W+/g, '-')}`,
        zoneId: zone.id,
        ...item,
        x: zone.x,
        y: zone.y
      }));
      zoneEls.gallery.appendChild(button);
    });
  };

  const scrollZoneDetailIntoView = () => {
    if (!isCompactZoneMap()) return;
    requestAnimationFrame(() => {
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const setActiveZone = (id, options = {}) => {
    const zone = promenadeZones.find((item) => item.id === id) || promenadeZones[0];
    if (!zone) return;

    root.dataset.activeZone = zone.id;
    detail.style.setProperty('--zone-color', zone.color);
    nodesLayer.querySelectorAll('.promenade-node').forEach((node) => {
      const isActive = node.dataset.zoneId === zone.id;
      node.classList.toggle('is-active', isActive);
      node.setAttribute('aria-pressed', String(isActive));
    });

    zoneEls.image.style.backgroundImage = `url('${zone.image}')`;
    zoneEls.kicker.textContent = zone.kicker;
    zoneEls.title.textContent = zone.title;
    zoneEls.tagline.textContent = zone.tagline;
    zoneEls.description.textContent = zone.description;
    zoneEls.free.textContent = zone.free;
    zoneEls.premium.textContent = zone.premium;
    renderActivities(zone.activities);
    renderGallery(zone);
    closePhotoCard();

    if (iframe) {
      const nextSrc = buildMapUrl(zone);
      if (iframe.src !== nextSrc) iframe.src = nextSrc;
      iframe.title = `Google Maps preview for ${zone.title}`;
    }

    if (options.scrollDetail) scrollZoneDetailIntoView();
  };

  if (hitLayer) hitLayer.innerHTML = '';

  promenadeZones.forEach((zone) => {
    if (beamsLayer) {
      const beam = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      beam.classList.add('promenade-beam', `promenade-beam--${zone.id}`);
      beam.dataset.zoneId = zone.id;
      beam.style.setProperty('--zone-color', zone.color);
      beamsLayer.appendChild(beam);
    }
  });

  promenadeZones.forEach((zone) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `promenade-node promenade-node--${zone.id}`;
    node.dataset.zoneId = zone.id;
    node.dataset.homeX = String(zone.x);
    node.dataset.homeY = String(zone.y);
    node.style.setProperty('--zone-color', zone.color);
    node.style.setProperty('--node-x', `${zone.x}%`);
    node.style.setProperty('--node-y', `${zone.y}%`);
    node.setAttribute('aria-label', `Explore ${zone.title}`);
    node.setAttribute('aria-pressed', 'false');

    const label = document.createElement('span');
    label.className = 'promenade-node__label';

    const title = document.createElement('strong');
    title.textContent = zone.title;

    const subtitle = document.createElement('span');
    subtitle.textContent = zone.titleKo;

    label.append(title, subtitle);
    node.append(label);

    const getPointerPosition = (event) => {
      const rect = nodesLayer.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100
      };
    };

    let dragState = null;

    node.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      if (isCompactZoneMap()) {
        setActiveZone(zone.id);
        return;
      }
      setActiveZone(zone.id);
      node.classList.add('is-dragging');
      node.setPointerCapture?.(event.pointerId);
      const start = getPointerPosition(event);
      dragState = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        offsetX: start.x - Number(node.style.getPropertyValue('--node-x').replace('%', '') || node.dataset.homeX),
        offsetY: start.y - Number(node.style.getPropertyValue('--node-y').replace('%', '') || node.dataset.homeY),
        moved: false
      };
      updateBeam(zone.id);
    });

    node.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - dragState.startClientX, event.clientY - dragState.startClientY);
      dragState.moved = dragState.moved || distance > 4;
      if (!dragState.moved) return;

      const pointer = getPointerPosition(event);
      const next = clampNodeToPaper(node, pointer.x - dragState.offsetX, pointer.y - dragState.offsetY);
      node.style.setProperty('--node-x', `${next.x}%`);
      node.style.setProperty('--node-y', `${next.y}%`);
      updateBeam(zone.id);
    });

    const snapNodeHome = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      node.releasePointerCapture?.(event.pointerId);
      node.classList.remove('is-dragging');
      node.classList.add('is-snapping');
      node.style.setProperty('--node-x', `${node.dataset.homeX}%`);
      node.style.setProperty('--node-y', `${node.dataset.homeY}%`);

      let snapFrame = null;
      const followSnap = () => {
        updateBeam(zone.id);
        if (node.classList.contains('is-snapping')) {
          snapFrame = requestAnimationFrame(followSnap);
        }
      };
      followSnap();

      const finishSnap = () => {
        if (snapFrame) cancelAnimationFrame(snapFrame);
        node.classList.remove('is-snapping');
        updateBeam(zone.id);
      };

      node.addEventListener('transitionend', finishSnap, { once: true });
      window.setTimeout(finishSnap, 280);
      dragState = null;
    };

    node.addEventListener('pointerup', snapNodeHome);
    node.addEventListener('pointercancel', snapNodeHome);
    node.addEventListener('click', () => setActiveZone(zone.id, { scrollDetail: isCompactZoneMap() }));
    nodesLayer.appendChild(node);
  });

  photoSpots.forEach((spot) => {
    const zone = promenadeZones.find((item) => item.id === spot.zoneId);
    if (!zone) return;

    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'promenade-camera';
    pin.dataset.zoneId = zone.id;
    pin.dataset.spotId = spot.id;
    pin.dataset.homeX = String(spot.x);
    pin.dataset.homeY = String(spot.y);
    pin.style.setProperty('--spot-x', `${spot.x}%`);
    pin.style.setProperty('--spot-y', `${spot.y}%`);
    pin.style.setProperty('--zone-color', zone.color);
    pin.setAttribute('aria-label', `Open photo preview: ${spot.title}`);
    pin.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5 16 7h3a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2.5z"/><circle cx="12" cy="13" r="3.2"/></svg>';
    pin.addEventListener('click', (event) => {
      event.stopPropagation();
      setActiveZone(spot.zoneId, { scrollDetail: isCompactZoneMap() });
      openPhotoCard(spot);
    });
    photoPinsLayer?.appendChild(pin);
  });

  photoEls.close?.addEventListener('click', closePhotoCard);
  window.addEventListener('resize', () => requestAnimationFrame(() => {
    clampCameraPins();
    resolveTitleCardOverlaps();
    updateAllBeams();
  }));

  setActiveZone('reading');
  requestAnimationFrame(() => {
    clampCameraPins();
    resolveTitleCardOverlaps();
    updateAllBeams();
  });
}
