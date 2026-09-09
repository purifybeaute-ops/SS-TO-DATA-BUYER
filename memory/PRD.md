# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. Core value: TikTok Shop doesn't expose buyer data, so sellers screenshot order pages; the app uses AI vision (Gemini 3 Flash) to extract name, phone, multi-level address, and affiliate creator, dedupes buyers by phone, plots them on an ECharts Indonesia map, supports CSV bulk import, custom tags, WhatsApp broadcast, PDF/CSV exports, audit trail, reminder segments, and full bilingual UI (Bahasa Indonesia / English).

**Preferred user language:** Bahasa Indonesia (Indonesian). All future agents must reply in Indonesian.

## User Personas
- **Owner (Seller)** – full access, including audit log, operator management, PDF header, region rules.
- **Operator (Admin/CS)** – can upload, edit customers, run broadcast; cannot manage users or settings that mutate the store profile.

## Core Requirements (Delivered)
1. JWT auth with seeded owner + operator (`owner@pelangganku.id` / `owner123`, `operator@pelangganku.id` / `operator123`).
2. Screenshot vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion (background job, progress polling).
4. Deduplication by phone (`+62` normalization); repeat-buyer detection.
5. Customer DB with search, tag filter, notes, drawer detail, bulk actions.
6. Region normalization rules (province / kota) with unmapped queue.
7. ECharts Indonesia GeoJSON map + drill-down (province → kota → kecamatan).
8. Creator analytics with niche editing.
9. CSV order import + "Perlu Di-SS" gap analysis + product revenue per variant.
10. Reminder segments (30-59 / 60-89 / 90+ days idle) with WA one-click greet.
11. Segments & Export – CSV, PDF (custom shop header/logo/note), staggered WhatsApp broadcast (min/max delay, pause/resume/stop, progress bar).
12. Owner-only audit trail (mutation actions).
13. Onboarding, branding (PK Batik monogram logo, tagline "Jangkau Ulang Setiap Pembeli").
14. **Bilingual UI (ID/EN)** — custom lightweight i18n via React Context (`/lib/i18n.jsx`), localStorage `pp_lang`, `LanguageSwitcher` component.
15. **Bilingual backend messages** — `Accept-Language` header (`id`/`en`) → FastAPI middleware sets `ContextVar`, `T("key")` translates HTTPException detail. Frontend `axios` interceptor auto-sends the header.

## Architecture
```
/app/
├── backend/
│   ├── server.py         # FastAPI (~1160 lines) — routes, audit, PDF, ZIP, i18n middleware
│   ├── auth.py           # JWT hashing / token helpers
│   ├── vision_service.py # Gemini 3 Flash vision extraction
│   ├── seed_data.py      # Demo owner/operator + ~40 customers
│   ├── i18n.py           # NEW: MESSAGES dict + T() helper + set_lang()
│   └── .env              # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── i18n.jsx       # Big DICT ID/EN + <LanguageProvider> + useT()
│   │   │   ├── api.js         # axios, auto Authorization + Accept-Language
│   │   │   ├── auth.jsx, format.js
│   │   ├── components/
│   │   │   ├── Layout.jsx, Onboarding.jsx, PKLogo.jsx, LanguageSwitcher.jsx
│   │   │   └── ui/            # shadcn
│   │   └── pages/
│   │       ├── Login, Dashboard, Upload, Customers, MapAnalysis,
│   │       │   CreatorAnalysis, ProductRevenue, Reminder, PerluDiSS,
│   │       │   SegmenExport, AuditLog, Pengaturan, Tentang  (all i18n-wired)
│   └── public/favicon.svg
└── memory/PRD.md, test_credentials.md
```

## What's Been Implemented (Cumulative)
### Session 1 (previous forks)
- Setup, JWT auth, seed, vision extraction, ECharts map, bulk tag & broadcast, product revenue, ZIP bulk, PDF export, rename to PelangganKu, favicon, audit trail, PK logo/tagline, i18n scaffold (Login/Dashboard/Onboarding/About only).

### Session 2 (2026-02-20)
- **Full bilingual UI:** translated Upload, Customers (list + drawer + bulk panel), MapAnalysis, CreatorAnalysis, PerluDiSS, SegmenExport (filters + broadcast + WA list), ProductRevenue, Reminder (buckets + tables + tips), AuditLog (formatted timestamps + action labels + yes/no boolean detail), Pengaturan (all 6 tabs: Norm, Tags, WA, PDF Header, CSV Mapping, Operators).
- **Backend i18n:** new `backend/i18n.py` with 10 message keys (auth, vision, customer, zip, job). `lang_middleware` reads `Accept-Language`. All `HTTPException(detail=...)` routed through `T("key")`. Axios interceptor sends the header automatically.

## Backlog / Roadmap
### P1
- **Refactor server.py (~1160 lines)** into modular routers (`routes/auth.py`, `routes/customers.py`, `routes/analytics.py`, `routes/vision.py`, `routes/segments.py`) — production readiness.
- **Extend backend i18n coverage** — add remaining static strings if new endpoints are added.
### P2
- Trial watermark ("Demo") on PDF/CSV exports for non-activated licenses.
- Broadcast queue polish — persistent queue on server side, so a browser close doesn't kill the run.
- Pytest suite at `/app/backend/tests/` for regression (auth, vision endpoints, segments).
- WhatsApp Cloud API integration (paid tier) for real programmatic broadcast.

## API Endpoints (Key)
`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/vision/extract`, `POST /api/vision/extract-zip`, `GET /api/vision/jobs/{id}`, `POST /api/orders/save`, `GET/PATCH/POST /api/customers`, `POST /api/customers/bulk`, `GET /api/analytics/{regions|creators|products|dashboard}`, `POST /api/segments/{preview|export/csv|export/pdf}`, `GET/POST/DELETE /api/normalization/rules`, `GET/POST/PATCH/DELETE /api/tags`, `GET/PUT /api/settings/*`, `POST /api/csv/import`, `GET /api/csv/gap`, `GET /api/reminders`, `GET /api/audit` (owner only).

## Test Credentials
See `/app/memory/test_credentials.md`. Owner: `owner@pelangganku.id` / `owner123`.

## 3rd-Party Integrations
- **Gemini 3 Flash** (via Emergent LLM key) — image → structured customer JSON.
