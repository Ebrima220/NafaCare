# Data and APIs

## Persistence today

| Data | Where | Lifetime |
|------|-------|----------|
| Theme | `localStorage.theme` | Until cleared |
| Chat messages | React state | Until overlay unmount / refresh |
| Facilities | Overpass response | Until map closes or radius changes |
| Doctors | `DOCTORS` constant in `DoctorsPanel.jsx` | Deploy-time |
| Health tips | `tips` constant in `HealthTips.jsx` | Deploy-time |

No database, no CMS, no user table.

## Doctor record

```ts
type Doctor = {
  id: number
  name: string
  specialty: string
  phone: string          // e.g. +220 772 1234
  whatsapp: string       // digits only, country code, no +
  email: string
  location: string       // city, The Gambia
  avatar: string         // initials
  color: string          // Tailwind bg-* class
  bio: string
}
```

**Target:** same shape in `src/data/doctors.json` (or a CMS), plus:

```ts
type DoctorRecord = Doctor & {
  verified: boolean
  licenseId?: string
  languages?: string[]
  sample?: boolean       // true while using placeholder profiles
}
```

## Facility record (from OSM)

Parsed in `HealthCentersMap.jsx`:

```ts
type Facility = {
  id: string
  lat: number
  lon: number
  name: string
  type: 'hospital' | 'clinic' | 'pharmacy' | 'health_post' | 'health' | 'doctors' | 'dentist'
  label: string
  icon: unknown
  phone?: string
  opening?: string
  website?: string
  dist: number           // km from user
}
```

Gambia box used for clamping:

- south `13.065`, west `-16.825`, north `13.825`, east `-13.797`
- map center `[13.4432, -15.3101]`
- geolocation fallback: Banjul `[13.4549, -16.5790]`

## Chat message

```ts
type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}
```

Sent to Gemini as `contents[]` with `role: user | model`. System prompt is separate (`system_instruction`).

## External APIs (main)

| API | Caller | Method | Auth |
|-----|--------|--------|------|
| `generativelanguage.googleapis.com/v1beta/models` | `AiChat.jsx` | GET | Query `key=` |
| `.../models/{model}:streamGenerateContent?alt=sse` | `AiChat.jsx` | POST | Query `key=` |
| `overpass-api.de/api/interpreter` | `HealthCentersMap.jsx` | POST | None |
| `{s}.tile.openstreetmap.org` | Leaflet | GET | None |
| `wa.me/{number}` | `DoctorsPanel.jsx` | Navigation | None |
| WHO fact-sheet URLs | `HealthTips.jsx` | Navigation | None |

## Internal API (unmerged)

`Nafa-Care.worktrees/greeting-bot-integration/api/chat.js`

```
POST /api/chat
Content-Type: application/json

{ "messages": [{ "role": "user" | "assistant", "content": string }] }

200 { "text": string }
400 { "error": "No messages were provided." }
405 { "error": "Method not allowed." }
5xx { "error": "The AI assistant is currently unavailable..." }
```

Env: `GEMINI_API_KEY` (preferred), else `GOOGLE_API_KEY`, else `VITE_GEMINI_API_KEY`. Optional `GEMINI_MODEL` (default `gemini-2.5-flash`). User content is truncated to 12 000 characters.

**Gaps in the proxy:** no streaming, no origin check, no rate limit, no auth, prompt still duplicated.

## Env vars

| Name | Where it should live | Today |
|------|----------------------|-------|
| `GEMINI_API_KEY` | Server only (Vercel env + local `.env`) | Read by `server/gemini.js`. `VITE_GEMINI_API_KEY` is still accepted as a fallback so an existing Vercel variable keeps working. |
| `GEMINI_MODEL` | Server | Hardcoded preference list in the client |
| `VITE_OPENROUTER_API_KEY` | — | Documented in `.env.example`, unused |

Do not add new `VITE_*` secrets. Anything prefixed `VITE_` is public.
