# Roadmap

Three phases. Do not skip Phase 1 for new features.

## Phase 1 — Honest, safe prototype (1–2 weeks)

Ship a version you can demo without leaking keys or lying about security.

- [ ] Merge server-side `/api/chat`; remove `VITE_GEMINI_API_KEY` from the client
- [ ] Rewrite `.env.example`; allow `.env.example` in git (`!.env.example`)
- [ ] Add README (setup, scripts, env, product one-liner)
- [ ] Fix or replace missing health-tip images
- [ ] Soften copy: drop “Private. Secure.” until it is true; rename “Book Now”
- [ ] Privacy Policy and Terms pages (even static)
- [ ] Emergency numbers in chat + map headers
- [ ] Label doctors as sample **or** replace with real consented profiles
- [ ] “Join as a Provider” → simple waitlist (Formspree, Google Form, or mailto) — or hide the button
- [ ] Delete `src/main.js`; drop unused `@google/genai` if still unused
- [ ] `npm run build` in GitHub Actions

**Exit:** a stranger can use the site; the Gemini key is not in DevTools; legal pages exist.

## Phase 2 — Useful MVP (3–6 weeks)

Make the three tools complete for Gambian users.

- [ ] `src/data/doctors.json` + specialty/city filters
- [ ] Provider waitlist stored somewhere you can review
- [ ] Chat action that opens the map (“find a clinic near me”)
- [ ] OSM attribution + “report a missing facility”
- [ ] Gambia-specific health tips
- [ ] Language: English + one local language on the landing page
- [ ] Consent toggle if chat history is saved locally
- [ ] Rate limit on `/api/chat`
- [ ] Restore streaming through the proxy (SSE or chunked)

**Exit:** a user can check a symptom, find a real nearby facility, and contact a professional without hitting dead buttons.

## Phase 3 — Platform (ongoing)

Only after Phase 2 is in daily use.

- [ ] Verified provider registry and admin review
- [ ] TypeScript, ESLint, Vitest around prompt scope and map geo helpers
- [ ] Optional patient accounts
- [ ] Monitoring and uptime
- [ ] Overpass fallback
- [ ] Accessibility audit
- [ ] Clinical review of the system prompt

## Suggested first implementation ticket

**Move Gemini behind `/api/chat` and stop shipping the API key.**

That single change unblocks honest marketing, lower cost risk, and every later backend feature. The worktree already contains most of the handler; finish it (streaming + rate limit) and point `AiChat.jsx` at `POST /api/chat`.
