"""
Data contoh PelangganKu — 100 pembeli fiktif.

Dipakai untuk memperagakan aplikasi ke calon pembeli, dan untuk menguji
sendiri tanpa memakai data pelanggan sungguhan. Aktif hanya kalau
SEED_DEMO=1; tanpa itu aplikasi mulai benar-benar kosong.

Datanya sengaja dirancang supaya SETIAP halaman punya isi yang masuk akal:

  Ikhtisar            angka ringkasan, tren 6 bulan, pembeli terbaru
  Database Pelanggan  100 baris, beragam kota, follower, tag, creator
  Peta & Lokasi       tersebar di 20 provinsi supaya peta berwarna
  Analisis Creator    8 kreator + pembeli organik, dengan niche
  Omset per Varian    5 varian produk dengan omset berbeda
  Segmen Reminder     tanggal belanja tersebar, ada yang lama tak kembali
  Perlu Di-SS         sebagian pesanan CSV sengaja tanpa screenshot
  Alert Berpengaruh   beberapa pembeli dengan follower di atas 100rb
  Segmen & Export     cukup variasi untuk disaring dan diekspor

SEMUA DATA DI SINI FIKTIF. Nomor telepon memakai pola berurutan
(+628110000001 dan seterusnya) supaya jelas bukan nomor orang sungguhan
dan tidak mungkin tidak sengaja dihubungi.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------------- bahan dasar
DEPAN_P = ["Siti", "Dewi", "Rina", "Putri", "Ayu", "Intan", "Lestari", "Maya",
           "Novi", "Rani", "Sari", "Wulan", "Yuni", "Anisa", "Citra", "Fitri",
           "Gita", "Hesti", "Indah", "Kartika", "Melati", "Nadia", "Olivia",
           "Ratna", "Tiara", "Vina", "Zahra", "Alya", "Bunga", "Clara"]
DEPAN_L = ["Agus", "Budi", "Candra", "Dimas", "Eko", "Fajar", "Galih", "Hadi",
           "Irfan", "Joko", "Krisna", "Lukman", "Mulyadi", "Naufal", "Oka",
           "Prasetyo", "Rizky", "Surya", "Teguh", "Umar", "Wahyu", "Yusuf"]
BELAKANG = ["Pratama", "Wijaya", "Santoso", "Nugroho", "Saputra", "Hidayat",
            "Kusuma", "Maharani", "Anggraini", "Permata", "Lestari", "Utami",
            "Puspita", "Ramadhan", "Setiawan", "Handayani", "Rahmawati",
            "Firmansyah", "Simanjuntak", "Sihombing", "Situmorang", "Gunawan",
            "Halim", "Wibowo", "Purnama", "Cahyani", "Mahendra", "Susanti"]

# (provinsi, kota, [kecamatan], [kelurahan], bobot)
#
# Bobot meniru sebaran pembeli online Indonesia yang sebenarnya: menumpuk
# di Jawa dan Jabodetabek, menipis ke timur. Tanpa ini datanya terlihat
# rata di semua provinsi — dan langsung ketahuan buatan.
WILAYAH = [
    ("DKI Jakarta", "Jakarta Selatan", ["Kebayoran Baru", "Tebet", "Pancoran"], ["Gandaria Utara", "Tebet Barat", "Kalibata"], 9),
    ("DKI Jakarta", "Jakarta Timur", ["Duren Sawit", "Cakung", "Jatinegara"], ["Klender", "Pulo Gebang", "Bali Mester"], 8),
    ("Jawa Barat", "Bandung", ["Coblong", "Antapani", "Buahbatu"], ["Dago", "Antapani Kidul", "Sekejati"], 9),
    ("Jawa Barat", "Depok", ["Pancoran Mas", "Beji", "Cimanggis"], ["Depok Jaya", "Kemiri Muka", "Tugu"], 7),
    ("Jawa Barat", "Bekasi", ["Bekasi Selatan", "Rawalumbu"], ["Jaka Mulya", "Bojong Rawalumbu"], 8),
    ("Banten", "Tangerang Selatan", ["Ciputat", "Pondok Aren", "Serpong"], ["Serua", "Pondok Kacang Timur", "Lengkong Gudang"], 7),
    ("Banten", "Serang", ["Serang", "Cipocok Jaya"], ["Sumurpecung", "Banjarsari"], 3),
    ("Jawa Tengah", "Semarang", ["Banyumanik", "Tembalang"], ["Pedalangan", "Bulusan"], 6),
    ("Jawa Tengah", "Sukoharjo", ["Kartasura", "Grogol"], ["Pabelan", "Madegondo"], 3),
    ("DI Yogyakarta", "Yogyakarta", ["Umbulharjo", "Mergangsan"], ["Giwangan", "Brontokusuman"], 5),
    ("Jawa Timur", "Surabaya", ["Gubeng", "Rungkut", "Wiyung"], ["Airlangga", "Kalirungkut", "Babatan"], 8),
    ("Jawa Timur", "Malang", ["Lowokwaru", "Klojen"], ["Tunjungsekar", "Kauman"], 5),
    ("Bali", "Gianyar", ["Sukawati", "Ubud"], ["Batubulan Kangin", "Peliatan"], 3),
    ("Bali", "Denpasar", ["Denpasar Selatan", "Denpasar Barat"], ["Sanur Kaja", "Padangsambian"], 4),
    ("Sumatera Utara", "Medan", ["Medan Baru", "Medan Johor"], ["Padang Bulan", "Kedai Durian"], 5),
    ("Sumatera Barat", "Padang", ["Padang Barat", "Koto Tangah"], ["Purus", "Lubuk Buaya"], 3),
    ("Sumatera Selatan", "Palembang", ["Ilir Barat I", "Kemuning"], ["Demang Lebar Daun", "Pipa Reja"], 3),
    ("Riau", "Pekanbaru", ["Marpoyan Damai", "Tampan"], ["Sidomulyo Timur", "Simpang Baru"], 3),
    ("Kepulauan Riau", "Batam", ["Batam Kota", "Sagulung"], ["Belian", "Sungai Binti"], 3),
    ("Lampung", "Bandar Lampung", ["Kedaton", "Rajabasa"], ["Surabaya", "Gedong Meneng"], 8),
    ("Kalimantan Timur", "Samarinda", ["Samarinda Ulu", "Sungai Kunjang"], ["Air Putih", "Loa Bakung"], 2),
    ("Kalimantan Selatan", "Banjarmasin", ["Banjarmasin Utara"], ["Sungai Miai"], 2),
    ("Kalimantan Barat", "Pontianak", ["Pontianak Kota", "Pontianak Tenggara"], ["Sungai Bangkong", "Bansir Laut"], 2),
    ("Sulawesi Selatan", "Makassar", ["Panakkukang", "Rappocini"], ["Masale", "Gunung Sari"], 4),
    ("Sulawesi Selatan", "Palopo", ["Wara", "Wara Utara"], ["Dangerakko", "Sabbamparu"], 2),
    ("Sulawesi Utara", "Manado", ["Malalayang"], ["Winangun Satu"], 2),
    ("Nusa Tenggara Barat", "Mataram", ["Cakranegara", "Mataram"], ["Cakranegara Barat", "Pagesangan"], 2),
    ("Nusa Tenggara Timur", "Kupang", ["Oebobo"], ["Oebufu"], 1),
    ("Papua", "Jayapura", ["Abepura"], ["Yobe"], 1),
    ("Aceh", "Banda Aceh", ["Syiah Kuala"], ["Rukoh"], 2),
]

JALAN = ["Jl. Melati", "Jl. Kenanga", "Jl. Anggrek", "Jl. Mawar", "Jl. Cempaka",
         "Jl. Flamboyan", "Jl. Bougenville", "Jl. Dahlia", "Jl. Seroja",
         "Gang Bahagia", "Komplek Griya Asri", "Perumahan Bumi Indah",
         "Jl. Merpati", "Jl. Rajawali", "Jl. Nuri", "Jl. Cendrawasih"]
PENANDA = ["pagar hijau", "rumah cat kuning", "sebelah warung Bu Tuti",
           "depan masjid", "belakang indomaret", "pagar hitam", "rumah pojok",
           "sebelah apotek", "dekat lapangan", "rumah nomor ujung"]

# kreator afiliasi + bidangnya
KREATOR = [
    ("anyagabrielles", "reviewer skincare"),
    ("sharfeint", "MUA / wedding"),
    ("kittenlazyy", "komunitas hijab"),
    ("catlovers29", "kuliner"),
    ("beauty_by_dinda", "reviewer skincare"),
    ("mba_reseller", "reseller partner"),
    ("glowupdaily", "tutorial makeup"),
    ("brushclean.id", "peralatan makeup"),
]

# varian produk + harga satuan (rupiah)
VARIAN = [
    ("Woodland Essence 60ml", 89_000),
    ("Citrus Bloom 60ml", 89_000),
    ("Rose Petal 60ml", 95_000),
    ("Ocean Breeze 120ml", 149_000),
    ("Paket Hemat 2 Botol", 165_000),
]

PROFESI = ["MUA", "Reseller", "Mahasiswa", "Karyawan", "Ibu Rumah Tangga",
           "Content Creator", "Pemilik Salon", None, None, None]

CATATAN = [
    "Minta dikirim sore, siang tidak ada orang.",
    "Repeat order tiap bulan.",
    "Pernah komplain botol bocor, sudah diganti.",
    "Reseller di daerahnya, sering ambil banyak.",
    "Minta bubble wrap ekstra.",
    "Cocok diajak kerja sama afiliasi.",
]


def _nama() -> tuple[str, str]:
    if random.random() < 0.68:
        depan = random.choice(DEPAN_P)
    else:
        depan = random.choice(DEPAN_L)
    nama = f"{depan} {random.choice(BELAKANG)}"
    uname = (depan[:4] + random.choice(["", "_", "."]) +
             nama.split()[1][:5]).lower() + random.choice(["", "", "id", "01", "xx"])
    return nama, uname


def _profil() -> tuple[int, int] | None:
    """Sebaran follower meniru kenyataan: mayoritas kecil, sedikit besar."""
    r = random.random()
    if r < 0.06:
        return None                                   # profil tidak terbaca
    if r < 0.66:
        f = random.randint(80, 9_500)                 # micro
    elif r < 0.90:
        f = random.randint(10_000, 96_000)            # mid
    else:
        f = random.randint(120_000, 2_800_000)        # macro -> memicu alert
    return f, f * random.randint(4, 16)


def _rupiah_acak(dasar: int) -> float:
    """Harga setelah diskon acak kecil, seperti di laporan TikTok."""
    potongan = random.choice([0, 0, 0, 5_000, 10_000, 15_000])
    return float(max(0, dasar - potongan))


def buat_data(jumlah: int = 100, benih: int = 20260921) -> dict:
    """Bangun seluruh data contoh. Hasilnya bisa diulang persis (benih tetap)."""
    random.seed(benih)
    sekarang = datetime.now(timezone.utc)
    now_iso = sekarang.isoformat()
    awal = sekarang - timedelta(days=180)

    pelanggan, pesanan, pesanan_csv = [], [], []
    nomor_urut = 0
    dipakai_uname: set[str] = set()

    for i in range(jumlah):
        prov, kota, kecs, kels, _ = random.choices(
            WILAYAH, weights=[w[4] for w in WILAYAH], k=1)[0]
        nama, uname = _nama()
        while uname in dipakai_uname:
            nama, uname = _nama()
        dipakai_uname.add(uname)

        telepon = f"+62811{i + 1:07d}"          # berurutan = jelas fiktif
        profil = _profil()
        kreator = (random.choice(KREATOR)[0]
                   if random.random() < 0.70 else None)   # 30% organik

        # 25% pembeli berulang, 2-5 kali
        n_pesanan = random.choice([2, 2, 3, 3, 4, 5]) if random.random() < 0.25 else 1

        hari_pertama = random.randint(0, 150)
        pertama = awal + timedelta(days=hari_pertama)
        jeda = [random.randint(12, 45) for _ in range(n_pesanan - 1)]
        terakhir = pertama + timedelta(days=sum(jeda))
        if terakhir > sekarang:
            terakhir = sekarang - timedelta(days=random.randint(0, 5))

        cid = str(uuid.uuid4())
        pelanggan.append({
            "id": cid,
            "recipient_name": nama,
            "tiktok_username": uname,
            "phone": telepon,
            "kota": kota,
            "provinsi": prov,
            "kecamatan": random.choice(kecs),
            "kelurahan": random.choice(kels),
            "address_detail": (f"{random.choice(JALAN)} No. {random.randint(1, 180)}"
                               f" ({random.choice(PENANDA)})"),
            "negara": "Indonesia",
            "affiliate_creator": kreator,
            "order_count": n_pesanan,
            "is_repeat": n_pesanan > 1,
            "first_seen": pertama.isoformat(),
            "last_seen": terakhir.isoformat(),
            "notes": random.choice(CATATAN) if random.random() < 0.18 else "",
            "profession": random.choice(PROFESI),
            "tiktok_followers": None if not profil else _ringkas(profil[0]),
            "tiktok_likes": None if not profil else _ringkas(profil[1]),
            "tiktok_followers_num": profil[0] if profil else None,
            "tiktok_likes_num": profil[1] if profil else None,
            "tag_ids": [],                      # diisi saat penanaman
            "_tag_names": _tag_untuk(profil, n_pesanan),
            "source": "screenshot",
            "created_at": now_iso,
        })

        tanggal = pertama
        for k in range(n_pesanan):
            if k:
                tanggal = tanggal + timedelta(days=jeda[k - 1])
            if tanggal > sekarang:
                tanggal = sekarang - timedelta(days=random.randint(0, 3))
            nomor_urut += 1
            order_id = f"5859{nomor_urut:015d}"
            varian, harga = random.choice(VARIAN)
            qty = random.choice([1, 1, 1, 2, 2, 3])

            # 88% pesanan sempat di-screenshot; sisanya jadi isi "Perlu Di-SS"
            ada_screenshot = random.random() < 0.88
            if ada_screenshot:
                pesanan.append({
                    "id": str(uuid.uuid4()),
                    "order_id": order_id,
                    "customer_id": cid,
                    "phone": telepon,
                    "recipient_name": nama,
                    "tiktok_username": uname,
                    "kota": kota,
                    "provinsi": prov,
                    "kecamatan": pelanggan[-1]["kecamatan"],
                    "kelurahan": pelanggan[-1]["kelurahan"],
                    "address_detail": pelanggan[-1]["address_detail"],
                    "negara": "Indonesia",
                    "affiliate_creator": kreator,
                    "created_at_order": tanggal.strftime("%d/%m/%Y %H:%M:%S"),
                    "source": "screenshot",
                    "variation": varian,
                    "quantity": qty,
                    "created_at": now_iso,
                })

            # laporan CSV mencatat SEMUA pesanan, termasuk yang tak ter-screenshot
            pesanan_csv.append({
                "line_key": f"{order_id}|{varian}",
                "order_id": order_id,
                "variation": varian,
                "quantity": qty,
                "sku_subtotal_after_discount": _rupiah_acak(harga) * qty,
                "provinsi": prov,
                "provinsi_raw": prov,
                "kota": kota,
                "kota_raw": kota,
                "affiliate_creator": kreator,
                "created_at_order": tanggal.strftime("%d/%m/%Y %H:%M:%S"),
                "imported_at": now_iso,
            })

    return {
        "pelanggan": pelanggan,
        "pesanan": pesanan,
        "pesanan_csv": pesanan_csv,
        "kreator": [{"handle": h, "niche": n} for h, n in KREATOR],
    }


def _ringkas(n: int) -> str:
    """1234 -> '1.2K', 2500000 -> '2.5M' — seperti tampilan TikTok."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M".replace(".0M", "M")
    if n >= 1_000:
        return f"{n / 1_000:.1f}K".replace(".0K", "K")
    return str(n)


def _tag_untuk(profil, n_pesanan: int) -> list[str]:
    tag = []
    if profil and profil[0] >= 120_000:
        tag.append("Influencer")
    if n_pesanan >= 4:
        tag.append("VIP")
    elif n_pesanan >= 2 and random.random() < 0.5:
        tag.append("Langganan")
    if not tag and random.random() < 0.08:
        tag.append("Reseller")
    return tag
