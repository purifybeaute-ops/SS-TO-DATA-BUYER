"""PelangganKu backend — customer database for Indonesian TikTok Shop sellers."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Body
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import csv
import re
import uuid
import base64
import asyncio
import zipfile
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from collections import Counter, defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import (
    hash_password, verify_password, create_token,
    get_current_user, require_owner,
)
from vision_service import extract_from_image, normalize_phone, parse_address
from seed_data import seed_all
from i18n import T, set_lang

# ---------------------------------------------------------------------------
# MongoDB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="PelangganKu API")
api = APIRouter(prefix="/api")
logger = logging.getLogger("petapembeli")
logging.basicConfig(level=logging.INFO)


@app.middleware("http")
async def lang_middleware(request, call_next):
    """Pick up Accept-Language header (id/en) and store in ContextVar."""
    hdr = request.headers.get("accept-language", "id")
    set_lang(hdr)
    return await call_next(request)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def log_audit(user: dict, action: str, target_type: Optional[str] = None,
                    target_id: Optional[str] = None, details: Optional[dict] = None):
    """Append an audit entry. Failure to log must never break the caller."""
    try:
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "actor_id": user.get("sub"),
            "actor_email": user.get("email"),
            "actor_role": user.get("role"),
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "details": details or {},
            "created_at": now_iso(),
        })
    except Exception as e:
        logger.warning("audit log failed: %s", e)


def strip_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


async def apply_normalization(value: Optional[str], level: str) -> Optional[str]:
    """Look up a normalization rule and return normalized value. Also track unmapped."""
    if not value:
        return value
    rule = await db.norm_rules.find_one({"raw": value, "level": level})
    if rule:
        return rule["normalized"]
    # Track as unmapped (unique upsert)
    await db.unmapped.update_one(
        {"raw": value, "level": level},
        {"$set": {"raw": value, "level": level, "last_seen": now_iso()},
         "$inc": {"count": 1}},
        upsert=True,
    )
    return value


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "operator"  # owner can only add operators


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail=T("auth.invalid_credentials"))
    token = create_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user["role"],
        },
    }


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    doc = await db.users.find_one({"id": user["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail=T("auth.user_not_found"))
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc.get("name", ""),
        "role": doc["role"],
    }


@api.post("/auth/register")
async def register(body: RegisterIn, owner=Depends(require_owner)):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail=T("auth.email_exists"))
    doc = {
        "id": str(uuid.uuid4()),
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "role": "operator",  # forced
        "name": body.name,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    await log_audit(owner, "user.create", "user", doc["id"], {"email": doc["email"]})
    return {"id": doc["id"], "email": doc["email"], "name": doc["name"], "role": doc["role"]}


@api.get("/auth/users")
async def list_users(owner=Depends(require_owner)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(200)
    return users


# ---------------------------------------------------------------------------
# Vision extraction
# ---------------------------------------------------------------------------
class ExtractIn(BaseModel):
    image_base64: str
    filename: Optional[str] = None


@api.post("/vision/extract")
async def vision_extract(body: ExtractIn, user=Depends(get_current_user)):
    b64 = body.image_base64
    # Strip data URI prefix if present
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    try:
        data = await extract_from_image(b64)
    except Exception as e:
        logger.exception("Vision extraction failed")
        raise HTTPException(status_code=500, detail=T("vision.failed_detail", err=e))
    return {"filename": body.filename, "extracted": data}


# ---------------------------------------------------------------------------
# Orders / Customers save (from quick-correct review)
# ---------------------------------------------------------------------------
class OrderIn(BaseModel):
    order_id: Optional[str] = None
    created_at_order: Optional[str] = None
    tiktok_username: Optional[str] = None
    tiktok_followers: Optional[str] = None
    tiktok_likes: Optional[str] = None
    tiktok_followers_num: Optional[int] = None
    tiktok_likes_num: Optional[int] = None
    recipient_name: str
    phone: str
    address_detail: Optional[str] = None
    kelurahan: Optional[str] = None
    kecamatan: Optional[str] = None
    kota: Optional[str] = None
    provinsi: Optional[str] = None
    negara: Optional[str] = "Indonesia"
    affiliate_creator: Optional[str] = None
    full_address_raw: Optional[str] = None
    variation: Optional[str] = None
    quantity: Optional[int] = 1


@api.post("/orders/save")
async def save_orders(orders: List[OrderIn], user=Depends(get_current_user)):
    saved = []
    for o in orders:
        phone_norm = normalize_phone(o.phone) or o.phone
        # Normalize province/city
        prov_norm = await apply_normalization(o.provinsi, "provinsi") if o.provinsi else None
        kota_norm = await apply_normalization(o.kota, "kota") if o.kota else None

        # Find or create customer by phone
        existing = await db.customers.find_one({"phone": phone_norm})
        now = now_iso()
        if existing:
            new_count = existing.get("order_count", 0) + 1
            update = {
                "order_count": new_count,
                "is_repeat": new_count > 1,
                "last_seen": now,
                # Update most recent contact info (overwrite with latest capture)
                "recipient_name": o.recipient_name or existing.get("recipient_name"),
                "tiktok_username": o.tiktok_username or existing.get("tiktok_username"),
                "tiktok_followers": o.tiktok_followers or existing.get("tiktok_followers"),
                "tiktok_likes": o.tiktok_likes or existing.get("tiktok_likes"),
                "tiktok_followers_num": o.tiktok_followers_num if o.tiktok_followers_num is not None else existing.get("tiktok_followers_num"),
                "tiktok_likes_num": o.tiktok_likes_num if o.tiktok_likes_num is not None else existing.get("tiktok_likes_num"),
                "kota": kota_norm or existing.get("kota"),
                "provinsi": prov_norm or existing.get("provinsi"),
                "kecamatan": o.kecamatan or existing.get("kecamatan"),
                "kelurahan": o.kelurahan or existing.get("kelurahan"),
                "address_detail": o.address_detail or existing.get("address_detail"),
                "affiliate_creator": o.affiliate_creator or existing.get("affiliate_creator"),
            }
            await db.customers.update_one({"id": existing["id"]}, {"$set": update})
            cust_id = existing["id"]
        else:
            cust_id = str(uuid.uuid4())
            await db.customers.insert_one({
                "id": cust_id,
                "recipient_name": o.recipient_name,
                "tiktok_username": o.tiktok_username,
                "tiktok_followers": o.tiktok_followers,
                "tiktok_likes": o.tiktok_likes,
                "tiktok_followers_num": o.tiktok_followers_num,
                "tiktok_likes_num": o.tiktok_likes_num,
                "phone": phone_norm,
                "kota": kota_norm,
                "provinsi": prov_norm,
                "kecamatan": o.kecamatan,
                "kelurahan": o.kelurahan,
                "address_detail": o.address_detail,
                "negara": o.negara or "Indonesia",
                "affiliate_creator": o.affiliate_creator,
                "order_count": 1,
                "is_repeat": False,
                "first_seen": now,
                "last_seen": now,
                "notes": "",
                "tag_ids": [],
                "source": "screenshot",
                "created_at": now,
            })

        # Save order record
        order_doc = {
            "id": str(uuid.uuid4()),
            "order_id": o.order_id,
            "customer_id": cust_id,
            "phone": phone_norm,
            "recipient_name": o.recipient_name,
            "tiktok_username": o.tiktok_username,
            "kota": kota_norm,
            "provinsi": prov_norm,
            "kecamatan": o.kecamatan,
            "kelurahan": o.kelurahan,
            "address_detail": o.address_detail,
            "negara": o.negara or "Indonesia",
            "affiliate_creator": o.affiliate_creator,
            "created_at_order": o.created_at_order,
            "variation": o.variation,
            "quantity": o.quantity or 1,
            "source": "screenshot",
            "created_at": now,
        }
        await db.orders.insert_one(order_doc)
        saved.append({"customer_id": cust_id, "order_id": o.order_id})

    await log_audit(user, "orders.save", "order", None, {"count": len(saved)})
    return {"saved": len(saved), "results": saved}


# ---------------------------------------------------------------------------
# Customers
# ---------------------------------------------------------------------------
@api.get("/customers")
async def list_customers(
    q: Optional[str] = None,
    kota: Optional[str] = None,
    provinsi: Optional[str] = None,
    repeat: Optional[bool] = None,
    tag_id: Optional[str] = None,
    creator: Optional[str] = None,
    user=Depends(get_current_user),
):
    query: Dict[str, Any] = {}
    if q:
        pat = re.escape(q)
        query["$or"] = [
            {"recipient_name": {"$regex": pat, "$options": "i"}},
            {"tiktok_username": {"$regex": pat, "$options": "i"}},
            {"phone": {"$regex": pat, "$options": "i"}},
            {"kecamatan": {"$regex": pat, "$options": "i"}},
            {"kota": {"$regex": pat, "$options": "i"}},
        ]
    if kota:
        query["kota"] = kota
    if provinsi:
        query["provinsi"] = provinsi
    if repeat is not None:
        query["is_repeat"] = repeat
    if tag_id:
        query["tag_ids"] = tag_id
    if creator:
        query["affiliate_creator"] = creator

    rows = await db.customers.find(query, {"_id": 0}).sort("last_seen", -1).to_list(2000)
    return rows


@api.get("/customers/{cid}")
async def get_customer(cid: str, user=Depends(get_current_user)):
    cust = await db.customers.find_one({"id": cid}, {"_id": 0})
    if not cust:
        raise HTTPException(status_code=404, detail=T("customer.not_found"))
    orders = await db.orders.find({"customer_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"customer": cust, "orders": orders}


class CustomerPatch(BaseModel):
    notes: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    recipient_name: Optional[str] = None


@api.patch("/customers/{cid}")
async def patch_customer(cid: str, body: CustomerPatch, user=Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return {"ok": True}
    result = await db.customers.update_one({"id": cid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=T("customer.not_found"))
    await log_audit(user, "customer.update", "customer", cid, {"fields": list(update.keys())})
    return {"ok": True}


class BulkCustomerUpdate(BaseModel):
    ids: List[str]
    add_tag_ids: Optional[List[str]] = None
    remove_tag_ids: Optional[List[str]] = None
    note_append: Optional[str] = None
    note_replace: Optional[str] = None


@api.post("/customers/bulk")
async def bulk_update_customers(body: BulkCustomerUpdate, user=Depends(get_current_user)):
    if not body.ids:
        raise HTTPException(status_code=400, detail=T("customer.select_min"))
    updated = 0
    for cid in body.ids:
        ops: Dict[str, Any] = {}
        set_ops: Dict[str, Any] = {}
        if body.add_tag_ids:
            ops["$addToSet"] = {"tag_ids": {"$each": body.add_tag_ids}}
        if body.remove_tag_ids:
            ops["$pull"] = {"tag_ids": {"$in": body.remove_tag_ids}}
        if body.note_replace is not None:
            set_ops["notes"] = body.note_replace
        elif body.note_append:
            cur = await db.customers.find_one({"id": cid}, {"_id": 0, "notes": 1})
            prev = (cur or {}).get("notes", "") or ""
            set_ops["notes"] = (prev + ("\n" if prev else "") + body.note_append).strip()
        if set_ops:
            ops["$set"] = set_ops
        if ops:
            r = await db.customers.update_one({"id": cid}, ops)
            if r.matched_count:
                updated += 1
    await log_audit(user, "customer.bulk", "customer", None, {
        "count": updated,
        "add_tag_ids": body.add_tag_ids or [],
        "remove_tag_ids": body.remove_tag_ids or [],
        "note_added": bool(body.note_append or body.note_replace),
    })
    return {"updated": updated}


# ---------------------------------------------------------------------------
# Normalization rules
# ---------------------------------------------------------------------------
class NormRuleIn(BaseModel):
    raw: str
    normalized: str
    level: str  # "provinsi" | "kota"


@api.get("/normalization/rules")
async def list_norm_rules(user=Depends(get_current_user)):
    return await db.norm_rules.find({}, {"_id": 0}).sort("level", 1).to_list(1000)


@api.post("/normalization/rules")
async def create_norm_rule(body: NormRuleIn, owner=Depends(require_owner)):
    doc = {"id": str(uuid.uuid4()), "raw": body.raw, "normalized": body.normalized,
           "level": body.level, "created_at": now_iso()}
    await db.norm_rules.insert_one(doc)
    await db.unmapped.delete_one({"raw": body.raw, "level": body.level})
    # Retroactively update customers + orders
    await db.customers.update_many({body.level: body.raw}, {"$set": {body.level: body.normalized}})
    await db.orders.update_many({body.level: body.raw}, {"$set": {body.level: body.normalized}})
    await log_audit(owner, "norm.create", "norm_rule", doc["id"], {"raw": body.raw, "normalized": body.normalized, "level": body.level})
    return strip_id(doc)


@api.delete("/normalization/rules/{rid}")
async def delete_norm_rule(rid: str, owner=Depends(require_owner)):
    await db.norm_rules.delete_one({"id": rid})
    await log_audit(owner, "norm.delete", "norm_rule", rid)
    return {"ok": True}


@api.get("/normalization/unmapped")
async def list_unmapped(user=Depends(get_current_user)):
    return await db.unmapped.find({}, {"_id": 0}).sort("count", -1).to_list(500)


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------
class TagIn(BaseModel):
    name: str
    color: str = "#C2410C"


@api.get("/tags")
async def list_tags(user=Depends(get_current_user)):
    return await db.tags.find({}, {"_id": 0}).sort("name", 1).to_list(200)


@api.post("/tags")
async def create_tag(body: TagIn, owner=Depends(require_owner)):
    doc = {"id": str(uuid.uuid4()), "name": body.name, "color": body.color, "created_at": now_iso()}
    await db.tags.insert_one(doc)
    await log_audit(owner, "tag.create", "tag", doc["id"], {"name": body.name})
    return strip_id(doc)


@api.patch("/tags/{tid}")
async def update_tag(tid: str, body: TagIn, owner=Depends(require_owner)):
    await db.tags.update_one({"id": tid}, {"$set": {"name": body.name, "color": body.color}})
    await log_audit(owner, "tag.update", "tag", tid, {"name": body.name})
    return {"ok": True}


@api.delete("/tags/{tid}")
async def delete_tag(tid: str, owner=Depends(require_owner)):
    await db.tags.delete_one({"id": tid})
    await db.customers.update_many({"tag_ids": tid}, {"$pull": {"tag_ids": tid}})
    await log_audit(owner, "tag.delete", "tag", tid)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Creator niches
# ---------------------------------------------------------------------------
class NicheIn(BaseModel):
    handle: str
    niche: str


@api.get("/creators")
async def analyze_creators(user=Depends(get_current_user)):
    """Aggregate creator performance from orders."""
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    niches_docs = await db.creator_niches.find({}, {"_id": 0}).to_list(500)
    niche_map = {n["handle"]: n["niche"] for n in niches_docs}

    creators: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "total_orders": 0, "unique_phones": set(), "cities": Counter(), "repeat_phones": set(),
    })
    phone_counts: Counter = Counter()
    for o in orders:
        phone_counts[o.get("phone")] += 1

    for o in orders:
        h = o.get("affiliate_creator") or "__organic__"
        creators[h]["total_orders"] += 1
        if o.get("phone"):
            creators[h]["unique_phones"].add(o["phone"])
            if phone_counts[o["phone"]] > 1:
                creators[h]["repeat_phones"].add(o["phone"])
        if o.get("kota"):
            creators[h]["cities"][o["kota"]] += 1

    result = []
    for handle, stats in creators.items():
        unique = len(stats["unique_phones"])
        result.append({
            "handle": None if handle == "__organic__" else handle,
            "is_organic": handle == "__organic__",
            "niche": niche_map.get(handle, ""),
            "total_orders": stats["total_orders"],
            "unique_buyers": unique,
            "repeat_pct": round(100 * len(stats["repeat_phones"]) / unique, 1) if unique else 0,
            "top_cities": stats["cities"].most_common(3),
        })
    result.sort(key=lambda x: x["total_orders"], reverse=True)

    # Niche summary
    niche_totals: Counter = Counter()
    for r in result:
        key = r["niche"] or ("Organik / tanpa creator" if r["is_organic"] else "Tanpa niche")
        niche_totals[key] += r["total_orders"]
    niche_summary = [{"niche": k, "orders": v} for k, v in niche_totals.most_common()]

    return {"creators": result, "niche_summary": niche_summary}


@api.post("/creators/niche")
async def set_creator_niche(body: NicheIn, owner=Depends(require_owner)):
    await db.creator_niches.update_one(
        {"handle": body.handle},
        {"$set": {"handle": body.handle, "niche": body.niche, "updated_at": now_iso()},
         "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api.get("/creators/niches")
async def list_niches(user=Depends(get_current_user)):
    return await db.creator_niches.find({}, {"_id": 0}).sort("handle", 1).to_list(500)


# ---------------------------------------------------------------------------
# Settings (WA template, CSV mapping)
# ---------------------------------------------------------------------------
@api.get("/settings/{key}")
async def get_setting(key: str, user=Depends(get_current_user)):
    doc = await db.settings.find_one({"key": key}, {"_id": 0})
    return doc or {"key": key, "value": None}


class SettingIn(BaseModel):
    value: Any


@api.put("/settings/{key}")
async def put_setting(key: str, body: SettingIn, owner=Depends(require_owner)):
    await db.settings.update_one({"key": key}, {"$set": {"key": key, "value": body.value}}, upsert=True)
    await log_audit(owner, "setting.update", "setting", key)
    return {"ok": True}


# ---------------------------------------------------------------------------
# CSV import
# ---------------------------------------------------------------------------
@api.post("/csv/import")
async def csv_import(
    file: UploadFile = File(...),
    mapping_json: Optional[str] = None,
    owner=Depends(require_owner),
):
    import json as _json
    content = await file.read()
    text = content.decode("utf-8-sig", errors="ignore")
    # Save mapping if provided
    if mapping_json:
        try:
            mapping = _json.loads(mapping_json)
            await db.settings.update_one({"key": "csv_mapping"}, {"$set": {"key": "csv_mapping", "value": mapping}}, upsert=True)
        except Exception:
            mapping = None
    setting = await db.settings.find_one({"key": "csv_mapping"})
    mapping = setting["value"] if setting else {
        "order_id": "Order ID", "variation": "Variation", "quantity": "Quantity",
        "province": "Province", "regency_city": "Regency and City", "creator_handle": "Creator Handle",
        "sku_subtotal_after_discount": "SKU Subtotal After Discount",
    }

    def _num(v):
        if v is None:
            return 0.0
        s = str(v).replace(",", "").strip()
        try:
            return float(s) if s else 0.0
        except Exception:
            return 0.0

    reader = csv.DictReader(io.StringIO(text))
    count = 0
    upserted = 0
    for row in reader:
        count += 1
        oid = (row.get(mapping["order_id"]) or "").strip()
        if not oid:
            continue
        prov_raw = (row.get(mapping["province"]) or "").strip() or None
        city_raw = (row.get(mapping["regency_city"]) or "").strip() or None
        prov_norm = await apply_normalization(prov_raw, "provinsi") if prov_raw else None
        city_norm = await apply_normalization(city_raw, "kota") if city_raw else None
        variation = (row.get(mapping["variation"]) or "").strip() or None
        subtotal_col = mapping.get("sku_subtotal_after_discount", "SKU Subtotal After Discount")
        line_key = f"{oid}::{variation or ''}"
        doc = {
            "line_key": line_key,
            "order_id": oid,
            "variation": variation,
            "quantity": int(row.get(mapping["quantity"]) or 1) if (row.get(mapping["quantity"]) or "").isdigit() else 1,
            "sku_subtotal_after_discount": _num(row.get(subtotal_col)),
            "provinsi": prov_norm,
            "provinsi_raw": prov_raw,
            "kota": city_norm,
            "kota_raw": city_raw,
            "affiliate_creator": (row.get(mapping["creator_handle"]) or "").strip() or None,
            "created_at_order": (row.get("Created Time") or "").strip() or None,
            "imported_at": now_iso(),
        }
        await db.csv_orders.update_one({"line_key": line_key}, {"$set": doc}, upsert=True)
        upserted += 1
    await log_audit(owner, "csv.import", "csv", None, {"read": count, "upserted": upserted, "filename": file.filename})
    return {"read": count, "upserted": upserted}


@api.get("/csv/orders")
async def list_csv_orders(user=Depends(get_current_user)):
    return await db.csv_orders.find({}, {"_id": 0}).to_list(20000)


@api.get("/csv/gap")
async def csv_gap(user=Depends(get_current_user)):
    """Orders in CSV but not yet captured by screenshot. Dedupes by order_id."""
    csv_rows = await db.csv_orders.find({}, {"_id": 0}).sort("created_at_order", -1).to_list(50000)
    seen = set()
    unique = []
    for r in csv_rows:
        oid = r.get("order_id")
        if not oid or oid in seen:
            continue
        seen.add(oid)
        unique.append(r)
    captured_ids = set()
    async for o in db.orders.find({"order_id": {"$ne": None}}, {"_id": 0, "order_id": 1}):
        if o.get("order_id"):
            captured_ids.add(o["order_id"])
    gap = [o for o in unique if o["order_id"] not in captured_ids]
    total = len(unique)
    captured = total - len(gap)
    return {"gap": gap, "total": total, "captured": captured}


# ---------------------------------------------------------------------------
# Product revenue analytics (from CSV)
# ---------------------------------------------------------------------------
@api.get("/analytics/products")
async def analytics_products(
    kota: Optional[str] = None,
    provinsi: Optional[str] = None,
    user=Depends(get_current_user),
):
    query: Dict[str, Any] = {}
    if kota:
        query["kota"] = kota
    if provinsi:
        query["provinsi"] = provinsi
    rows = await db.csv_orders.find(query, {"_id": 0}).to_list(50000)
    per_var: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "orders": 0, "qty": 0, "revenue": 0.0, "kota_counter": Counter(),
    })
    total_revenue = 0.0
    total_orders = 0
    for r in rows:
        v = r.get("variation") or "(Tanpa varian)"
        per_var[v]["orders"] += 1
        per_var[v]["qty"] += int(r.get("quantity") or 0)
        rev = float(r.get("sku_subtotal_after_discount") or 0)
        per_var[v]["revenue"] += rev
        total_revenue += rev
        total_orders += 1
        if r.get("kota"):
            per_var[v]["kota_counter"][r["kota"]] += 1
    products = [{
        "variation": v,
        "orders": s["orders"],
        "qty": s["qty"],
        "revenue": s["revenue"],
        "top_cities": s["kota_counter"].most_common(3),
    } for v, s in per_var.items()]
    products.sort(key=lambda x: x["revenue"], reverse=True)
    return {"total_revenue": total_revenue, "total_orders": total_orders, "products": products}


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
@api.get("/analytics/dashboard")
async def analytics_dashboard(user=Depends(get_current_user)):
    total_customers = await db.customers.count_documents({})
    total_orders = await db.orders.count_documents({})
    repeat = await db.customers.count_documents({"is_repeat": True})
    kotas = await db.customers.distinct("kota")
    provs = await db.customers.distinct("provinsi")
    prov_counts: Counter = Counter()
    async for c in db.customers.find({"provinsi": {"$ne": None}}, {"_id": 0, "provinsi": 1}):
        if c.get("provinsi"):
            prov_counts[c["provinsi"]] += 1
    top_prov = prov_counts.most_common(1)[0] if prov_counts else None

    # Onboarding progress signals — each is a binary "have they done this yet?"
    csv_orders = await db.orders.count_documents({"source": "csv"})
    ss_orders = await db.orders.count_documents({"source": "screenshot"})
    tagged_customers = await db.customers.count_documents({"tag_ids.0": {"$exists": True}})
    pdf_header_doc = await db.settings.find_one({"key": "pdf_header"})
    has_pdf_header = bool(
        pdf_header_doc
        and isinstance(pdf_header_doc.get("value"), dict)
        and (pdf_header_doc["value"].get("shop_name") or pdf_header_doc["value"].get("logo_data_url"))
    )

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "repeat_customers": repeat,
        "repeat_pct": round(100 * repeat / total_customers, 1) if total_customers else 0,
        "total_kota": len([k for k in kotas if k]),
        "total_provinsi": len([p for p in provs if p]),
        "top_provinsi": {"name": top_prov[0], "count": top_prov[1]} if top_prov else None,
        "onboarding": {
            "csv_imported": csv_orders > 0,
            "csv_count": csv_orders,
            "ss_first": ss_orders > 0,
            "ss_five": ss_orders >= 5,
            "ss_count": ss_orders,
            "tagged_first": tagged_customers > 0,
            "tagged_count": tagged_customers,
            "pdf_header_set": has_pdf_header,
        },
    }


@api.get("/analytics/regions")
async def analytics_regions(
    source: str = Query("both", regex="^(screenshots|csv|both)$"),
    provinsi: Optional[str] = None,
    kota: Optional[str] = None,
    tag_id: Optional[str] = None,
    user=Depends(get_current_user),
):
    """Return province + city + kecamatan aggregates."""
    prov_counter: Counter = Counter()
    kota_counter: Counter = Counter()
    kec_counter: Counter = Counter()
    repeat_kota_counter: Counter = Counter()

    if source in ("screenshots", "both"):
        query = {}
        if tag_id:
            query["tag_ids"] = tag_id
        if provinsi:
            query["provinsi"] = provinsi
        if kota:
            query["kota"] = kota
        async for c in db.customers.find(query, {"_id": 0}):
            if c.get("provinsi"):
                prov_counter[c["provinsi"]] += c.get("order_count", 1)
            if c.get("kota"):
                kota_counter[c["kota"]] += c.get("order_count", 1)
                if c.get("is_repeat"):
                    repeat_kota_counter[c["kota"]] += 1
            if c.get("kecamatan"):
                kec_counter[c["kecamatan"]] += c.get("order_count", 1)

    if source in ("csv", "both"):
        # CSV rows: each row = 1 order. No tag/repeat info from CSV.
        query = {}
        if provinsi:
            query["provinsi"] = provinsi
        if kota:
            query["kota"] = kota
        async for o in db.csv_orders.find(query, {"_id": 0}):
            if o.get("provinsi"):
                prov_counter[o["provinsi"]] += 1
            if o.get("kota"):
                kota_counter[o["kota"]] += 1

    return {
        "provinsi": [{"name": k, "count": v} for k, v in prov_counter.most_common()],
        "kota": [{"name": k, "count": v} for k, v in kota_counter.most_common()],
        "kecamatan": [{"name": k, "count": v} for k, v in kec_counter.most_common()],
        "repeat_kota": [{"name": k, "count": v} for k, v in repeat_kota_counter.most_common()],
    }


# ---------------------------------------------------------------------------
# Segments export
# ---------------------------------------------------------------------------
class SegmentFilter(BaseModel):
    q: Optional[str] = None
    kota: Optional[str] = None
    provinsi: Optional[str] = None
    repeat: Optional[bool] = None
    tag_id: Optional[str] = None
    creator: Optional[str] = None
    follower_tier: Optional[str] = None  # micro | mid | macro | unknown
    date_from: Optional[str] = None
    date_to: Optional[str] = None


async def _query_segment(f: SegmentFilter):
    query: Dict[str, Any] = {}
    if f.q:
        pat = re.escape(f.q)
        query["$or"] = [
            {"recipient_name": {"$regex": pat, "$options": "i"}},
            {"tiktok_username": {"$regex": pat, "$options": "i"}},
            {"phone": {"$regex": pat, "$options": "i"}},
        ]
    if f.kota:
        query["kota"] = f.kota
    if f.provinsi:
        query["provinsi"] = f.provinsi
    if f.repeat is not None:
        query["is_repeat"] = f.repeat
    if f.tag_id:
        query["tag_ids"] = f.tag_id
    if f.creator:
        query["affiliate_creator"] = f.creator
    if f.follower_tier == "micro":
        query["tiktok_followers_num"] = {"$gt": 0, "$lt": 10_000}
    elif f.follower_tier == "mid":
        query["tiktok_followers_num"] = {"$gte": 10_000, "$lte": 100_000}
    elif f.follower_tier == "macro":
        query["tiktok_followers_num"] = {"$gt": 100_000}
    elif f.follower_tier == "unknown":
        query["$and"] = query.get("$and", []) + [
            {"$or": [{"tiktok_followers_num": None}, {"tiktok_followers_num": {"$exists": False}}]}
        ]
    if f.date_from or f.date_to:
        rng = {}
        if f.date_from:
            rng["$gte"] = f.date_from
        if f.date_to:
            rng["$lte"] = f.date_to
        query["last_seen"] = rng
    return await db.customers.find(query, {"_id": 0}).to_list(5000)


@api.post("/segments/preview")
async def segment_preview(body: SegmentFilter, user=Depends(get_current_user)):
    rows = await _query_segment(body)
    return {"count": len(rows), "customers": rows}


@api.post("/segments/export/csv")
async def segment_export_csv(body: SegmentFilter, user=Depends(get_current_user)):
    rows = await _query_segment(body)
    tags_docs = await db.tags.find({}, {"_id": 0}).to_list(200)
    tag_map = {t["id"]: t["name"] for t in tags_docs}

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "recipient_name", "tiktok_username", "phone", "kecamatan", "kota",
        "provinsi", "affiliate_creator", "order_count", "is_repeat",
        "first_seen", "last_seen", "tags", "notes",
    ])
    for r in rows:
        tags = ", ".join([tag_map.get(t, "") for t in r.get("tag_ids", []) if tag_map.get(t)])
        writer.writerow([
            r.get("recipient_name", ""), r.get("tiktok_username", ""), r.get("phone", ""),
            r.get("kecamatan", ""), r.get("kota", ""), r.get("provinsi", ""),
            r.get("affiliate_creator", ""), r.get("order_count", 0), r.get("is_repeat", False),
            r.get("first_seen", ""), r.get("last_seen", ""), tags, r.get("notes", ""),
        ])
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="segmen.csv"'},
    )


# ---------------------------------------------------------------------------
# Bulk ZIP import — background task
# ---------------------------------------------------------------------------
async def _process_zip_job(job_id: str, zip_bytes: bytes):
    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        image_names = [
            n for n in zf.namelist()
            if not n.startswith("__MACOSX")
            and not n.endswith("/")
            and n.lower().rsplit(".", 1)[-1] in {"png", "jpg", "jpeg", "webp"}
        ]
        await db.vision_jobs.update_one(
            {"id": job_id},
            {"$set": {"total": len(image_names), "status": "running"}},
        )
        results: List[Dict[str, Any]] = []
        for idx, name in enumerate(image_names):
            try:
                raw = zf.read(name)
                b64 = base64.b64encode(raw).decode()
                data = await extract_from_image(b64)
                results.append({"filename": name, "extracted": data, "error": None})
            except Exception as e:
                results.append({"filename": name, "extracted": None, "error": str(e)[:200]})
            await db.vision_jobs.update_one(
                {"id": job_id},
                {"$set": {"processed": idx + 1, "results": results, "updated_at": now_iso()}},
            )
        await db.vision_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "done", "updated_at": now_iso()}},
        )
    except Exception as e:
        logger.exception("Zip job failed")
        await db.vision_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "failed", "error": str(e)[:500], "updated_at": now_iso()}},
        )


@api.post("/vision/extract-zip")
async def vision_extract_zip(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not (file.filename or "").lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail=T("zip.must_be_zip"))
    content = await file.read()
    if len(content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=400, detail=T("zip.too_large"))
    job_id = str(uuid.uuid4())
    now = now_iso()
    await db.vision_jobs.insert_one({
        "id": job_id,
        "status": "queued",
        "filename": file.filename,
        "total": 0,
        "processed": 0,
        "results": [],
        "error": None,
        "created_at": now,
        "updated_at": now,
        "user_id": user["sub"],
    })
    asyncio.create_task(_process_zip_job(job_id, content))
    await log_audit(user, "vision.zip", "job", job_id, {"filename": file.filename, "size": len(content)})
    return {"job_id": job_id, "status": "queued"}


@api.get("/vision/jobs/{job_id}")
async def get_vision_job(job_id: str, user=Depends(get_current_user)):
    job = await db.vision_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail=T("job.not_found"))
    return job


# ---------------------------------------------------------------------------
# PDF export — segment
# ---------------------------------------------------------------------------
def _build_segment_pdf(rows: List[dict], tag_map: Dict[str, dict], title: str, header_cfg: Optional[dict] = None) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image

    header_cfg = header_cfg or {}
    shop_name = (header_cfg.get("shop_name") or "").strip()
    shop_note = (header_cfg.get("note") or "").strip()
    logo_data_url = header_cfg.get("logo_data_url") or ""

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        leftMargin=12 * mm, rightMargin=12 * mm,
        topMargin=12 * mm, bottomMargin=12 * mm,
    )
    styles = getSampleStyleSheet()
    shop_style = ParagraphStyle("shop", parent=styles["Heading1"], textColor=colors.HexColor("#C2410C"),
                                fontName="Helvetica-Bold", fontSize=16, leading=20, spaceAfter=2)
    note_style = ParagraphStyle("note", parent=styles["Normal"], textColor=colors.HexColor("#57534E"),
                                fontSize=9, leading=12, spaceAfter=4)
    title_style = ParagraphStyle("t", parent=styles["Heading1"], textColor=colors.HexColor("#1C1917"),
                                 fontName="Helvetica-Bold", fontSize=15, leading=19, spaceAfter=2, spaceBefore=6)
    sub_style = ParagraphStyle("s", parent=styles["Normal"], textColor=colors.HexColor("#78716C"),
                               fontSize=9, leading=12, spaceAfter=10)

    elements: List[Any] = []

    # --- Custom header (logo + shop name + note) ---
    header_right = []
    if shop_name:
        header_right.append(Paragraph(shop_name, shop_style))
    if shop_note:
        header_right.append(Paragraph(shop_note.replace("\n", "<br/>"), note_style))
    if not header_right:
        header_right.append(Paragraph("PelangganKu", shop_style))

    logo_img = None
    if logo_data_url and "," in logo_data_url:
        try:
            b64 = logo_data_url.split(",", 1)[1]
            img_bytes = base64.b64decode(b64)
            # Verify the image is decodable before handing to reportlab (avoids doc.build crashes on corrupt data)
            from PIL import Image as PILImage
            PILImage.open(io.BytesIO(img_bytes)).verify()
            logo_img = Image(io.BytesIO(img_bytes), width=32 * mm, height=32 * mm, kind="proportional")
        except Exception as e:
            logger.warning("Logo decode/verify failed: %s", e)
            logo_img = None

    if logo_img:
        header_table = Table([[logo_img, header_right]], colWidths=[36 * mm, None])
    else:
        header_table = Table([[header_right]], colWidths=[None])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.8, colors.HexColor("#C2410C")),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4 * mm))

    elements.append(Paragraph(title, title_style))
    elements.append(Paragraph(
        f"Dibuat {datetime.now().strftime('%d/%m/%Y %H:%M')} · Total {len(rows)} pelanggan",
        sub_style,
    ))

    header = ["No", "Nama", "Username", "Telepon", "Kota", "Provinsi", "Tag", "Order"]
    data: List[List[Any]] = [header]
    for i, r in enumerate(rows, 1):
        tags = ", ".join([tag_map[t]["name"] for t in r.get("tag_ids", []) if t in tag_map])
        data.append([
            i,
            r.get("recipient_name", "-") or "-",
            r.get("tiktok_username", "-") or "-",
            r.get("phone", "-") or "-",
            r.get("kota", "-") or "-",
            r.get("provinsi", "-") or "-",
            tags or "-",
            r.get("order_count", 0),
        ])
    col_widths = [12*mm, 45*mm, 32*mm, 32*mm, 42*mm, 42*mm, 45*mm, 15*mm]
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C2410C")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#1C1917")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FAF7F2"), colors.white]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#9A3412")),
        ("GRID", (0, 1), (-1, -1), 0.25, colors.HexColor("#E5DEC9")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(table)
    doc.build(elements)
    return buf.getvalue()


@api.post("/segments/export/pdf")
async def segment_export_pdf(body: SegmentFilter, user=Depends(get_current_user)):
    rows = await _query_segment(body)
    tags = await db.tags.find({}, {"_id": 0}).to_list(200)
    tag_map = {t["id"]: t for t in tags}
    header_setting = await db.settings.find_one({"key": "pdf_header"}, {"_id": 0})
    header_cfg = (header_setting or {}).get("value") or {}
    parts = []
    if body.kota: parts.append(body.kota)
    if body.provinsi: parts.append(body.provinsi)
    if body.repeat is True: parts.append("Pembeli Berulang")
    if body.tag_id and body.tag_id in tag_map: parts.append(f"Tag {tag_map[body.tag_id]['name']}")
    title = f"Segmen Pelanggan — {', '.join(parts) if parts else 'Semua'}"
    pdf_bytes = _build_segment_pdf(rows, tag_map, title, header_cfg)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="segmen.pdf"'},
    )


# ---------------------------------------------------------------------------
# Reminder — customers inactive for 30/60/90 days
# ---------------------------------------------------------------------------
@api.get("/reminders")
async def customer_reminders(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    b30 = (now - timedelta(days=30)).isoformat()
    b60 = (now - timedelta(days=60)).isoformat()
    b90 = (now - timedelta(days=90)).isoformat()

    buckets: Dict[str, List[dict]] = {"days_30_59": [], "days_60_89": [], "days_90_plus": []}
    async for c in db.customers.find({"last_seen": {"$lt": b30}}, {"_id": 0}).sort("last_seen", 1):
        ls = c.get("last_seen") or ""
        if ls < b90:
            buckets["days_90_plus"].append(c)
        elif ls < b60:
            buckets["days_60_89"].append(c)
        else:
            buckets["days_30_59"].append(c)

    def _days_since(iso_str):
        try:
            d = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
            return (now - d).days
        except Exception:
            return None

    for b in buckets.values():
        for c in b:
            c["days_since_last_order"] = _days_since(c.get("last_seen", ""))

    return {
        "counts": {k: len(v) for k, v in buckets.items()},
        "buckets": buckets,
    }


# ---------------------------------------------------------------------------
# Audit log — owner only
# ---------------------------------------------------------------------------
@api.get("/audit")
async def list_audit(
    actor: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 300,
    owner=Depends(require_owner),
):
    query: Dict[str, Any] = {}
    if actor: query["actor_email"] = actor
    if action: query["action"] = action
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(min(limit, 500)).to_list(500)
    # counts by action for filter dropdown
    pipeline = [{"$group": {"_id": "$action", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    actions = await db.audit_logs.aggregate(pipeline).to_list(50)
    return {"logs": logs, "actions": [{"action": a["_id"], "count": a["count"]} for a in actions]}


# ---------------------------------------------------------------------------
# Wire router + CORS
# ---------------------------------------------------------------------------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        await seed_all(db)
        logger.info("Seed selesai")
    except Exception as e:
        logger.exception("Seed gagal: %s", e)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
