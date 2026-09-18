# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. TikTok doesn't expose buyer data, so sellers screenshot orders; AI vision (Gemini 3 Flash) extracts name, phone, address, affiliate creator, TikTok follower/like counts. Dedup by phone, ECharts Indonesia map, CSV bulk import, custom tags, WhatsApp broadcast with follower-tier + profession segmentation, PDF/CSV exports, audit trail, reminder segments, bilingual UI (ID/EN).

**Preferred user language:** Bahasa Indonesia.

## Core Requirements (Delivered)
1. JWT auth (`owner@pelangganku.id`/`owner123`, `operator@pelangganku.id`/`operator123`).
2. Vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion.
4. Dedup by phone; repeat-buyer detection.
5. Customer DB: search, tag filter, notes, drawer, bulk actions, **sortable Followers/Orders/LastSeen**, **Profesi column**.
6. Region normalization.
7. ECharts Indonesia map + drill-down.
8. Creator analytics + niche.
9. CSV order import + Perlu Di-SS gap + product revenue per variant.
10. Reminder segments (30-59/60-89/90+ days) with WA greet.
11. **Segments & Export** – CSV, PDF, staggered WA broadcast + **follower-tier filter (micro/mid/macro/unknown)** + **profession keyword filter**.
12. Owner-only audit trail.
13. Bilingual UI (ID/EN) + `Accept-Language` backend.
14. Rich 5-step Onboarding tutorial.
15. Onboarding Progress Checklist on Dashboard.
16. Login copy — pain-first message mentioning TikTok follower/like counts.
17. **TikTok profile stats** — vision extracts followers + likes; sortable Followers column; TikTok Profile card in drawer.
18. **Profession enrichment** — per-customer `profession` field, drawer input + one-click Google-LinkedIn search (`google.com/search?q="Name" linkedin`), Profesi column in list, keyword filter in Segments. Seeded 15 demo customers with plausible professions (Guru SD, Dokter Gigi, Karyawan Bank BCA, PNS, IRT, UI/UX Designer, MUA, Dosen ITB, dll).
19. **Public Landing Page (`/`)** — screenshot-ready hero (1440×900, crop-safe 16:10). Grid 55/45 container max-w-1200 px-20. Headline bilingual with dark/orange split, dot-grid + soft-orange radial backdrop. Custom SVG browser mockup: stylized Indonesia map with orange/gray pins + city labels, customer table with BERPENGARUH badge & inline Google icon, 2 floating stat cards. Auto-login demo chips (Owner/Operator) call `login()` directly and redirect to `/dashboard`. 3-step "Cara Kerja" section, 3 influencer buyer cards (SELEBGRAM / CALON AFILIATOR / PEMBELI SETIA), Dampak Bisnis metrics, footer with PDP UU 27/2022 note. Login form moved to `/login` (standalone, no split-screen). Protected routes moved from `/` to `/dashboard/*`.

## Data Model — Customer
- `tiktok_followers`, `tiktok_likes` (string), `tiktok_followers_num`, `tiktok_likes_num` (int)
- `profession` (string, manually curated from LinkedIn/Google)
- Standard: `phone`, `recipient_name`, `tiktok_username`, address hierarchy, tags, notes, order_count, source

## Architecture
```
/app/
├── backend/
│   ├── server.py         # ~1210 lines. CustomerPatch/SegmentFilter incl. profession
│   ├── vision_service.py # + parse_social_count
│   ├── seed_data.py      # + _backfill_tiktok_profiles idempotent
│   └── i18n.py
├── frontend/src/
│   ├── lib/i18n.jsx      # ID+EN dict incl. cust.col.profession, cust.drawer.searchGoogle, seg.field.profession
│   ├── pages/
│   │   ├── Customers.jsx (Profesi col, drawer Google-search button, sort followers)
│   │   ├── SegmenExport.jsx (follower_tier + profession filters)
│   │   └── ...
```

## Session Log
- **S1-6:** setup → onboarding progress checklist → tag-tab bugfix → login copy rewrite.
- **S7:** TikTok profile stats extraction, display in list & drawer.
- **S8:** Follower-tier segment filter, sortable Followers, login copy extended.
- **S9 (this):** Profession enrichment — per-customer field, one-click Google/LinkedIn search from drawer, Profesi column in list, keyword filter in segments. Seeded 15 demo customers with plausible professions.

## Backlog / Roadmap
### P1
- KOL outreach template per tier (macro → paid collab, micro → ambassador).
- Sort persist per user (localStorage).
- Sort by likes (trivial if requested).
- Refactor `server.py` into modular routers.
### P2
- Engagement rate filter (likes/followers) for high-converting KOLs.
- Alert on new macro buyer entering database.
- Confetti on 5/5 onboarding.
- Trial watermark on PDF exports.
- Server-side pagination for 1000+ customers.
- Pytest suite at `/app/backend/tests/`.

## Test Credentials
See `/app/memory/test_credentials.md`. Owner: `owner@pelangganku.id` / `owner123`.

## 3rd-Party Integrations
- **Gemini 3 Flash** (Emergent LLM key) — screenshot → structured JSON incl. TikTok profile stats.
