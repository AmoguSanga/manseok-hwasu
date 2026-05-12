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
  initDiscoverMap();
  initCalendar();
  initSeatMap();
  initSeasonalTabs();
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
  const panel = document.querySelector('.discover__panel');
  const panelImg = panel?.querySelector('.discover__panel-img');
  const panelTitle = panel?.querySelector('[data-panel-title]');
  const panelDesc = panel?.querySelector('[data-panel-desc]');
  const closeBtn = panel?.querySelector('.discover__panel-close');

  const pinImages = {
    waterfront: 'assets/images/discover/waterfront-dock.webp',
    lookout: 'assets/images/discover/sea-lookout.webp',
    library: 'assets/images/discover/coastal-library.webp',
    cafe: 'assets/images/discover/slow-cafe.webp',
    gallery: 'assets/images/discover/art-gallery.webp',
    bike: 'assets/images/discover/bike-path.webp'
  };

  const applyContent = (id) => {
    const dict = window.i18n?.dict;
    const point = dict?.discover?.points?.[id];
    if (!point) return;
    panelTitle.textContent = point.title;
    panelDesc.textContent = point.description;
    if (pinImages[id]) panelImg.style.backgroundImage = `url('${pinImages[id]}')`;
  };

  const showPanel = (id, animate = true) => {
    pins.forEach(p => p.classList.toggle('is-active', p.dataset.id === id));
    panel.dataset.activeId = id;

    if (!animate) {
      applyContent(id);
      panel.classList.add('is-visible');
      return;
    }

    if (panel.classList.contains('is-visible')) {
      // Panel is already open — briefly fade content then update
      panel.classList.add('is-refreshing');
      setTimeout(() => {
        applyContent(id);
        panel.classList.remove('is-refreshing');
      }, 160);
    } else {
      applyContent(id);
      // Double rAF so the browser paints the initial hidden state first
      requestAnimationFrame(() => requestAnimationFrame(() => {
        panel.classList.add('is-visible');
      }));
    }
  };

  pins.forEach(pin => {
    pin.addEventListener('click', () => showPanel(pin.dataset.id));
  });

  closeBtn?.addEventListener('click', () => {
    panel.classList.remove('is-visible');
    pins.forEach(p => p.classList.remove('is-active'));
    delete panel.dataset.activeId;
  });

  document.addEventListener('i18n:applied', () => {
    if (panel.dataset.activeId) showPanel(panel.dataset.activeId, false);
  });
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

/* ─── Booking confirmation modal ─────────────────── */
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (!modal) return;

  const overlay = document.getElementById('bookingModalOverlay');
  const closeBtn = document.getElementById('bookingModalClose');
  const confirmBtn = document.querySelector('.booking-confirm .btn--accent');
  const sparklesEl = document.getElementById('bookingSparkles');

  const SPARK_COLORS = ['#97D5FF','#84E3E9','#FFC229','#FF7746','#fff'];

  const launchSparkles = () => {
    sparklesEl.innerHTML = '';
    const cx = sparklesEl.offsetWidth / 2;
    const cy = sparklesEl.offsetHeight * 0.35;
    for (let i = 0; i < 22; i++) {
      const el = document.createElement('div');
      el.className = 'booking-success__spark';
      const angle = (i / 22) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      el.style.cssText = `
        left:${cx}px; top:${cy}px;
        background:${SPARK_COLORS[i % SPARK_COLORS.length]};
        --dx:${Math.cos(angle) * dist}px;
        --dy:${Math.sin(angle) * dist - 40}px;
        animation-delay:${Math.random() * 200}ms;
        width:${4 + Math.random() * 5}px;
        height:${4 + Math.random() * 5}px;
      `;
      sparklesEl.appendChild(el);
    }
  };

  const openModal = () => {
    const dict = window.i18n?.dict;
    const months = dict?.reading?.months || [];
    const date = calendarState.selected;
    const time = document.querySelector('.timeslot.is-active')?.textContent?.trim();
    const seat = seatState.selected;

    document.getElementById('confirmDate').textContent =
      date ? `${months[date.getMonth()] || ''} ${date.getDate()}` : '—';
    document.getElementById('confirmTime').textContent = time || '—';
    document.getElementById('confirmSeat').textContent = seat ? `Seat ${seat}` : '—';

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    launchSparkles();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  confirmBtn?.addEventListener('click', () => {
    if (!calendarState.selected || !document.querySelector('.timeslot.is-active') || !seatState.selected) {
      // Shake the confirm row if incomplete
      const row = document.querySelector('.booking-confirm');
      row.style.animation = 'none';
      row.offsetHeight; // reflow
      row.style.animation = 'shake 400ms ease';
      return;
    }
    openModal();
  });

  overlay?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
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
