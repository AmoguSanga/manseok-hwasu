/* ============================================================
   MANSEOK-HWASU — App Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();

  initThemeToggle();
  initNav();
  initLangToggle();
  initIncheonLinks();
  initScrollReveal();
  initActiveNavLink();
  initHeroCarousel();
  initCurrentEvents();
  initDiscoverMap();
  initCalendar();
  initAreaBooking();
  initSeasonalTabs();
  initPromenadeMap();
  initBookingModal();
});

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
  let viewerRequest = 0;

  const panoramaSpaces = {
    waterfront: { image: 'assets/images/3dspaces/outside_benches.png', fallback: true },
    lookout: { image: 'assets/images/3dspaces/outside_benches.png', fallback: true },
    library: { image: 'assets/images/3dspaces/outside_benches.png', fallback: true },
    cafe: { image: 'assets/images/3dspaces/slow-cafe_3d.png', fallback: false },
    gallery: { image: 'assets/images/3dspaces/art-gallery_3d.png', fallback: false },
    bike: { image: 'assets/images/3dspaces/bike-path_3d.png', fallback: false }
  };

  const pinImages = {
    waterfront: 'assets/images/discover/waterfront-dock.webp',
    lookout: 'assets/images/discover/sea-lookout.webp',
    library: 'assets/images/discover/coastal-library.webp',
    cafe: 'assets/images/discover/slow-cafe.webp',
    gallery: 'assets/images/discover/art-gallery.webp',
    bike: 'assets/images/discover/bike-path.webp'
  };

  const spaceOrder = ['waterfront', 'lookout', 'library', 'cafe', 'gallery', 'bike'];

  const hotspotPositions = [
    { type: 'story', yaw: -0.42, pitch: -0.05 },
    { type: 'detail', yaw: 0.72, pitch: 0.08 }
  ];

  const hotspotLabels = {
    story: {
      en: { trigger: 'Story', title: 'Place note', body: 'A small orientation note is pinned into this scene for the prototype.' },
      ko: { trigger: '이야기', title: '장소 메모', body: '프로토타입을 위해 이 공간 안에 간단한 안내 노드를 배치했습니다.' }
    },
    detail: {
      en: { trigger: 'Details', title: 'Area card', body: 'This uses the same content card from the coastal map, now anchored inside the panorama.' },
      ko: { trigger: '상세', title: '공간 카드', body: '해안 지도에서 사용하던 콘텐츠 카드를 파노라마 안에 고정했습니다.' }
    }
  };

  const developmentText = {
    en: 'This area is currently under development. Preview image shown for now.',
    ko: '이 구역은 현재 준비 중입니다. 지금은 임시 미리보기 이미지를 보여드립니다.'
  };

  const isMobileTour = () => window.matchMedia('(max-width: 640px)').matches;

  const getCurrentLang = () => document.documentElement.lang || localStorage.getItem('mh-lang') || 'en';

  const getPoint = (id) => {
    const dict = window.i18n?.dict;
    return dict?.discover?.points?.[id] || null;
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

  const requestTourFullscreen = async (target = map) => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

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
    map.classList.remove('is-locked');
    map.classList.toggle('is-mobile-expanded', isMobileTour());
    map.classList.toggle('is-expanded', !isMobileTour());
    document.body.classList.toggle('is-discover-modal', isMobileTour());
    if (isMobileTour()) requestTourFullscreen(map);
  };

  const closeExpandedTour = () => {
    closeViewer();
    map.classList.add('is-locked');
    map.classList.remove('is-expanded', 'is-mobile-expanded');
    document.body.classList.remove('is-discover-modal');
    pins.forEach(p => p.classList.remove('is-active'));
    exitTourFullscreen();
    requestAnimationFrame(() => {
      map.querySelector('[data-tour-enter]')?.focus({ preventScroll: true });
    });
  };

  const showFallbackImage = (imagePath) => {
    fallbackFrame.style.backgroundImage = `url('${imagePath}')`;
    viewerLayer.classList.add('is-fallback');
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

  const getLocalizedHotspotText = (type) => {
    const lang = getCurrentLang().startsWith('ko') ? 'ko' : 'en';
    return hotspotLabels[type]?.[lang] || hotspotLabels[type]?.en;
  };

  const closeOpenHotspots = (exceptElement) => {
    viewerFrame.querySelectorAll('.discover-hotspot.is-open').forEach((node) => {
      if (node !== exceptElement) node.classList.remove('is-open');
    });
  };

  const addSceneHotspots = (scene, id, space) => {
    const point = getPoint(id);
    if (!point || !scene?.hotspotContainer) return;

    hotspotPositions.forEach((spot) => {
      const copy = getLocalizedHotspotText(spot.type);
      const hotspot = document.createElement('div');
      hotspot.className = 'discover-hotspot';
      hotspot.dataset.hotspotYaw = String(spot.yaw);
      hotspot.dataset.hotspotPitch = String(spot.pitch);

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
      image.style.backgroundImage = `url('${spot.type === 'detail' ? pinImages[id] : space.image}')`;

      const title = document.createElement('strong');
      title.textContent = spot.type === 'detail' ? point.title : copy.title;

      const body = document.createElement('span');
      body.textContent = spot.type === 'detail' ? point.description : copy.body;

      card.append(image, title, body);
      hotspot.append(button, card);

      card.addEventListener('click', (event) => event.stopPropagation());
      scene.hotspotContainer().createHotspot(hotspot, { yaw: spot.yaw, pitch: spot.pitch });
    });
  };

  const openViewer = async (id) => {
    const space = panoramaSpaces[id] || panoramaSpaces.waterfront;
    const requestId = viewerRequest + 1;
    viewerRequest = requestId;
    destroyPanorama();
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
    if (fullElement && (fullElement === viewerLayer || fullElement.contains(viewerLayer) || viewerLayer.contains(fullElement))) {
      await exitTourFullscreen();
    }

    destroyPanorama();
    map.classList.remove('is-viewer-open');
    viewerLayer.classList.remove('is-visible', 'is-loading');
    viewerLayer.setAttribute('aria-hidden', 'true');
    activeScene = null;
    activeId = null;
    setSpaceJumpOpen(false);
    pins.forEach(p => p.classList.remove('is-active'));
  }

  pins.forEach(pin => {
    pin.addEventListener('click', () => openViewer(pin.dataset.id));
  });

  const handleViewerChromeClick = (event) => {
    const hotspotTrigger = event.target.closest('[data-hotspot-trigger]');
    if (hotspotTrigger) {
      event.preventDefault();
      event.stopPropagation();

      const hotspot = hotspotTrigger.closest('.discover-hotspot');
      if (!hotspot) return;

      const nextOpen = !hotspot.classList.contains('is-open');
      closeOpenHotspots(hotspot);
      hotspot.classList.toggle('is-open', nextOpen);

      if (nextOpen && activeScene?.lookTo) {
        activeScene.lookTo({
          yaw: Number(hotspot.dataset.hotspotYaw) || 0,
          pitch: Number(hotspot.dataset.hotspotPitch) || 0,
          fov: Math.PI / 2.65
        }, { transitionDuration: 450 });
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
    if (event.target.closest('[data-viewer-close], [data-viewer-fullscreen], [data-space-jump], .discover-hotspot')) {
      event.stopPropagation();
    }
  };

  viewerLayer.addEventListener('pointerdown', stopViewerChromePointer, true);
  viewerLayer.addEventListener('pointerup', stopViewerChromePointer, true);
  viewerLayer.addEventListener('click', handleViewerChromeClick, true);

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

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && map.classList.contains('is-mobile-expanded')) {
      map.classList.remove('is-mobile-expanded');
      map.classList.add('is-locked');
      document.body.classList.remove('is-discover-modal');
      closeViewer();
    }
  });

  document.addEventListener('i18n:applied', () => {
    if (activeId) syncViewerCopy(activeId);
  });
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
  details.className = 'btn btn--accent';
  details.type = 'button';
  details.textContent = 'Read Details';
  details.addEventListener('click', () => openEventModal(event.id));

  const reserve = document.createElement('button');
  reserve.className = 'btn btn--primary';
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

  modal.querySelector('[data-event-comment-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const source = window.MH_READING_EVENTS?.find(item => item.id === currentEventsState.activeEventId);
    if (!source) return;
    const form = event.currentTarget;
    const name = form.elements.name.value.trim() || 'Reader';
    const text = form.elements.comment.value.trim();
    if (!text) return;
    source.comments = [...(source.comments || []), { name, text }];
    form.reset();
    populateEventComments(source);
  });

  modal.querySelector('[data-event-reserve-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = modal.querySelector('[data-event-reserve-status]');
    if (status) status.textContent = 'Reservation preview created. This prototype is not saving the information yet.';
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
  if (options.focusReserve) {
    requestAnimationFrame(() => modal.querySelector('[data-event-reserve-form] input')?.focus());
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
      modal.querySelector('[data-event-reserve-form]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  populateEventComments(event);
}

function populateEventComments(event) {
  const comments = document.querySelector('[data-event-comments]');
  if (!comments) return;
  comments.innerHTML = '';
  (event.comments || []).forEach(comment => {
    const item = document.createElement('div');
    item.className = 'event-post__comment';
    item.innerHTML = '<strong></strong><p></p>';
    item.querySelector('strong').textContent = comment.name;
    item.querySelector('p').textContent = comment.text;
    comments.appendChild(item);
  });
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

function initCalendar() {
  const root = document.querySelector('.calendar');
  if (!root) return;

  const today = new Date();
  calendarState.view = new Date(today.getFullYear(), today.getMonth(), 1);

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
      document.querySelectorAll('.area-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      bookingState.area     = tab.dataset.area;
      bookingState.table    = null;
      bookingState.seatCode = null;
      picker?.classList.remove('is-open');
      renderAreaMap(tab.dataset.area);
      updateBookingSummary();
    });
  });

  pickerClose?.addEventListener('click', () => {
    picker.classList.remove('is-open');
    document.querySelectorAll('.map-table').forEach(t => t.classList.remove('is-active'));
    bookingState.table    = null;
    bookingState.seatCode = null;
    updateBookingSummary();
  });

  renderAreaMap('coffee');
}

function renderAreaMap(areaKey) {
  const container = document.getElementById('areaMapContainer');
  if (!container) return;
  const fns = { coffee: coffeeSVG, benches: benchesSVG, terrace: terraceSVG };
  container.innerHTML = (fns[areaKey] || coffeeSVG)();

  container.querySelectorAll('.map-table').forEach(tableEl => {
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
        <span class="seat-btn__name">${bookedBy}</span>
        <span class="seat-btn__code">${seatCode}</span>`;
    } else {
      btn.className       = 'seat-btn seat-btn--available';
      btn.dataset.code    = seatCode;
      btn.innerHTML = `
        <span class="seat-btn__code">${seatCode}</span>
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

  const setActiveZone = (id) => {
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
      setActiveZone(zone.id);
      if (isCompactZoneMap()) return;
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
    node.addEventListener('click', () => setActiveZone(zone.id));
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
      setActiveZone(spot.zoneId);
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
