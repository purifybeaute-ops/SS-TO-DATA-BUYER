# PetaPembeli — PRD

## Original Problem Statement
Build "PetaPembeli", an app for an Indonesian TikTok Shop seller that turns
screenshots of order/buyer detail pages into a structured customer database.
All interface text in Bahasa Indonesia. Simple email + password login. Extract
order_id / created_at / tiktok_username / recipient_name / phone (+62) / address
(parsed to kelurahan, kecamatan, kota, provinsi, negara) / affiliate_creator
using AI vision. Dedupe buyers by phone. Region normalization + editable rules.
"Peta & Analisis Lokasi" with ranked bar charts + Indonesia choropleth (ECharts).
"Analisis Creator" with niche tags. CSV import + "Perlu Di-SS" gap analysis.
Custom tags + notes. WhatsApp click-to-chat. "Segmen & Export" builder.
Polish, seed ~40 demo customers, "Tentang" page.

## Architecture
- Backend: FastAPI + MongoDB (Motor async) at `/app/backend/server.py`
- Auth: JWT email+password (owner/operator roles) — `auth.py`
- Vision: Gemini 3 Flash preview via emergentintegrations — `vision_service.py`
- Seed: 40 customers across 6 cities + tags + rules — `seed_data.py`
- Frontend: React 19 + TailwindCSS + Sora/Plus Jakarta Sans + Terracotta accent + ECharts
- Region normalization rules: 26 seeded (English → Bahasa Indonesia)
- 6 Custom tags seeded (VIP, Artis, Influencer, Reseller, Langganan, Bermasalah)

## User Personas
- **Owner** (Toko TikTok Shop seller) — full CRUD, manages operators & settings
- **Operator** — read/create/update customers & tags, cannot manage settings/users

## Core Requirements (Static)
1. Screenshot → structured customer data via AI vision
2. Dedupe by phone (+62 normalized)
3. Region normalization + editable rules
4. Indonesia choropleth map (38 provinces, ECharts) + drill-down
5. Creator affiliate analytics with owner-set niches
6. CSV import + "Perlu Di-SS" gap analysis
7. Custom tags + notes
8. WA click-to-chat with editable template
9. Segmen & Export (CSV + WA broadcast list)

## What's Been Implemented (Feb 2026)
- ✅ All 9 phases fully implemented
- ✅ 40 seeded demo customers, 51 orders, 6 tags, 26 norm rules, 7 creators, WA template
- ✅ Verified: vision extraction on sample TikTok screenshot works (name, phone, address, creator all correct)
- ✅ Verified: all key REST endpoints (dashboard, customers, tags, creators, regions) return 200 OK
- ✅ Login flow, dashboard, and map navigation confirmed via backend logs
- ✅ **Feb 2026 iteration 2**: Bulk Tagging (POST /api/customers/bulk), Broadcast Scheduler (frontend queue with 5-10s random delay), Product Revenue View (GET /api/analytics/products + new /produk page). CSV import now saves SKU Subtotal After Discount and uses composite (order_id, variation) key so multi-SKU orders are preserved.
- ✅ **Feb 2026 iteration 3**: Bulk ZIP Import (POST /api/vision/extract-zip + background asyncio task + GET /api/vision/jobs/{id} polling). Segment PDF Export (POST /api/segments/export/pdf using reportlab, landscape A4). Reminder page (/reminder) with GET /api/reminders bucketing 30/60/90+ days inactive customers with WA quick-chat.
- ✅ **Feb 2026 iteration 4**: PDF Custom Header — new "Header PDF" tab in Pengaturan lets owner set shop name, note, and upload a logo. Logo auto-resized to max 400px on the client, stored via PUT /api/settings/pdf_header. PDF renders the logo + shop name (terracotta) + note + accent bottom-border above the segment title. PIL verify guards against corrupt logo data.
- ✅ **Feb 2026 iteration 5**: Rebranding to PelangganKu — all display names updated, seed emails migrated to @pelangganku.id (old accounts auto-deleted on startup), SVG favicon (terracotta PK monogram), Onboarding modal (3-step Bahasa Indonesia guide + localStorage pp_onboarded).
- ✅ **Feb 2026 iteration 6**: Audit Trail — new `audit_logs` collection + `log_audit()` helper injected at 11 mutation endpoints (orders.save, customer.update, customer.bulk, norm.create/delete, tag.create/update/delete, csv.import, vision.zip, setting.update, user.create). Owner-only GET /api/audit endpoint returning logs + action counts. New /riwayat page (owner-only) with actor + action filters. Nav item hidden for operators.

## Test Coverage
- Iteration 1: 29/29 pass
- Iteration 2: 36/36 pass (+7 bulk/products/CSV composite)
- Iteration 3: 46/46 pass (+10 ZIP/PDF/reminders)

## Prioritized Backlog
- P1: Bulk tag/note assignment from customer table
- P1: Product-level revenue analytics (join CSV variation with customers)
- P2: Import history log
- P2: 2FA for owner account
- P2: Timeline of screenshot thumbnails on customer detail
