# Product Overview

## Problem

People in The Gambia need a simple way to understand symptoms, find nearby care, and reach a health professional — including on mobile, with limited bandwidth, and without assuming medical knowledge.

## Product

**NafaCare** is a single-page web app that offers three tools from one landing page:

1. **AI Symptom Checker** — a Gambia-focused Gemini chat for health questions only.
2. **Find Health Centers** — a map of nearby hospitals, clinics, pharmacies, and related facilities from OpenStreetMap.
3. **Talk to Professionals** — a directory of healthcare workers with phone, email, and WhatsApp.

The current build is a **polished prototype / marketing MVP**, not a production healthcare platform. There are no accounts, no medical records, no appointment backend, and no verified provider registry.

## Audience

| Audience | Need |
|----------|------|
| Gambian residents | Symptom guidance, nearby facilities, a path to a human clinician |
| Visitors | Locate care quickly, understand local health context |
| Healthcare providers | Join the directory and receive consultation requests (UI exists; flow does not) |

## Value proposition (as marketed)

> Check your symptoms, find nearby health centers, and request to speak with a healthcare professional all in one simple place.

Hero copy also claims **“Private. Secure. Always here for you.”** The implementation does not yet support that claim (see [06-security.md](./06-security.md)).

## Current surface

There is no router. The app is one page with hash sections and overlay panels.

| Surface | Type | Status |
|---------|------|--------|
| Home / hero | Section `#home` | Working |
| How it works | Section `#how-it-works` | Working |
| Features | Section `#features` | Working |
| Health tips | Section `#health-tips` | Working, but images are missing |
| CTA band | Section | Working |
| Footer | Site chrome | Privacy / Terms links are dead |
| AI chat | Overlay | Working, key is client-side |
| Facility map | Overlay | Working via Overpass |
| Doctors directory | Overlay | Working, 6 hardcoded profiles |
| Join as a Provider | Navbar button | No-op |
| Dark mode | Global | Working (`localStorage`) |

## Positioning for the next version

NafaCare should remain a **navigation and guidance product**, not a diagnostic system:

- AI gives general information and escalation advice, never a diagnosis.
- Map and directory get people to real care.
- WhatsApp stays a valid first contact channel for The Gambia.
- Privacy, consent, and verified providers become table stakes before a public healthcare launch.
