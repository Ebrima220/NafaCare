# Improvements

Ranked after inspecting `main` on 22 September 2026. Highest-impact work first.

## What is already strong

Keep these. They are the product’s advantage.

- Clear three-tool story: chat, map, professionals.
- Gambia-specific AI prompt (local diseases, culture, language greetings, affordability).
- Live OSM facilities instead of a fake map.
- Mobile-first overlays (bottom sheets, drag handle, `dvh`, body-scroll lock).
- Dark mode that actually follows the rest of the UI.
- WhatsApp as a realistic contact path for The Gambia.
- Panel state lifted to `App.jsx` so any CTA can open a tool.

## P0 — fix before anyone uses this in public

| ID | Issue | Why it matters | Spec |
|----|-------|----------------|------|
| P0-1 | Gemini API key is bundled in the browser (`VITE_GEMINI_API_KEY`) | Anyone can steal the key and run up cost or abuse the model | Merge `/api/chat` from `greeting-bot-integration`; never prefix AI keys with `VITE_` |
| P0-2 | Hero claims “Private. Secure.” | False advertising for a health product; trust and legal risk | Change copy until consent, privacy policy, and server-side AI exist |
| P0-3 | No Privacy Policy or Terms | Footer links are `#`; health chat is PHI-adjacent | Add real pages before public launch |
| P0-4 | Health-tip images 404 | `/images/water.jpg`, `healthy-food.jpg`, `sleep.jpg` are missing | Add assets or drop `<img>` for CSS placeholders |
| P0-5 | “Join as a Provider” is a no-op | Primary navbar CTA does nothing | Waitlist form or remove the button until the flow exists |

## P1 — make the three tools honest and useful

| ID | Issue | Improvement |
|----|-------|-------------|
| P1-1 | Doctors are six fictional profiles with `@nafacare.gm` emails | Move to a data file; mark as “sample” or replace with verified people |
| P1-2 | “Book Now” / “Available Now” imply scheduling | Rename to “Contact” / “Reach a professional”; keep WhatsApp |
| P1-3 | No emergency CTA in the UI | Put 116 / 117 (or current Gambia emergency numbers) on chat, map, and navbar |
| P1-4 | Chat history dies on refresh | Optional local save behind an explicit consent toggle |
| P1-5 | OSM data can be incomplete or stale | Show “sourced from OpenStreetMap” + a report-inaccuracy link |
| P1-6 | `.env.example` still documents OpenRouter | Document server `GEMINI_API_KEY` only |
| P1-7 | Unused `@google/genai` + empty `src/main.js` | Remove dead code and unused dependency |
| P1-8 | No README | Setup, env vars, how to run, what the product is |

## P2 — product depth

| ID | Improvement |
|----|-------------|
| P2-1 | Provider waitlist: name, license number, facility, phone, email |
| P2-2 | Filter doctors by specialty and city |
| P2-3 | Chat → map handoff (“Find care near me” from an AI reply) |
| P2-4 | Wolof / Mandinka / French (even a language toggle on the landing page) |
| P2-5 | Facility list: phone, hours, and type filters that actually work on mobile |
| P2-6 | Health tips written for The Gambia (malaria nets, ORS, ANC), not generic WHO cards |
| P2-7 | React Router for `/privacy`, `/terms`, `/providers/join` |

## P3 — production platform

| ID | Improvement |
|----|-------------|
| P3-1 | TypeScript + ESLint |
| P3-2 | Vitest for prompt-scope refusals, Gambia bounds, Haversine, doctor links |
| P3-3 | CI: install, lint, test, `vite build` on every push |
| P3-4 | Verified provider database, admin review, credential check |
| P3-5 | Auth for providers; optional accounts for patients |
| P3-6 | Rate limiting and abuse controls on `/api/chat` |
| P3-7 | Error monitoring (e.g. Sentry) |
| P3-8 | Overpass fallback / self-hosted interpreter |
| P3-9 | WCAG pass on chat, map, and overlays |
| P3-10 | Clinical review of the system prompt and suggested questions |

## Copy and UX nits

- Navbar “Health Professionals” never highlights as active because `#professionals` is a card id inside Features, not a section the overlay owns.
- Doctor cards use `max-w-xs mx-auto` — they look narrow in the 420px sidebar.
- Chat message keys use array indexes.
- Leaflet CSS comes from a CDN while JS is bundled — pin both the same way.
- `.gitignore` pattern `.env.*` can ignore `.env.example`; use `!.env.example`.

## Non-goals (do not build yet)

- Diagnosing or prescribing.
- Storing medical records.
- Payments.
- Full EMR / hospital integration.

NafaCare should get people **information and a path to care**, not replace a clinician.
