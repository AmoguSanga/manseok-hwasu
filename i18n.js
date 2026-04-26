/* ============================================================
   i18n — Internationalization
   Loads JSON locale files and replaces text on elements that
   carry a data-i18n="dotted.path" attribute.
   To add a language: drop a new JSON into /locales and add
   its code to SUPPORTED_LANGS below.
   ============================================================ */

const SUPPORTED_LANGS = ['en', 'ko'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'mh-lang';

const dictionaries = {};

async function loadLang(lang) {
  if (dictionaries[lang]) return dictionaries[lang];
  try {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) throw new Error(`Failed: ${lang}`);
    const data = await res.json();
    dictionaries[lang] = data;
    return data;
  } catch (e) {
    console.warn('[i18n] could not load', lang, e);
    return dictionaries[DEFAULT_LANG] || null;
  }
}

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
}

function applyDictionary(dict) {
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = resolvePath(dict, key);
    if (typeof val === 'string') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    // format: "attr:path,attr2:path2"
    const pairs = el.getAttribute('data-i18n-attr').split(',');
    pairs.forEach(pair => {
      const [attr, path] = pair.split(':').map(s => s.trim());
      const val = resolvePath(dict, path);
      if (typeof val === 'string') el.setAttribute(attr, val);
    });
  });
  // Document title
  const title = resolvePath(dict, 'site.title');
  if (title) document.title = title;
  // html lang
  document.documentElement.lang = i18n.currentLang;
  // Notify other modules a translation just happened
  document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: i18n.currentLang, dict } }));
}

const i18n = {
  currentLang: DEFAULT_LANG,
  dict: null,
  async init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
    await this.setLang(initial);
  },
  async setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    this.currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    this.dict = await loadLang(lang);
    applyDictionary(this.dict);
  },
  toggle() {
    const next = this.currentLang === 'en' ? 'ko' : 'en';
    return this.setLang(next);
  },
  t(path) {
    return resolvePath(this.dict, path);
  }
};

window.i18n = i18n;
