# Manseok-Hwasu — Digital Detox Coast

Interactive coastal website for Dong-gu, Incheon. Clean minimal feel with subtle neomorphic depth, a soft brand-aligned color palette, and built-in i18n (EN / KO ready, more languages drop-in).

---

## How to run locally

This now includes a tiny Node server for the live tide cache. Use it when you want `/api/tide` and Stormglass integration:

```bash
cd manseok-hwasu
cp .env.example .env
# Add your rotated Stormglass key to .env
node server.mjs
# Then open http://localhost:8080
```

The Stormglass key must stay in `.env`; never put it in browser JavaScript or HTML. The server refreshes the tide cache at most 6 times per day and the page reads the cached result from `/api/tide`.

## Cloudflare Pages tide setup

Cloudflare Pages will deploy `functions/api/tide.js` as the live `/api/tide` endpoint. Preview deployments return a pending tide placeholder in high-tide visual mode and do not call Stormglass. Production deployments use Stormglass only when the KV cache is missing or older than 4 hours.

To keep the 24-hour / 6-refresh system working after git pushes:

1. In Cloudflare, create a Workers KV namespace for the tide cache.
2. In your Pages project Production environment, go to Settings > Bindings and add that namespace with the variable name `TIDE_CACHE`.
3. In Production Settings > Variables and Secrets, add `STORMGLASS_API_KEY` as an encrypted secret.
4. Optional: add plain variables `TIDE_LAT=37.488407` and `TIDE_LNG=126.612296`.
5. Add `TIDE_API_ENABLED=true` in Production.
6. Add `TIDE_API_ENABLED=false` in Preview, and do not add `STORMGLASS_API_KEY` to Preview.
7. Redeploy the Pages project after adding the binding and secret.

The KV cache persists across deployments, so normal git pushes will not reset the 4-hour refresh window. Preview deployments should remain unconfigured for Stormglass; they will show tide pending while the scene stays in high-tide mode.

## Cloudflare Pages community setup

The live forum, event comments, profile avatars, and anonymous engagement stats use `/api/community`. Nothing personal is required for tracking: the browser creates a random visitor id and the API stores aggregate page views, section views, dwell time, and comment counts.

1. In Cloudflare, create a Workers KV namespace for engagement data.
2. In your Pages project Production environment, add the namespace binding as `ENGAGEMENT_STORE`.
3. In Production Settings > Variables and Secrets, add `ADMIN_PASSWORD` as an encrypted secret. If this secret is omitted, the current fallback admin password is `123`.
4. Redeploy the Pages project.

If `ENGAGEMENT_STORE` is missing, the function falls back to `TIDE_CACHE`, but a separate binding is cleaner. The admin password defaults to `123` unless `ADMIN_PASSWORD` is set as a secret. For shared local testing, run `node server.mjs`; comments, forum posts, replies, and stats are written to `.cache/community-*.json`. Plain `npx serve` cannot run `/api/community`, so the forum falls back to browser-local storage in that mode. That is useful for UI testing, but it is not shared between visitors.

For a static-only preview without live tide data, pick one:

```bash
# Python (recommended — already installed almost everywhere)
cd manseok-hwasu
python3 -m http.server 8080
# Then open http://localhost:8080
```

```bash
# Or, if you have Node:
npx serve .
```

```bash
# Or, if you have PHP:
php -S localhost:8080
```

---

## Project structure

```
manseok-hwasu/
├── index.html                  ← single-page entry; every section lives here
│
├── css/
│   ├── main.css                ← design tokens (color, type, neomorphism shadows), reset, nav, footer, buttons, cards
│   └── sections.css            ← per-section styles (hero, visit, discover map, booking, seasonal, community)
│
├── js/
│   ├── i18n.js                 ← language loader. Reads /locales/*.json and swaps text
│   └── app.js                  ← interactivity: map pins, calendar, seat picker, seasonal tabs, scroll reveals
│
├── locales/
│   ├── en.json                 ← English copy
│   └── ko.json                 ← Korean copy
│
└── assets/
    ├── logos/
    │   └── manseok-logo.svg    ← brand mark (your uploaded file)
    │
    └── images/
        ├── hero/
        │   └── hero-coast-sunset.svg          ← REPLACE: 1920×1080 hero photo
        │
        ├── discover/
        │   ├── discover-bg.svg                ← REPLACE: panoramic coast photo (map background)
        │   ├── waterfront-dock.svg            ← REPLACE: 800×600 detail photo
        │   ├── sea-lookout.svg                ← REPLACE: 800×600 detail photo
        │   ├── coastal-library.svg            ← REPLACE: 800×600 detail photo
        │   ├── slow-cafe.svg                  ← REPLACE: 800×600 detail photo
        │   ├── art-gallery.svg                ← REPLACE: 800×600 detail photo
        │   └── bike-path.svg                  ← REPLACE: 800×600 detail photo
        │
        ├── reading/
        │   ├── reading-room-bg.svg            ← REPLACE: premium room interior
        │   ├── reading-zone-1.svg             ← REPLACE: North Pavilion
        │   ├── reading-zone-2.svg             ← REPLACE: Sunset Bench
        │   └── reading-zone-3.svg             ← REPLACE: Library Steps
        │
        ├── seasonal/
        │   ├── spring.svg                     ← REPLACE: spring photo
        │   ├── summer.svg                     ← REPLACE: summer photo
        │   ├── autumn.svg                     ← REPLACE: autumn photo
        │   └── winter.svg                     ← REPLACE: winter photo
        │
        └── community/
            ├── community-bg.svg               ← REPLACE: group / event photo (reserved for future)
            ├── story-1.svg                    ← REPLACE: visitor story photo
            ├── story-2.svg                    ← REPLACE: visitor story photo
            └── story-3.svg                    ← REPLACE: visitor story photo
```

---

## Replacing photos

Every image slot has a placeholder SVG with the section name and the **suggested dimensions** painted on it, so when you preview the site you can see at a glance which slot is which.

To replace a photo: **save your photo with the same filename**, in the same folder, but with a real extension (`.jpg`, `.webp`, `.png`). For example:

```
assets/images/hero/hero-coast-sunset.svg     ← placeholder (delete after replacing)
assets/images/hero/hero-coast-sunset.jpg     ← your photo
```

Then update the reference in **two places**:

1. **CSS** — for `hero-coast-sunset` only, edit `css/sections.css` line referencing `hero-coast-sunset.svg`.
2. **JavaScript** — for discover pins and seasonal images, edit the `pinImages` and `seasonImgs` objects in `js/app.js`.

Or simpler: keep the `.svg` extension on your file (Photoshop/Figma can export SVGs that wrap a JPEG). Either works.

### Recommended dimensions

| Slot                    | Min size      | Aspect ratio  | Notes                              |
| ----------------------- | ------------- | ------------- | ---------------------------------- |
| Hero                    | 1920 × 1080   | 16:9          | Will be partially overlaid by text |
| Discover background     | 1920 × 1080   | ~16:9         | The map base image                 |
| Discover detail cards   | 800 × 600     | 4:3           | Shown in the slide-up panel        |
| Reading room background | 1920 × 1080   | 16:9          |                                    |
| Reading zone cards      | 1200 × 800    | 3:2           | Shown on a 200px tall card         |
| Seasonal photos         | 1200 × 800    | 3:2           | Half of a wide panel               |
| Visitor stories         | 600 × 600     | 1:1 (square)  | Card thumbnails                    |

---

## Editing copy (text)

**All text lives in the locale JSON files.** Never edit the HTML to change a phrase — change the JSON and both languages update.

Files:
- `locales/en.json` — English
- `locales/ko.json` — Korean

To change the hero title in both languages: open both files, find `hero.title`, edit. Done.

---

## Adding a new language

1. **Copy** `locales/en.json` to `locales/ja.json` (for Japanese, for example) or `locales/zh.json`.
2. **Translate** the values inside.
3. **Open** `js/i18n.js` and add the code to the supported list:

   ```js
   const SUPPORTED_LANGS = ['en', 'ko', 'ja']; // ← added 'ja'
   ```

4. **(Optional)** Update the `nav__lang` button label cycle in `js/i18n.js` `toggle()` if you want a 3-way cycle. The current toggle just flips between EN ↔ KO.

That's it — no HTML changes needed. Every text element is wired up via `data-i18n="dotted.path"`.

---

## Color palette (used everywhere via CSS variables)

Defined in `css/main.css` `:root`:

| Token                  | Value     | Used for                                      |
| ---------------------- | --------- | --------------------------------------------- |
| `--primary-sky`        | `#97D5FF` | accents, highlights                           |
| `--secondary-aqua`     | `#84E9E0` | seasonal aqua moments                         |
| `--secondary-yellow`   | `#FFC220` | available seats, seat-window highlight        |
| `--secondary-orange`   | `#FF7740` | primary accent, selected states, sunset feel  |
| `--system-white`       | `#FFFAF5` | text on dark, button text                     |
| `--system-black`       | `#292121` | body ink, primary buttons                     |

Want a section to lean more aqua / sky / yellow? Change the local accent in that section's CSS. Don't change the root tokens — they propagate everywhere.

---

## Interactive elements

| Element                   | Where to find             | What it does                                   |
| ------------------------- | ------------------------- | ---------------------------------------------- |
| Top nav                   | always visible            | Auto-highlights the section in view; mobile collapses to hamburger |
| Language toggle (KOR/ENG) | top right                 | Flips between en.json and ko.json instantly    |
| Hero CTAs                 | hero section              | Smooth-scroll to Visit / Discover              |
| Visit cards               | section 02                | Hover lift, click handlers ready for routing   |
| Discover map pins         | section 03                | Click any pin → detail panel slides in         |
| Calendar                  | section 04, left          | Pick a future date; navigates by month         |
| Time slots                | section 04                | Pill picker, single-select                     |
| Seat map                  | section 04, right         | Click yellow seats to select; gray = occupied  |
| Booking summary           | bottom of seatmap         | Auto-fills from date + time + seat selections  |
| Seasonal tabs             | section 05                | Default opens current season; swap on click    |
| Community cards           | section 06                | Forum / Volunteer entry points                 |

---

## Design philosophy

- **Neomorphic surfaces, not glassmorphism.** Cards rise gently from the canvas via paired light/shadow rather than blurred translucent panels. Pressed/inset states for "selected" and "active" elements.
- **Soft, brand-true canvas.** A neutral cool-gray background (`#EEF2F7`) with very subtle radial washes of sky and sunset. The whole page feels lit.
- **Two fonts only.** *Fraunces* (display, with optical sizing) for headings and pull-quotes — it has a lovely warmth that fits a coastal slow-living brand. *Inter* (body) for everything else. *Noto Sans/Serif KR* fall back automatically when Korean is shown.
- **Motion is restrained.** A single page-load reveal cascade. Hover lifts on cards. Soft pulse on map pins. The orbit ring on the hero compass spins once a minute. Nothing flashy.

---

## Browser support

Modern Chrome, Safari, Firefox, Edge. Uses `backdrop-filter`, CSS Grid, IntersectionObserver, ES modules, `fetch()`. No build step, no framework, no node_modules.

---

## License

Project assets © Manseok-Hwasu Digital Detox Coast / Dong-gu Community.
The Manseok logo is your project's IP.
