# Current Features

Behavior as implemented on `main`. Gaps are listed in [04-improvements.md](./04-improvements.md).

## Landing page

### Hero (`Hero.jsx`)

- Badge: “AI Assisted Healthcare”.
- Headline: “Your Private AI Health Assistant”.
- Primary CTA opens the chat overlay.
- Secondary CTA opens the map overlay.
- Privacy line: “Private. Secure. Always here for you.”
- ECG-style graphic and stethoscope image (`/images/stethoscope-image.jpg`).

### How it works (`HowItWorks.jsx`)

Three steps: describe symptoms → get AI guidance → find the right care.

### Features (`Features.jsx`)

Three cards with live buttons:

| Card | Button | Action |
|------|--------|--------|
| AI Symptom Checker | Start Chat | Opens `AiChat` |
| Find Health Centers | Find Near Me | Opens `HealthCentersMap` |
| Talk to a Professional | Book Now | Opens `DoctorsPanel` (WhatsApp, not a booking system) |

### Health tips (`HealthTips.jsx`)

Three WHO-linked cards: hydration, diet, sleep. Image paths `/images/water.jpg`, `/images/healthy-food.jpg`, and `/images/sleep.jpg` **do not exist**.

### CTA (`CTA.jsx`)

Green band with Check Symptoms and Find Health Centers.

### Navbar (`Navbar.jsx`)

- Hash links: Home, Features, How It Works, Health Tips.
- “Health Professionals” opens the doctors overlay instead of scrolling.
- Dark mode toggle.
- “Join as a Provider” calls `preventDefault()` and does nothing.
- `onSignUpProfessional` is accepted but never passed from `App.jsx`.

### Footer (`Footer.jsx`)

Brand blurb, quick links, services list, “Why NafaCare”. Privacy Policy and Terms point to `#`.

## AI Symptom Checker (`AiChat.jsx`)

**Goal:** Gambia-focused health Q&A with a hard off-topic refusal.

**Behavior:**

- Overlay: mobile bottom sheet (~92dvh), desktop right sidebar.
- System prompt: health-only scope, greetings and thanks allowed, West African / Gambian context, emergency escalation, structured answers, no inline disclaimers (UI shows a banner instead).
- Suggested prompts: malaria, typhoid, HIV testing, dehydration, pregnancy nutrition.
- Streams Gemini via `streamGenerateContent` SSE.
- Discovers models with `ListModels`, prefers `2.5-flash` then fallbacks.
- If `VITE_GEMINI_API_KEY` is missing, types a setup message into the chat.
- Markdown-lite rendering (headings, bold, bullets).
- Clear chat, loading, and error states.
- Messages live in React state only (lost on refresh).

**Not implemented:** server proxy on `main`, consent, persistence, rate limits, emergency phone CTA in the UI.

## Health centers map (`HealthCentersMap.jsx`)

**Goal:** Show nearby OSM healthcare amenities in The Gambia.

**Behavior:**

- Requests geolocation; falls back to Banjul (`13.4549, -16.5790`).
- Clamps coordinates to a Gambia bounding box.
- Queries Overpass for hospital, clinic, pharmacy, health_post, doctors, dentist (nodes and ways).
- Color-coded markers, Haversine distance, radius 5 / 10 / 20 / 50 km (default 20).
- Desktop list + map; mobile map with a bottom card.
- Dark-mode aware popups.

**Not implemented:** curated / verified facilities, opening-hours reliability, emergency overlay, Overpass fallback, offline cache.

## Doctors directory (`DoctorsPanel.jsx`)

**Goal:** Let a user reach a professional by phone, email, or WhatsApp.

**Behavior:**

- Six hardcoded profiles (name, specialty, phone, WhatsApp, email, city, bio).
- WhatsApp deep link with a pre-filled “found you on NafaCare” message.
- Credential-verification disclaimer.
- Header says “Available Now”.

**Not implemented:** real verified roster, booking, availability, provider onboarding, search/filter.

## Theme (`useDarkMode.js`)

Reads `localStorage.theme`, else `prefers-color-scheme`. Toggles the `dark` class on `<html>`.
