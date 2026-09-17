# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. TikTok doesn't expose buyer data, so sellers screenshot order pages; the app uses AI vision (Gemini 3 Flash) to extract name, phone, multi-level address, affiliate creator, **and TikTok profile stats (followers + likes)**. Dedupes buyers by phone, plots them on an ECharts Indonesia map, supports CSV bulk import, custom tags, WhatsApp broadcast (with follower-tier segmentation), PDF/CSV exports, audit trail, reminder segments, and full bilingual UI (ID/EN).

**Preferred user language:** Bahasa Indonesia. Future agents must reply in Indonesian.

## User Personas
- **Owner (Seller)** – full access, audit log, operator management, PDF header, region rules.
- **Operator (Admin/CS)** – upload, edit customers, broadcast; cannot manage users or store settings.

## Core Requirements (Delivered)
1. JWT auth (`owner@pelangganku.id`/`owner123`, `operator@pelangganku.id`/`operator123`).
2. Screenshot vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion (background job).
4. Dedup by phone (`+62`); repeat-buyer detection.
5. Customer DB with search, tag filter, notes, drawer detail, bulk actions, **sortable Followers/Orders/LastSeen columns**.
6. Region normalization rules.
7. ECharts Indonesia map + drill-down.
8. Creator analytics + niche editing.
9. CSV order import + Perlu Di-SS gap + product revenue per variant.
10. Reminder segments (30-59/60-89/90+ days) with WA one-click greet.
11. **Segments & Export** – CSV, PDF, staggered WA broadcast + **follower-tier filter (micro <10K / mid 10K–100K / macro >100K / unknown)**.
12. Owner-only audit trail.
13. Bilingual UI (ID/EN) + `Accept-Language` on backend.
14. Rich 5-step Onboarding tutorial with screenshots + pulsing callouts.
15. Onboarding Progress Checklist on Dashboard.
16. Login copy — pain-first emotional message that **now names TikTok followers & likes** in the solution paragraph.
17. TikTok profile stats — vision extracts `tiktok_followers`/`tiktok_likes` (raw string) + `_num` parsed integer; shown as sortable column in list, dedicated **Profil TikTok Pembeli** card in drawer.

## Data Model — Customer / Order
- `tiktok_followers`, `tiktok_likes`: raw display string ("1.2K", "23.4K")
- `tiktok_followers_num`, `tiktok_likes_num`: parsed integers for sorting/filtering

## Architecture
```
/app/
├── backend/
│   ├── server.py         # ~1200 lines. Includes SegmentFilter.follower_tier
│   ├── vision_service.py # parse_social_count("1.2K"→1200)
│   ├── i18n.py, auth.py, seed_data.py
├── frontend/
│   ├── src/lib/i18n.jsx  # ~740 lines, ID+EN dict incl. seg.tier.*, cust.col.followers
│   ├── src/pages/
│   │   ├── Customers.jsx (+ SortIcon, tier badges micro/mid/macro)
│   │   ├── SegmenExport.jsx (+ follower_tier filter dropdown)
│   │   ├── Login.jsx (updated solution copy)
│   │   └── ...
```

## Session Log
- **S1-6:** setup, auth, vision, map, onboarding tutorial, progress checklist, tag-tab bugfix, login copy rewrite.
- **S7:** TikTok profile stats extraction, display in list & drawer.
- **S8 (this):** Follower-tier segment filter, sortable Followers column, login copy extended to mention followers/likes.

## Backlog / Roadmap
### P1
- Sort direction persist per user (localStorage).
- Server-side pagination for 1000+ customers.
- Refactor `server.py` into modular routers.
### P2
- Confetti on 5/5 onboarding completion.
- Trial watermark on PDF exports.
- Broadcast queue persisted server-side.
- Pytest suite `/app/backend/tests/`.
- KOL outreach template auto-personalized by follower tier.

## Test Credentials
See `/app/memory/test_credentials.md`. Owner: `owner@pelangganku.id` / `owner123`.

## 3rd-Party Integrations
- **Gemini 3 Flash** — image → structured customer JSON incl. TikTok profile stats.
