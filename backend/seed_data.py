"""Seed default users, normalization rules, tags, WA template, and demo customers."""
import uuid
from datetime import datetime, timezone, timedelta
from auth import hash_password


DEFAULT_NORMALIZATION_RULES = [
    ("West Java", "Jawa Barat", "provinsi"),
    ("West Java Province", "Jawa Barat", "provinsi"),
    ("East Java", "Jawa Timur", "provinsi"),
    ("Central Java", "Jawa Tengah", "provinsi"),
    ("Central Java Province", "Jawa Tengah", "provinsi"),
    ("Jakarta", "DKI Jakarta", "provinsi"),
    ("Jakarta Raya", "DKI Jakarta", "provinsi"),
    ("Jakarta Province", "DKI Jakarta", "provinsi"),
    ("North Sumatra", "Sumatera Utara", "provinsi"),
    ("North Sumatra Province", "Sumatera Utara", "provinsi"),
    ("South Sumatra", "Sumatera Selatan", "provinsi"),
    ("South Sumatra Province", "Sumatera Selatan", "provinsi"),
    ("West Sumatra", "Sumatera Barat", "provinsi"),
    ("West Nusa Tenggara", "Nusa Tenggara Barat", "provinsi"),
    ("Central Kalimantan", "Kalimantan Tengah", "provinsi"),
    ("West Kalimantan", "Kalimantan Barat", "provinsi"),
    ("East Kalimantan", "Kalimantan Timur", "provinsi"),
    ("South Kalimantan", "Kalimantan Selatan", "provinsi"),
    ("North Sulawesi", "Sulawesi Utara", "provinsi"),
    ("Riau islands", "Kepulauan Riau", "provinsi"),
    ("South Tangerang", "Kota Tangerang Selatan", "kota"),
    ("Bandung City", "Kota Bandung", "kota"),
    ("Denpasar", "Kota Denpasar", "kota"),
    ("Malang City", "Kota Malang", "kota"),
    ("Medan City", "Kota Medan", "kota"),
    ("Palopo City", "Kota Palopo", "kota"),
]

DEFAULT_TAGS = [
    ("VIP", "#D97706"),
    ("Artis", "#7C2D12"),
    ("Influencer", "#C2410C"),
    ("Reseller", "#166534"),
    ("Langganan", "#0369A1"),
    ("Bermasalah", "#991B1B"),
]

DEFAULT_WA_TEMPLATE = "Halo {nama}, terima kasih sudah belanja di toko kami! Semoga produknya sampai dengan baik ya. Kalau ada kendala, langsung kabari saya. 🙏"

DEFAULT_CSV_MAPPING = {
    "order_id": "Order ID",
    "variation": "Variation",
    "quantity": "Quantity",
    "province": "Province",
    "regency_city": "Regency and City",
    "creator_handle": "Creator Handle",
    "sku_subtotal_after_discount": "SKU Subtotal After Discount",
}


DEMO_CREATORS = [
    ("anyagabrielles", "reviewer skincare"),
    ("sharfeint", "MUA / wedding"),
    ("kittenlazyy", "komunitas hijab"),
    ("catlovers29", "kuliner"),
    ("beauty_by_dinda", "reviewer skincare"),
    ("mba_reseller", "reseller partner"),
]

# 40+ demo buyers across cities
DEMO_CUSTOMERS = [
    # Kota Tangerang Selatan (7)
    ("Rina Kusuma", "rinakusuma", "+6281234567001", "Kota Tangerang Selatan", "Banten", "Ciputat", "Serua", "Jl. Kenanga No. 12", "anyagabrielles"),
    ("Andi Wijaya", "andiwijaya", "+6281234567002", "Kota Tangerang Selatan", "Banten", "Pondok Aren", "Pondok Kacang Timur", "Jl. Melati Blok C7", "sharfeint"),
    ("Sari Melati", "sarimelati", "+6281234567003", "Kota Tangerang Selatan", "Banten", "Serpong", "BSD", "Jl. Pahlawan No. 55", None),
    ("Dewi Anjani", "dewiaja", "+6281234567004", "Kota Tangerang Selatan", "Banten", "Setu", "Kranggan", "Perumahan Vila Melati", "anyagabrielles"),
    ("Bagus Prasetyo", "bagusp", "+6281234567005", "Kota Tangerang Selatan", "Banten", "Ciputat Timur", "Cempaka Putih", "Jl. Anggrek Raya 22", "beauty_by_dinda"),
    ("Nadya Putri", "nadyaptr", "+6281234567006", "Kota Tangerang Selatan", "Banten", "Pamulang", "Pondok Cabe", "Jl. Kemuning Blok A2", "mba_reseller"),
    ("Ryan Adi", "ryanadi", "+6281234567007", "Kota Tangerang Selatan", "Banten", "Ciputat", "Cireundeu", "Jl. Cempaka Blok B", "sharfeint"),

    # Kota Bandung (7)
    ("Cahyo Susmiati", "ssmti11", "+6282238994951", "Kota Bandung", "Jawa Barat", "Coblong", "Dago", "Jl. Ir. H. Juanda No. 100", "anyagabrielles"),
    ("Fira Ramadhani", "firaramad", "+6282238994952", "Kota Bandung", "Jawa Barat", "Cidadap", "Ciumbuleuit", "Jl. Setiabudi No. 45", "sharfeint"),
    ("Doni Ardiansyah", "doniardi", "+6282238994953", "Kota Bandung", "Jawa Barat", "Bandung Kulon", "Cibuntu", "Jl. Pajajaran No. 12", None),
    ("Intan Permata", "intanperm", "+6282238994954", "Kota Bandung", "Jawa Barat", "Sukajadi", "Sukagalih", "Jl. Sukajadi No. 88", "beauty_by_dinda"),
    ("Yoga Prakoso", "yogaprk", "+6282238994955", "Kota Bandung", "Jawa Barat", "Cicendo", "Husein Sastranegara", "Jl. Padjajaran No. 200", "kittenlazyy"),
    ("Maya Larasati", "mayalar", "+6282238994956", "Kota Bandung", "Jawa Barat", "Regol", "Ciateul", "Jl. Buah Batu No. 33", None),
    ("Hendra Kusnadi", "hendrak", "+6282238994957", "Kota Bandung", "Jawa Barat", "Antapani", "Antapani Kidul", "Jl. Antapani Raya 15", "anyagabrielles"),

    # Kota Denpasar (5)
    ("Made Wirawan", "madewira", "+6281338994001", "Kota Denpasar", "Bali", "Denpasar Selatan", "Sanur", "Jl. Danau Tamblingan 45", "catlovers29"),
    ("Kadek Ayu", "kadekayu", "+6281338994002", "Kota Denpasar", "Bali", "Denpasar Barat", "Padangsambian", "Jl. Gunung Agung 78", "beauty_by_dinda"),
    ("Wayan Sutrisna", "wayansu", "+6281338994003", "Kota Denpasar", "Bali", "Denpasar Utara", "Peguyangan", "Jl. Cargo Permai 12", None),
    ("Ni Putu Ratih", "putuath", "+6281338994004", "Kota Denpasar", "Bali", "Denpasar Timur", "Kesiman", "Jl. WR Supratman 90", "sharfeint"),
    ("Gede Bagas", "gedebg", "+6281338994005", "Kota Denpasar", "Bali", "Denpasar Selatan", "Sesetan", "Jl. Sesetan Gg. II", "catlovers29"),

    # Jakarta (DKI) (8)
    ("Siti Aisyah", "sitiais", "+6281299880001", "Kota Administrasi Jakarta Utara", "DKI Jakarta", "Koja", "Rawa Badak Utara", "Jl. Rawa Badak Barat Gang J No. 26 RT.4/RW.5", "anyagabrielles"),
    ("Reza Fauzan", "rezafz", "+6281299880002", "Kota Administrasi Jakarta Selatan", "DKI Jakarta", "Kebayoran Baru", "Melawai", "Jl. Melawai IX No. 3", "beauty_by_dinda"),
    ("Putri Amelia", "putriaml", "+6281299880003", "Kota Administrasi Jakarta Pusat", "DKI Jakarta", "Menteng", "Menteng", "Jl. Cikini Raya 50", "sharfeint"),
    ("Bayu Nugroho", "bayung", "+6281299880004", "Kota Administrasi Jakarta Timur", "DKI Jakarta", "Cakung", "Pulo Gebang", "Jl. Pulo Gebang Permai 25", "kittenlazyy"),
    ("Larasati", "larasati", "+6281299880005", "Kota Administrasi Jakarta Barat", "DKI Jakarta", "Kembangan", "Meruya Utara", "Jl. Meruya Ilir 88", None),
    ("Fajar Ramadhan", "fajarr", "+6281299880006", "Kota Administrasi Jakarta Utara", "DKI Jakarta", "Kelapa Gading", "Kelapa Gading Barat", "Jl. Boulevard Raya 12", "anyagabrielles"),
    ("Tania Dewi", "taniadw", "+6281299880007", "Kota Administrasi Jakarta Selatan", "DKI Jakarta", "Cilandak", "Cilandak Barat", "Jl. TB Simatupang 44", "mba_reseller"),
    ("Adit Wibowo", "aditwb", "+6281299880008", "Kota Administrasi Jakarta Pusat", "DKI Jakarta", "Tanah Abang", "Karet Tengsin", "Jl. KH Mas Mansyur 15", "sharfeint"),

    # Medan (7)
    ("Grace Simanjuntak", "gracesima", "+6281377220001", "Kota Medan", "Sumatera Utara", "Medan Baru", "Titi Rantai", "Jl. Dr. Mansyur 22", "kittenlazyy"),
    ("Rian Tarigan", "riantar", "+6281377220002", "Kota Medan", "Sumatera Utara", "Medan Selayang", "Beringin", "Jl. Setia Budi 100", None),
    ("Novi Sinaga", "novisng", "+6281377220003", "Kota Medan", "Sumatera Utara", "Medan Perjuangan", "Sidorame Barat", "Jl. Ibrahim Umar 45", "beauty_by_dinda"),
    ("Boy Sitorus", "boysit", "+6281377220004", "Kota Medan", "Sumatera Utara", "Medan Tembung", "Bantan", "Jl. Letda Sujono 8", "sharfeint"),
    ("Fanny Nasution", "fannynst", "+6281377220005", "Kota Medan", "Sumatera Utara", "Medan Amplas", "Amplas", "Jl. SM Raja 200", "anyagabrielles"),
    ("Christian Purba", "chrispb", "+6281377220006", "Kota Medan", "Sumatera Utara", "Medan Deli", "Tanjung Mulia", "Jl. Yos Sudarso 15", None),
    ("Wulan Manik", "wulanmn", "+6281377220007", "Kota Medan", "Sumatera Utara", "Medan Baru", "Petisah Hulu", "Jl. Iskandar Muda 55", "catlovers29"),

    # Palopo (6)
    ("Muhammad Fauzi", "mfauzi", "+6281543210001", "Kota Palopo", "Sulawesi Selatan", "Wara", "Batupasi", "Jl. Sudirman No. 12", None),
    ("Aisyah Nur", "aisynur", "+6281543210002", "Kota Palopo", "Sulawesi Selatan", "Wara Utara", "Salobulo", "Jl. Merdeka 22", "beauty_by_dinda"),
    ("Ridwan Halid", "ridwanh", "+6281543210003", "Kota Palopo", "Sulawesi Selatan", "Wara Barat", "Battang", "Jl. Diponegoro 8", "mba_reseller"),
    ("Nurul Fitria", "nurulftr", "+6281543210004", "Kota Palopo", "Sulawesi Selatan", "Bara", "Rampoang", "Jl. Andi Djemma 33", "anyagabrielles"),
    ("Ilham Prasetyo", "ilhamp", "+6281543210005", "Kota Palopo", "Sulawesi Selatan", "Telluwanua", "Battang Barat", "Jl. Poros Palopo-Toraja Km. 5", None),
    ("Sartika Rusli", "sartikar", "+6281543210006", "Kota Palopo", "Sulawesi Selatan", "Sendana", "Sendana", "Jl. Trans Sulawesi 100", "catlovers29"),
]

# Customers with multiple orders (repeat buyers by phone)
REPEAT_PHONES = {
    "+6282238994951": 3,  # Cahyo -- 3 orders
    "+6281299880001": 4,  # Siti Aisyah -- 4 orders
    "+6281338994001": 2,
    "+6281377220001": 2,
    "+6281543210004": 2,
    "+6281234567001": 2,
    "+6281234567006": 3,
}

# VIP/Influencer/Note assignments
DEMO_TAGS = {
    "+6282238994951": ["VIP"],
    "+6281299880001": ["VIP", "Langganan"],
    "+6281234567006": ["Reseller"],
    "+6281338994002": ["Influencer"],
    "+6281299880006": ["Influencer"],
    "+6281377220005": ["Langganan"],
    "+6281543210004": ["Langganan"],
}

DEMO_NOTES = {
    "+6282238994951": "Pelanggan sejak 2024, sering repeat order pembersih kuas. Suka warna Bare Essence.",
    "+6281299880001": "VIP customer — order rutin 4x. Kirim bonus sample setiap paket.",
    "+6281338994002": "Follower TikTok 120K, sering repost produk. Beri harga khusus.",
    "+6281234567006": "Reseller Jabodetabek, order per lusin. Diskon reseller aktif.",
}


async def seed_all(db):
    now = datetime.now(timezone.utc).isoformat()

    # 1. Users
    if not await db.users.find_one({"email": "owner@petapembeli.id"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "owner@petapembeli.id",
            "password_hash": hash_password("owner123"),
            "role": "owner",
            "name": "Owner Toko",
            "created_at": now,
        })
    if not await db.users.find_one({"email": "operator@petapembeli.id"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "operator@petapembeli.id",
            "password_hash": hash_password("operator123"),
            "role": "operator",
            "name": "Operator",
            "created_at": now,
        })

    # 2. Normalization rules
    if await db.norm_rules.count_documents({}) == 0:
        docs = [
            {"id": str(uuid.uuid4()), "raw": r, "normalized": n, "level": lvl, "created_at": now}
            for r, n, lvl in DEFAULT_NORMALIZATION_RULES
        ]
        await db.norm_rules.insert_many(docs)

    # 3. Tags
    if await db.tags.count_documents({}) == 0:
        docs = [
            {"id": str(uuid.uuid4()), "name": n, "color": c, "created_at": now}
            for n, c in DEFAULT_TAGS
        ]
        await db.tags.insert_many(docs)

    # 4. WA template
    if not await db.settings.find_one({"key": "wa_template"}):
        await db.settings.insert_one({"key": "wa_template", "value": DEFAULT_WA_TEMPLATE})
    if not await db.settings.find_one({"key": "csv_mapping"}):
        await db.settings.insert_one({"key": "csv_mapping", "value": DEFAULT_CSV_MAPPING})

    # 5. Creator niches
    if await db.creator_niches.count_documents({}) == 0:
        docs = [
            {"id": str(uuid.uuid4()), "handle": h, "niche": n, "created_at": now}
            for h, n in DEMO_CREATORS
        ]
        await db.creator_niches.insert_many(docs)

    # 6. Demo customers + orders
    if await db.customers.count_documents({}) == 0:
        base_date = datetime.now(timezone.utc) - timedelta(days=90)
        order_counter = 1000

        for idx, (name, uname, phone, kota, prov, kec, kel, detail, creator) in enumerate(DEMO_CUSTOMERS):
            cust_id = str(uuid.uuid4())
            n_orders = REPEAT_PHONES.get(phone, 1)
            first_seen = (base_date + timedelta(days=idx)).isoformat()
            last_seen = (base_date + timedelta(days=idx + n_orders * 7)).isoformat()

            # Fetch tag ids
            tag_ids = []
            for tag_name in DEMO_TAGS.get(phone, []):
                t = await db.tags.find_one({"name": tag_name})
                if t:
                    tag_ids.append(t["id"])

            await db.customers.insert_one({
                "id": cust_id,
                "recipient_name": name,
                "tiktok_username": uname,
                "phone": phone,
                "kota": kota,
                "provinsi": prov,
                "kecamatan": kec,
                "kelurahan": kel,
                "address_detail": detail,
                "negara": "Indonesia",
                "affiliate_creator": creator,
                "order_count": n_orders,
                "is_repeat": n_orders > 1,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "notes": DEMO_NOTES.get(phone, ""),
                "tag_ids": tag_ids,
                "source": "screenshot",
                "created_at": now,
            })

            # Create n_orders order records
            for k in range(n_orders):
                order_counter += 1
                await db.orders.insert_one({
                    "id": str(uuid.uuid4()),
                    "order_id": f"5859{order_counter:015d}",
                    "customer_id": cust_id,
                    "phone": phone,
                    "recipient_name": name,
                    "tiktok_username": uname,
                    "kota": kota,
                    "provinsi": prov,
                    "kecamatan": kec,
                    "kelurahan": kel,
                    "address_detail": detail,
                    "negara": "Indonesia",
                    "affiliate_creator": creator,
                    "created_at_order": (base_date + timedelta(days=idx + k * 7)).strftime("%d/%m/%Y %H:%M:%S"),
                    "source": "screenshot",
                    "variation": None,
                    "quantity": 1,
                    "created_at": now,
                })
