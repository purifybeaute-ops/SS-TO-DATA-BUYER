# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. TikTok doesn't expose buyer data, so sellers screenshot orders; AI vision (Gemini 3 Flash) extracts name, phone, address, affiliate creator, TikTok follower/like counts. Dedup by phone, ECharts Indonesia map, CSV bulk import, custom tags, WhatsApp broadcast with follower-tier + profession segmentation, PDF/CSV exports, audit trail, reminder segments, bilingual UI (ID/EN).

**Preferred user language:** Bahasa Indonesia (bilingual UI ID/EN).

## Core Requirements (Delivered)
1. JWT auth (`owner@pelangganku.id`/`owner123`, `operator@pelangganku.id`/`operator123`).
2. Vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion.
4. Dedup by phone; repeat-buyer detection.
5. Customer DB with sortable Followers/Orders/LastSeen + Profesi column.
6. Region normalization.
7. ECharts Indonesia map + drill-down.
8. Creator analytics + niche.
9. CSV order import + Perlu Di-SS gap + product revenue per variant.
10. Reminder segments with WA greet.
11. Segments & Export — CSV, PDF, staggered WA broadcast + follower-tier + profession filter.
12. Owner-only audit trail.
13. Bilingual UI (ID/EN) + `Accept-Language` backend.
14. Onboarding tutorial + Progress Checklist.
15. TikTok profile stats extraction (followers + likes) + sortable Followers column.
16. Profession enrichment + Google-LinkedIn quick search.
17. Public Landing Page (`/`) with auto-login demo chips.
18. **Dark-mode SaaS Redesign** (Feb 2026) — neon teal/purple palette, glass-morphism, gradient text, ambient orbs, floating animations. Global CSS overrides cascade dark theme to all dashboard pages.
19. **Chart Recoloring (Feb 2026)** — MapAnalysis & CreatorAnalysis bar charts now use `echarts.graphic.LinearGradient` cyan→blue→purple. Choropleth map uses cyan color scale. Dark tooltip backgrounds, light axis text.
20. **Influential Buyer Alerts (Feb 2026)**:
    - Backend endpoints: `GET /api/alerts/influential?limit=N` returns customers with `tiktok_followers_num >= 100_000` including per-user `is_new` flag, and `POST /api/alerts/mark-read` sets last-seen timestamp in `user_prefs` collection keyed by email.
    - Frontend `AlertBell.jsx` — bell icon in sidebar + mobile top bar with pulsing badge count, dropdown panel listing name/handle/followers/likes/city + "Mark all as read" button, auto-refresh every 60s.
    - Bilingual copy (`alerts.*` keys in i18n).

## Data Model
- **customer**: `tiktok_followers_num`, `tiktok_likes_num`, `profession`, standard fields.
- **user_prefs** (NEW): `{ email, alerts_seen_until }` — one doc per user, upserted on mark-read.

## Architecture
```
/app/
├── backend/
│   ├── server.py         # + /api/alerts/influential + /api/alerts/mark-read
│   ├── vision_service.py
│   ├── seed_data.py
│   ├── i18n.py
│   └── auth.py
├── frontend/
│   ├── src/
│   │   ├── index.css                # Dark theme + glass utilities + tailwind overrides
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Dark neon SaaS
│   │   │   ├── Login.jsx            # Matching dark login
│   │   │   ├── MapAnalysis.jsx      # Cyan-purple gradient charts + dark choropleth
│   │   │   ├── CreatorAnalysis.jsx  # Cyan-purple gradient bar chart
│   │   │   └── ... (all pages inherit dark via CSS cascade)
│   │   ├── components/
│   │   │   ├── Layout.jsx           # + AlertBell in sidebar & mobile top bar
│   │   │   ├── AlertBell.jsx        # NEW — dropdown with unseen count
│   │   │   ├── Onboarding.jsx       # Header gradient cyan→purple
│   │   │   └── OnboardingProgress.jsx
│   │   └── lib/i18n.jsx             # + alerts.* keys (ID/EN)
│   └── package.json
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## Route Structure
- `/` — public Landing
- `/login` — public login form
- `/dashboard/*` — protected app

## Backlog / Next
- **KOL Outreach Template**: Follower-tier-specific WhatsApp templates
- **Engagement Rate Filter**: likes/followers ratio filter
- **Trial Watermark**: "Demo" watermark on PDF/CSV exports for non-activated licenses
- **Broadcast Queue Polish**: Verify 5-10 sec spacing prevents WA spam flags
- **Push Notifications**: Extend AlertBell with browser push / email so seller sees alerts even when app closed
- **Alert Feed Page**: Full-page `/dashboard/alerts` history for macro buyers, not just dropdown

## Notes for Next Agent
1. Dark theme cascades via `/app/frontend/src/index.css` global overrides. New pages will inherit dark automatically if they use `pp-*` classes and `text-stone-*` / `bg-stone-*` Tailwind utilities.
2. `echarts.graphic.LinearGradient` used for bar chart gradients — reuse pattern for any new charts.
3. `user_prefs` collection is a general-purpose per-user key-value store — add more preferences (theme, defaults) here rather than new collections.
4. Alert threshold `INFLUENTIAL_THRESHOLD = 100_000` is a module constant in `server.py` — bump it there if seller wants stricter filter.
5. AlertBell auto-refreshes every 60s via `setInterval`; disable if backend load becomes a concern.
