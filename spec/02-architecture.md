# Architecture

## Stack

| Layer | Today | Target |
|-------|-------|--------|
| UI | React 19, Vite 8, Tailwind CSS 4, JSX | Same; consider TypeScript |
| Routing | None (hash anchors + overlays) | React Router if legal pages and provider signup are added |
| Maps | Leaflet + OSM tiles + Overpass API | Same, with a fallback tile/Overpass host |
| AI | Serverless `POST /api/chat` (`api/chat.js` + `server/gemini.js`). The browser never sees the key. | Same |
| Backend | None on `main` | Vercel (or equivalent) functions + a provider store |
| Database | None | Start with JSON/CMS, then Postgres |
| Auth | None | Needed for providers and optional user history |
| State | React `useState`; theme in `localStorage` | Keep local for UI; persist chat only with consent |

## Source layout

```
Nafa-Care/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          # stale (OpenRouter); code uses Gemini
├── public/
│   └── images/           # only stethoscope-image.jpg exists
└── src/
    ├── main.jsx          # entry
    ├── main.js           # empty dead file — delete
    ├── App.jsx           # layout + overlay state
    ├── style.css
    ├── hooks/useDarkMode.js
    └── components/
        ├── Navbar.jsx
        ├── Hero.jsx
        ├── HowItWorks.jsx
        ├── Features.jsx
        ├── HealthTips.jsx
        ├── CTA.jsx
        ├── Footer.jsx
        ├── AiChat.jsx
        ├── HealthCentersMap.jsx
        └── DoctorsPanel.jsx
```

## Runtime shape

```
Browser
  ├── Landing page (App)
  │     Hero / HowItWorks / Features / HealthTips / CTA / Footer
  ├── AiChat ── POST /api/chat ── server/gemini.js ── Gemini (key stays on the server)
  ├── HealthCentersMap ── POST overpass-api.de + OSM tiles
  └── DoctorsPanel ────── hardcoded array → tel / mailto / wa.me
```

`App.jsx` owns three booleans (`chatOpen`, `mapOpen`, `doctorsOpen`) so any section can open a panel. That pattern should stay.

## Deployment

- Scripts: `dev`, `build`, `preview` only.
- `vercel.json` sends page routes to the Vite app and leaves `/api/*` as serverless functions.
- `dist/` is the static frontend. Deploy the repo root on Vercel, not the `dist` folder by itself.
- Leaflet CSS is loaded from `unpkg.com` in `index.html`; the JS library is bundled.

## Known architecture debt

1. **`@google/genai` is installed but unused** — the server calls Gemini with `fetch`.
2. **No tests, lint, types, or CI.**
3. **Vercel must have `GEMINI_API_KEY` set**, then the project must be redeployed. A local `.env` is not uploaded.

## Target architecture (phase 1)

```
Browser
  ├── Landing + overlays (unchanged UX)
  └── POST /api/chat  ──►  serverless function  ──►  Gemini
        (key stays in server env)

Map still calls Overpass from the browser (acceptable for MVP).
Doctors load from a data file or CMS, not a JSX constant.
```
