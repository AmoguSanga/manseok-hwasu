/* ============================================================
   MANSEOK-HWASU — App Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();

  initNav();
  initLangToggle();
  initScrollReveal();
  initActiveNavLink();
  initHeroScene();
  initDiscoverMap();
  initCalendar();
  initSeatMap();
  initSeasonalTabs();
});

/* ─── Hero Scene: canvas particles + mouse parallax ─ */
function initHeroScene() {
  const scene = document.getElementById('heroScene');
  if (!scene) return;

  const canvas = document.getElementById('heroCanvas');
  const farLayer = document.getElementById('heroFar');
  const nearLayer = document.getElementById('heroNear');
  const orb = document.getElementById('heroOrb');

  // ── Canvas particle field ──
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = scene.offsetWidth;
      canvas.height = scene.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(scene);

    // Brand-palette particles: sky, aqua, and a few warm yellow accents
    const COLORS = ['151,213,255', '132,227,233', '255,194,41', '151,213,255', '151,213,255'];
    const pts = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00045,
      vy: (Math.random() - 0.5) * 0.00045 - 0.00018,
      r: Math.random() * 1.8 + 0.7,
      a: Math.random() * 0.45 + 0.15,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      // Each particle has its own slow oscillation for organic feel
      phase: Math.random() * Math.PI * 2,
      freq: 0.0003 + Math.random() * 0.0004,
    }));

    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      pts.forEach(p => {
        // Gentle sine drift layered on top of linear velocity
        const drift = Math.sin(t * p.freq + p.phase) * 0.00015;
        p.x += p.vx + drift;
        p.y += p.vy;
        // Wrap around edges
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ── Mouse parallax (desktop) ──
  let tx = 0, ty = 0, cx = 0, cy = 0;

  const onPointerMove = (e) => {
    const rect = scene.getBoundingClientRect();
    tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    ty = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  };

  scene.addEventListener('mousemove', onPointerMove);
  scene.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  // Smooth lerp loop for parallax
  const lerpParallax = () => {
    cx += (tx - cx) * 0.055;
    cy += (ty - cy) * 0.055;

    // Far blobs move opposite the mouse (subtle counter-parallax)
    if (farLayer) farLayer.style.transform = `translate(${cx * -8}px, ${cy * -5}px)`;
    // Orb tilts and shifts in mouse direction (mid)
    if (orb) orb.style.transform =
      `translate(${cx * 14}px, ${cy * 9}px) rotateX(${-cy * 7}deg) rotateY(${cx * 7}deg)`;
    // Tags move most strongly (near layer)
    if (nearLayer) nearLayer.style.transform = `translate(${cx * 24}px, ${cy * 16}px)`;

    requestAnimationFrame(lerpParallax);
  };
  lerpParallax();
}

/* ─── Navigation ──────────────────────────────────── */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', () => nav.classList.toggle('is-open'));
  }
  // Close menu when a link is clicked (mobile)
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('is-open'));
  });
}

function initLangToggle() {
  const btn = document.querySelector('.nav__lang');
  if (!btn) return;
  btn.addEventListener('click', () => i18n.toggle());
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
  const panel = document.querySelector('.discover__panel');
  const panelImg = panel?.querySelector('.discover__panel-img');
  const panelTitle = panel?.querySelector('[data-panel-title]');
  const panelDesc = panel?.querySelector('[data-panel-desc]');
  const closeBtn = panel?.querySelector('.discover__panel-close');

  // Map pin id -> image filename (custom photos can replace these)
  const pinImages = {
    waterfront: 'assets/images/discover/waterfront-dock.webp',
    lookout: 'assets/images/discover/sea-lookout.webp',
    library: 'assets/images/discover/coastal-library.webp',
    cafe: 'assets/images/discover/slow-cafe.webp',
    gallery: 'assets/images/discover/art-gallery.webp',
    bike: 'assets/images/discover/bike-path.webp'
  };

  const showPanel = (id) => {
    pins.forEach(p => p.classList.toggle('is-active', p.dataset.id === id));
    const dict = window.i18n?.dict;
    const point = dict?.discover?.points?.[id];
    if (!point) return;
    panelTitle.textContent = point.title;
    panelDesc.textContent = point.description;
    if (pinImages[id]) panelImg.style.backgroundImage = `url('${pinImages[id]}')`;
    panel.classList.add('is-visible');
    panel.dataset.activeId = id;
  };

  pins.forEach(pin => {
    pin.addEventListener('click', () => showPanel(pin.dataset.id));
  });

  closeBtn?.addEventListener('click', () => {
    panel.classList.remove('is-visible');
    pins.forEach(p => p.classList.remove('is-active'));
    delete panel.dataset.activeId;
  });

  // Re-translate the open panel when language changes
  document.addEventListener('i18n:applied', () => {
    if (panel.dataset.activeId) showPanel(panel.dataset.activeId);
  });

  // Show waterfront by default (matches your reference screenshot)
  showPanel('waterfront');
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

/* ─── Seat Map ────────────────────────────────────── */
const seatState = {
  selected: null
};

function initSeatMap() {
  const seats = document.querySelectorAll('.seat');
  seats.forEach(seat => {
    seat.addEventListener('click', () => {
      if (seat.dataset.state === 'occupied') return;
      // Clear previous
      seats.forEach(s => { if (s.dataset.state === 'selected') s.dataset.state = 'available'; });
      seat.dataset.state = 'selected';
      seatState.selected = seat.dataset.seat;
      updateBookingSummary();
    });
  });
}

function updateBookingSummary() {
  const el = document.querySelector('.booking-confirm__summary');
  if (!el) return;

  const dict = window.i18n?.dict;
  const date = calendarState.selected;
  const time = document.querySelector('.timeslot.is-active')?.textContent;
  const seat = seatState.selected;

  const months = dict?.reading?.months || [];
  const dateStr = date ? `${months[date.getMonth()] || date.getMonth() + 1} ${date.getDate()}` : '—';
  const timeStr = time || '—';
  const seatStr = seat ? `Seat ${seat}` : '—';

  el.innerHTML = `<strong>${dateStr}</strong> · ${timeStr} · ${seatStr}`;
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
