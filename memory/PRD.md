# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. TikTok doesn't expose buyer data, so sellers screenshot order pages; the app uses AI vision (Gemini 3 Flash) to extract name, phone, multi-level address, affiliate creator, **and now TikTok profile stats (followers + likes)**. Dedupes buyers by phone, plots them on an ECharts Indonesia map, supports CSV bulk import, custom tags, WhatsApp broadcast, PDF/CSV exports, audit trail, reminder segments, and full bilingual UI (ID/EN).

**Preferred user language:** Bahasa Indonesia. Future agents must reply in Indonesian.

## User Personas
- **Owner (Seller)** – full access, audit log, operator management, PDF header, region rules.
- **Operator (Admin/CS)** – upload, edit customers, broadcast; cannot manage users or store settings.

## Core Requirements (Delivered)
1. JWT auth with seeded owner + operator (`owner@pelangganku.id` / `owner123`, `operator@pelangganku.id` / `operator123`).
2. Screenshot vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion (background job, progress polling).
4. Dedup by phone (`+62` normalization); repeat-buyer detection.
5. Customer DB with search, tag filter, notes, drawer detail, bulk actions.
6. Region normalization rules (province / kota) with unmapped queue.
7. ECharts Indonesia GeoJSON map + drill-down (province → kota → kecamatan).
8. Creator analytics with niche editing.
9. CSV order import + "Perlu Di-SS" gap analysis + product revenue per variant.
10. Reminder segments (30-59 / 60-89 / 90+ days idle) with WA one-click greet.
11. Segments & Export – CSV, PDF (custom shop header/logo/note), staggered WA broadcast.
12. Owner-only audit trail.
13. Bilingual UI (ID/EN) end-to-end + `Accept-Language` on backend HTTPExceptions.
14. Rich 5-step Onboarding tutorial with TikTok Seller Center screenshots + pulsing callouts.
15. Onboarding Progress Checklist on Dashboard (5 milestones, ring, dismissible).
16. **Login copy rewritten** to a pain-first, urgency-driven message ("Faktanya: Anda buta di marketplace sendiri.") — no TikTok brand mention.
17. **TikTok profile stats** — vision extraction now pulls `tiktok_followers` and `tiktok_likes` (raw string) plus parsed integers (`_num`) for future sorting. Displayed as inline pills in the customer list under the username, and as a dedicated **"Profil TikTok Pembeli"** card (2 tiles: Followers 🟠, Likes 🔴) inside the customer drawer.

## Architecture
```
/app/
├── backend/
│   ├── server.py         # FastAPI (~1180 lines) — routes, audit, PDF, ZIP, i18n middleware
│   ├── auth.py           # JWT
│   ├── vision_service.py # Gemini 3 Flash extraction + parse_social_count("1.2K"→1200)
│   ├── seed_data.py      # Owner/operator + ~40 demo customers
│   ├── i18n.py           # T() helper + MESSAGES dict
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── lib/i18n.jsx, api.js (auto Accept-Language), auth.jsx, format.js
│   │   ├── components/Layout, Onboarding, OnboardingProgress, PKLogo, LanguageSwitcher
│   │   └── pages/Login, Dashboard, Upload, Customers (+ TikTokProfileCard), MapAnalysis,
│   │           CreatorAnalysis, ProductRevenue, Reminder, PerluDiSS, SegmenExport,
│   │           AuditLog, Pengaturan, Tentang
│   └── public/tutorial/  # seller-center-export.png, buyer-detail-eye.webp
└── memory/PRD.md, test_credentials.md
```

## Data Model — Customer / Order (new fields)
- `tiktok_followers`: raw display string ("1.2K", "23.4K", "856")
- `tiktok_likes`: raw display string
- `tiktok_followers_num`: parsed integer for sorting (nullable)
- `tiktok_likes_num`: parsed integer

## Session Log
- **Session 1 (previous forks):** Setup, auth, vision, map, tagging, broadcast, ZIP, PDF, rename, favicon, audit trail, i18n scaffold.
- **Session 2:** Full bilingual UI + backend HTTPException i18n.
- **Session 3:** Rich 5-step Onboarding with screenshots & pulsing callouts.
- **Session 4:** Onboarding Progress Checklist on Dashboard.
- **Session 5:** Bugfix — Tag tab crash (`destroy is not a function`, Promise-in-useEffect).
- **Session 6:** Login copy rewrite — pain-first emotional message (Versi A, no TikTok brand mention).
- **Session 7 (this):** TikTok profile stats (followers + likes) from vision extraction, displayed in customer list & drawer.

## Backlog / Roadmap
### P1
- **Sortable follower/likes column** in customer list (use `_num` fields).
- **Filter segments by follower tier** ("micro <10K", "mid 10K-100K", "macro >100K") for tiered broadcasts.
- Refactor `server.py` (~1180 lines) into modular routers.
### P2
- Confetti celebration on 5/5 onboarding completion.
- Trial watermark ("Demo") on PDF/CSV exports.
- Broadcast queue persisted server-side.
- Pytest suite at `/app/backend/tests/`.
- Audit similar Promise-in-useEffect patterns (extract `useResource` hook).

## Test Credentials
See `/app/memory/test_credentials.md`. Owner: `owner@pelangganku.id` / `owner123`.

## 3rd-Party Integrations
- **Gemini 3 Flash** (via Emergent LLM key) — image → structured customer JSON incl. TikTok profile stats.
