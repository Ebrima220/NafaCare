# NafaCare Spec

This folder is the product and engineering specification for **NafaCare**, a Gambian healthcare navigation app.

It captures what exists today, what should change, and the order of work. Treat these files as the source of truth for new features until they are replaced by implementation.

| File | Purpose |
|------|---------|
| [01-product-overview.md](./01-product-overview.md) | What NafaCare is, who it is for, and the current product surface |
| [02-architecture.md](./02-architecture.md) | Stack, layout, state, and deployment model |
| [03-current-features.md](./03-current-features.md) | Feature-by-feature behavior as implemented |
| [04-improvements.md](./04-improvements.md) | Ranked gaps, bugs, and product improvements |
| [05-data-and-apis.md](./05-data-and-apis.md) | Data shapes and third-party integrations |
| [06-security.md](./06-security.md) | Security, privacy, and clinical-safety requirements |
| [07-roadmap.md](./07-roadmap.md) | Phased plan from prototype to public launch |

**Inspection date:** 22 September 2026  
**Codebase:** `Nafa-Care` on `main` (React + Vite prototype, no backend)  
**Related branch:** `agents/greeting-bot-integration` adds a server-side `/api/chat` proxy that is not yet on `main`.
