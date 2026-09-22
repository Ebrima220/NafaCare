# Security, privacy, and clinical safety

NafaCare handles health questions. Treat chat content as sensitive even without a formal medical-record store.

## Current risk

| Severity | Finding | Evidence |
|----------|---------|----------|
| Critical | Gemini API key ships in the JS bundle | `import.meta.env.VITE_GEMINI_API_KEY` in `AiChat.jsx` |
| High | Symptom text is sent to Google with no consent UI | Chat overlay has a medical disclaimer, not a data-processing consent |
| High | Marketing says “Private. Secure.” | `Hero.jsx` — no encryption-at-rest, no accounts, no DPA story |
| High | No Privacy Policy or Terms | Footer `href="#"` |
| Medium | Overpass queried from every visitor’s browser | Abuse and rate-limit exposure |
| Medium | Hardcoded doctor phones/emails presented as available now | Users may share personal health details with unverified contacts |
| Low | WhatsApp pre-filled messages leak intent to Meta | Acceptable if disclosed |

The `greeting-bot-integration` `/api/chat` handler removes the **key-in-browser** issue. It does not by itself make the product private or clinically safe.

## Requirements before public launch

### 1. Secrets

- AI keys live in server environment variables only.
- Client talks to `/api/chat`, never to `generativelanguage.googleapis.com`.
- Rotate any key that was ever in a `VITE_` variable or a public repo.

### 2. Consent and legal pages

- Privacy Policy: what is collected (prompts, IP at the host, geolocation for the map), who receives it (Google Gemini, OSM/Overpass, WhatsApp if the user taps through), retention, how to request deletion.
- Terms: not a doctor, not emergency care, no warranty on OSM or AI accuracy.
- First-open chat: explicit “I understand this is not a diagnosis and my question is sent to our AI provider.”
- Geolocation: browser permission is enough; still explain why in the map UI.

### 3. Clinical safety

- Keep the health-only system prompt.
- Always escalate emergencies in the model instructions **and** show a visible emergency number in the chat and map chrome.
- Do not let the model claim it is a doctor or that NafaCare has verified a diagnosis.
- Mark directory profiles as unverified until a human review exists.
- Suggested prompts must be reviewed for local clinical appropriateness (malaria, typhoid, HIV, pregnancy).

### 4. Application hardening

- Rate-limit `/api/chat` per IP.
- Cap prompt size (proxy already slices to 12 000 chars — keep this).
- Do not log full prompts in production without a retention policy.
- Add a Content-Security-Policy once the API is first-party.
- Prefer same-origin Leaflet CSS instead of unpkg.

### 5. Provider directory

- “Join as a Provider” must collect identity + license details and sit in a review queue.
- Do not show “Available Now” unless availability is real.
- Disclaimer stays until verification is live; then show a verified badge.

## Out of scope until later

HIPAA-style BAAs, audit logs, encryption-at-rest for stored chats, and patient accounts. Those belong to a later clinical product, not this navigation MVP — but the **copy must not pretend they exist**.
