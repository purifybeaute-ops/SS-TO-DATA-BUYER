# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. Core value: TikTok Shop doesn't expose buyer data, so sellers screenshot order pages; the app uses AI vision (Gemini 3 Flash) to extract name, phone, multi-level address, and affiliate creator, dedupes buyers by phone, plots them on an ECharts Indonesia map, supports CSV bulk import, custom tags, WhatsApp broadcast, PDF/CSV exports, audit trail, reminder segments, and full bilingual UI (Bahasa Indonesia / English).

**Preferred user language:** Bahasa Indonesia. All future agents must reply in Indonesian.

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
11. Segments & Export – CSV, PDF (custom shop header/logo/note), staggered WA broadcast (min/max delay, pause/resume/stop, progress bar).
12. Owner-only audit trail (mutation actions).
13. Bilingual UI (ID/EN) — full end-to-end with Accept-Language on backend HTTPExceptions.
14. **Rich Onboarding tutorial (5 steps)** with 2 embedded TikTok Seller Center screenshots + pulsing callouts ("KLIK EKSPOR", "KLIK IKON MATA").
15. **Onboarding Progress Checklist on Dashboard** — 5 milestones (CSV import, first SS, 5+ SS, tag first customer, set PDF header) with dismissible progress ring, per-item CTA links, and localStorage persistence.

## What's Been Implemented (Cumulative Session Log)
### Session 1 (previous forks)
- Setup, JWT auth, seed, vision extraction, ECharts map, bulk tag & broadcast, product revenue, ZIP bulk, PDF export, rename to PelangganKu, favicon, audit trail, PK logo/tagline, initial i18n scaffold (Login/Dashboard/Onboarding/About).

### Session 2 (2026-02-20)
- **Full bilingual UI**: translated Upload, Customers, MapAnalysis, CreatorAnalysis, PerluDiSS, SegmenExport, ProductRevenue, Reminder, AuditLog, Pengaturan (6 tabs).
- **Backend i18n**: `backend/i18n.py`, `lang_middleware` reads `Accept-Language`, `T("key")` translates HTTPException detail.

### Session 3 (2026-02-20 same day)
- **5-step Onboarding tutorial** with saved local screenshots at `/app/frontend/public/tutorial/` + pulsing callouts.
- **Onboarding Progress Checklist** on dashboard — new `OnboardingProgress.jsx` component + extended `GET /api/analytics/dashboard` with `onboarding` object (csv_imported, ss_first, ss_five, tagged_first, pdf_header_set + counters).

### Session 4 (2026-02-20 — Bugfix)
- **Fixed Tag tab crash** (`TypeError: destroy is not a function`): TagsPanel had `const load = () => api.get(...).then(...)` returning a Promise directly to `useEffect(load, [])`. Wrapped in block body → returns undefined. Verified by testing_agent (0 console errors, all flows green — iteration_4.json).
- **Added per-row testids** in TagsPanel: `tag-row-{id}`, `tag-name-{id}`, `tag-save-{id}`, `tag-del-{id}` for reliable automation.

## Backlog / Roadmap
### P1
- **Refactor `server.py` (~1170 lines)** into modular routers (`routes/auth.py`, `routes/customers.py`, `routes/analytics.py`, `routes/vision.py`, `routes/segments.py`).
- **Audit similar Promise-in-useEffect patterns** — proactively refactor NormPanel / UsersPanel / others into a shared `useResource` hook to prevent recurrence.
### P2
- Confetti celebration on 5/5 onboarding completion (first time only).
- Trial watermark ("Demo") on PDF/CSV exports for non-activated licenses.
- Broadcast queue persisted server-side (survive browser close).
- Pytest suite at `/app/backend/tests/` for regression (auth, vision, segments).
- YouTube link in Step 4 of onboarding for eye-icon demo.

## Test Credentials
See `/app/memory/test_credentials.md`. Owner: `owner@pelangganku.id` / `owner123`.

## 3rd-Party Integrations
- **Gemini 3 Flash** (via Emergent LLM key) — image → structured customer JSON.
