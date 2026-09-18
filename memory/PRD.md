# PelangganKu — Product Requirements

## Original Problem Statement
Full-stack CRM for Indonesian TikTok Shop sellers. TikTok doesn't expose buyer data, so sellers screenshot orders; AI vision (Gemini 3 Flash) extracts name, phone, address, affiliate creator, TikTok follower/like counts. Dedup by phone, ECharts Indonesia map, CSV bulk import, custom tags, WhatsApp broadcast with follower-tier + profession segmentation, PDF/CSV exports, audit trail, reminder segments, bilingual UI (ID/EN).

**Preferred user language:** Bahasa Indonesia (bilingual UI ID/EN).

## Core Requirements (Delivered)
1. JWT auth (`owner@pelangganku.id`/`owner123`, `operator@pelangganku.id`/`operator123`).
2. Vision extraction via Gemini 3 Flash + Emergent LLM key.
3. Bulk ZIP screenshot ingestion.
4. Dedup by phone; repeat-buyer detection.
5. Customer DB: search, tag filter, notes, drawer, bulk actions, sortable Followers/Orders/LastSeen, Profesi column.
6. Region normalization.
7. ECharts Indonesia map + drill-down.
8. Creator analytics + niche.
9. CSV order import + Perlu Di-SS gap + product revenue per variant.
10. Reminder segments (30-59/60-89/90+ days) with WA greet.
11. Segments & Export — CSV, PDF, staggered WA broadcast + follower-tier filter + profession keyword filter.
12. Owner-only audit trail.
13. Bilingual UI (ID/EN) + `Accept-Language` backend.
14. Rich 5-step Onboarding tutorial.
15. Onboarding Progress Checklist on Dashboard.
16. Login copy — pain-first message.
17. TikTok profile stats — vision extracts followers + likes; sortable column; TikTok Profile card in drawer.
18. Profession enrichment — manual input + one-click Google-LinkedIn search + segment keyword filter.
19. Public Landing Page (`/`) — first version with orange theme + Indonesia map mockup.
20. **Dark-mode SaaS Redesign (Feb 2026)** — user-supplied HTML dark-mode design applied globally:
    - New Landing.jsx built in dark neon (teal `#22d3ee` + purple `#a855f7`) with glass-morphism cards, ambient glow orbs, gradient text, floating animations.
    - Hero copy remains "Faktanya: Anda **buta** di marketplace sendiri" (bilingual) with keyword highlighted via cyan→blue→purple gradient.
    - Mockup replaced from map to a pure customer database table (per new design): 4 rows with BERPENGARUH badge, active/idle status pills, floating "12 pembeli >10K followers" badge, browser chrome with traffic-lights.
    - How It Works: 3 staggered glass cards (mt-0, md:mt-8, md:mt-16) with cyan/purple/blue icon backgrounds and giant background numerals.
    - Features: 3 profile cards (SELEBGRAM / CALON AFILIATOR / PEMBELI SETIA) with gradient side accents.
    - Business Impact: 3 metric cards with gradient numbers (5–7×, 0, ∞) + purple→cyan CTA.
    - Footer: glass badge chips + PDP UU 27/2022.
    - Login form rebuilt to match dark theme with ambient orbs.
    - Global CSS overrides propagate dark theme to ALL dashboard pages without touching individual files: `text-stone-*` → light shades, `bg-stone-*` → dark surfaces, `text-orange-*` → cyan, `border-stone-*` → transparent white, `bg-white` → dark surface, `.pp-card` / `.pp-input` / `.pp-btn-*` / `.pp-table` all rewritten dark.
    - Onboarding modal header gradient updated cyan→blue→purple to match.
    - Sonner Toaster forced `theme="dark"`.
    - Shadcn base variables switched to dark HSL palette.
    - Hero fits exactly in 1440×900 viewport (crop-safe for contest showcase) — no scroll, all elements visible.

## Data Model — Customer
- `tiktok_followers`, `tiktok_likes` (string), `tiktok_followers_num`, `tiktok_likes_num` (int)
- `profession` (string)
- Standard: `phone`, `recipient_name`, `tiktok_username`, address hierarchy, tags, notes, order_count, source

## Architecture
```
/app/
├── backend/
│   ├── server.py         # ~1210 lines
│   ├── vision_service.py
│   ├── seed_data.py
│   ├── i18n.py
│   └── auth.py
├── frontend/
│   ├── src/
│   │   ├── index.css         # DARK theme + glass/gradient utilities + tailwind class overrides
│   │   ├── pages/
│   │   │   ├── Landing.jsx   # DARK neon SaaS redesign (root `/`)
│   │   │   ├── Login.jsx     # DARK matching login form (/login)
│   │   │   └── ...           # Dashboard pages inherit dark via CSS cascades
│   │   ├── components/
│   │   │   ├── Layout.jsx    # sidebar (dark via CSS vars)
│   │   │   ├── Onboarding.jsx # header gradient updated cyan→purple
│   │   │   └── OnboardingProgress.jsx
│   │   └── lib/i18n.jsx      # bilingual keys incl. land.* namespace
│   └── package.json
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## Route Structure
- `/` — public Landing (dark neon)
- `/login` — public login form
- `/dashboard/*` — protected app (auto-redirect to `/` if not logged in)
- Auto-login demo chips on Landing hero call `login()` and jump to `/dashboard`

## Backlog / Next
- **KOL Outreach Template**: Follower-tier specific WhatsApp templates
- **Engagement Rate Filter**: likes/followers ratio filter
- **Trial Watermark**: "Demo" watermark on PDF/CSV exports
- **Macro Buyer Alert**: Notify when new buyer with >100K followers enters
- **Broadcast Queue Polish**: Verify 5–10 sec spacing prevents WA spam flags
- **Chart Recoloring**: Peta & CreatorAnalysis chart bars still use warm orange; consider migrating to cyan/purple gradient for full dark-theme consistency (charts remain readable now but not on-palette)

## Notes for Next Agent
1. Dark-theme is driven by `/app/frontend/src/index.css` — root CSS vars + Tailwind class overrides. Editing individual dashboard pages is USUALLY not needed for palette changes.
2. Landing/Login are the only page files that reference dark-specific utility classes directly (`glass`, `text-gradient`, `ambient-glow`, `animate-blob`, `animate-float`, `animate-pulse-glow`).
3. Onboarding.jsx modal header gradient is inline-styled; update `linear-gradient` there for future palette shifts.
4. Sonner is forced `theme="dark"` in App.js.
5. Preserve emergent LLM key for Gemini 3 Flash extraction; don't switch providers.
