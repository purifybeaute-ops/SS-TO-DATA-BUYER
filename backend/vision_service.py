"""
Ekstraksi data pesanan TikTok Shop dari screenshot — bertingkat.

Tingkat 1  OCR lokal (RapidOCR, berjalan di komputer pengguna, gratis).
Tingkat 2  Gemini — HANYA dipanggil kalau hasil lokal meragukan.

Tujuannya menekan biaya: mayoritas screenshot bersih dan selesai di
tingkat 1 tanpa biaya sepeser pun. Yang buram, terpotong, atau tampilannya
berubah baru naik ke tingkat 2.

Bentuk keluaran sengaja dibuat sama persis dengan versi lama supaya
server.py dan tampilan depan tidak perlu diubah sama sekali.
"""
from __future__ import annotations

import base64
import io
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

# ambang: di bawah ini dianggap meragukan dan dinaikkan ke AI
AMBANG_NAIK = float(os.environ.get("OCR_AMBANG_NAIK", "0.75"))
WAJIB = ("recipient_name", "phone", "full_address_raw")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
AI_DIIZINKAN = os.environ.get("OCR_IZINKAN_AI", "1") not in ("0", "false", "False")

_mesin = None


def _ocr():
    """Muat mesin OCR sekali saja (pemuatan pertama ~2 detik)."""
    global _mesin
    if _mesin is None:
        from rapidocr_onnxruntime import RapidOCR
        _mesin = RapidOCR()
    return _mesin


# --------------------------------------------------------------- pola teks
RE_HP = re.compile(r"\(?\+?62\)?[\s-]*(\d[\d\s-]{7,15})")
RE_SENSOR = re.compile(r"[*x]{3,}", re.I)
RE_ANGKA_SOSIAL = re.compile(r"^[\d.,]+\s*[KMBkmb]?$")
RE_ID_PESANAN = re.compile(r"\b(\d{12,22})\b")
RE_WAKTU = re.compile(r"\b(\d{2}/\d{2}/\d{4}[\s,]*\d{2}:\d{2}(?::\d{2})?)\b")


class Blok:
    """Satu potongan teks hasil OCR beserta posisi dan keyakinannya."""

    __slots__ = ("teks", "skor", "x", "y", "x2", "y2")

    def __init__(self, kotak, teks: str, skor: float):
        xs = [p[0] for p in kotak]
        ys = [p[1] for p in kotak]
        self.teks = teks.strip()
        self.skor = float(skor)
        self.x, self.x2 = min(xs), max(xs)
        self.y, self.y2 = min(ys), max(ys)

    @property
    def tengah_y(self) -> float:
        return (self.y + self.y2) / 2

    @property
    def tinggi(self) -> float:
        return max(1.0, self.y2 - self.y)

    def __repr__(self) -> str:
        return f"Blok({self.teks[:28]!r} y={self.y:.0f} s={self.skor:.2f})"


def baca_blok(gambar_bytes: bytes) -> List[Blok]:
    hasil, _ = _ocr()(gambar_bytes)
    if not hasil:
        return []
    blok = [Blok(k, t, s) for k, t, s in hasil if str(t).strip()]
    blok.sort(key=lambda b: (b.y, b.x))
    return blok


# ------------------------------------------------------------ bantu parsing
def _cari(blok: List[Blok], pola: str, mulai: int = 0) -> Optional[int]:
    for i in range(mulai, len(blok)):
        if re.search(pola, blok[i].teks, re.I):
            return i
    return None


def _nilai_sebaris(blok: List[Blok], i: int) -> Optional[Blok]:
    """Ambil blok di kanan blok ke-i pada baris yang sama (pasangan label–nilai)."""
    acuan = blok[i]
    kandidat = [
        b for b in blok
        if b is not acuan
        and b.x > acuan.x2 - acuan.tinggi * 0.4
        and abs(b.tengah_y - acuan.tengah_y) < acuan.tinggi * 0.75
    ]
    return min(kandidat, key=lambda b: b.x) if kandidat else None


def _paragraf(blok: List[Blok], awal: int, akhir: int) -> List[Tuple[str, float]]:
    """Gabungkan blok jadi paragraf: baris yang berdekatan secara vertikal
    dianggap satu paragraf yang terpotong lebar layar."""
    potongan = blok[awal:akhir]
    if not potongan:
        return []
    paragraf: List[List[Blok]] = [[potongan[0]]]
    for b in potongan[1:]:
        sebelum = paragraf[-1][-1]
        jarak = b.y - sebelum.y2
        if jarak < sebelum.tinggi * 0.55:
            paragraf[-1].append(b)
        else:
            paragraf.append([b])
    keluar = []
    for p in paragraf:
        teks = " ".join(x.teks for x in p).strip()
        skor = min(x.skor for x in p)
        if teks:
            keluar.append((teks, skor))
    return keluar


def normalize_phone(raw: Optional[str]) -> Optional[str]:
    """Samakan bentuk nomor Indonesia jadi +62XXXXXXXXX."""
    if not raw:
        return None
    digit = re.sub(r"\D", "", raw)
    if not digit:
        return None
    if digit.startswith("62"):
        return "+" + digit
    if digit.startswith("0"):
        return "+62" + digit[1:]
    if digit.startswith("8"):
        return "+62" + digit
    return "+" + digit


def parse_social_count(raw: Optional[str]) -> Optional[int]:
    """'1.2K' / '23,4K' / '2.1M' / '156' -> bilangan bulat."""
    if raw is None:
        return None
    s = str(raw).strip().replace(" ", "")
    m = re.match(r"^([\d.,]+)\s*([KMBkmb])?", s)
    if not m:
        return None
    angka, akhiran = m.group(1), (m.group(2) or "").upper()
    # '1.2K' -> desimal ; '1.234' tanpa akhiran -> pemisah ribuan
    if akhiran:
        angka = angka.replace(",", ".")
    else:
        angka = angka.replace(".", "").replace(",", "")
    try:
        nilai = float(angka)
    except ValueError:
        return None
    return int(nilai * {"": 1, "K": 1_000, "M": 1_000_000, "B": 1_000_000_000}[akhiran])


def parse_address(raw: Optional[str]) -> Dict[str, Optional[str]]:
    """Pecah alamat jadi detail + kelurahan/kecamatan/kota/provinsi/negara.

    Baris terakhir alamat TikTok selalu berpola:
    kelurahan, kecamatan, kota, provinsi, negara
    """
    keluar: Dict[str, Optional[str]] = {
        "address_detail": None, "kelurahan": None, "kecamatan": None,
        "kota": None, "provinsi": None, "negara": None,
    }
    if not raw:
        return keluar

    baris = [b.strip() for b in re.split(r"[\n\r]+", raw.strip()) if b.strip()]
    if not baris:
        return keluar

    # cari baris wilayah = baris yang diakhiri nama negara
    idx_wilayah = None
    for i in range(len(baris) - 1, -1, -1):
        if re.search(r"(indonesia)\s*$", baris[i], re.I):
            idx_wilayah = i
            break

    if idx_wilayah is None:
        keluar["address_detail"] = " ".join(baris).strip(" ,")
        return keluar

    bagian = [p.strip() for p in baris[idx_wilayah].split(",") if p.strip()]
    ekor = bagian[-5:] if len(bagian) >= 5 else bagian
    if len(ekor) == 5:
        (keluar["kelurahan"], keluar["kecamatan"], keluar["kota"],
         keluar["provinsi"], keluar["negara"]) = ekor
    elif len(ekor) == 4:
        (keluar["kelurahan"], keluar["kecamatan"],
         keluar["kota"], keluar["provinsi"]) = ekor
        keluar["negara"] = "Indonesia"
    elif len(ekor) == 3:
        keluar["kecamatan"], keluar["kota"], keluar["provinsi"] = ekor
        keluar["negara"] = "Indonesia"
    elif len(ekor) == 2:
        keluar["kota"], keluar["provinsi"] = ekor
        keluar["negara"] = "Indonesia"

    sisa = baris[:idx_wilayah]
    # kalau detail alamat menempel di baris wilayah, potong bagian ekornya
    if not sisa and len(bagian) > len(ekor):
        sisa = [", ".join(bagian[:len(bagian) - len(ekor)])]
    keluar["address_detail"] = " ".join(sisa).strip(" ,") or None
    return keluar


# -------------------------------------------------------- ekstraksi tingkat 1
def ekstrak_lokal(gambar_bytes: bytes) -> Dict[str, Any]:
    blok = baca_blok(gambar_bytes)
    data: Dict[str, Any] = {
        k: None for k in (
            "order_id", "created_at", "tiktok_username", "tiktok_followers",
            "tiktok_likes", "recipient_name", "phone", "full_address_raw",
            "affiliate_creator")
    }
    yakin: Dict[str, float] = {k: 0.0 for k in data}

    if not blok:
        return {**data, "confidence": yakin, "_sumber": "lokal",
                "_tersensor": False, "_halaman_pesanan": False}

    semua_teks = "\n".join(b.teks for b in blok)
    halaman_pesanan = bool(
        re.search(r"alamat\s*peng[il1]r[il1]m", semua_teks, re.I)
        or (RE_HP.search(semua_teks) and re.search(r"\bIndonesia\b", semua_teks, re.I))
    )
    tersensor = bool(RE_SENSOR.search(semua_teks))

    # --- nama pengguna TikTok ---
    i = _cari(blok, r"^(Pembeli|Nama pengguna)\b")
    if i is not None:
        for b in blok[i + 1:i + 4]:
            if re.match(r"^(Alamat|Kontak)", b.teks, re.I):
                continue
            data["tiktok_username"] = b.teks
            yakin["tiktok_username"] = b.skor
            break

    # --- blok alamat ---
    i = _cari(blok, r"alamat\s*peng[il1]r[il1]m")
    if i is not None:
        j = _cari(blok, r"(Detail pesanan|Rincian pesanan|Yang dibayar|Metode)", i + 1)
        paragraf = _paragraf(blok, i + 1, j if j is not None else len(blok))

        baris_alamat: List[str] = []
        skor_alamat: List[float] = []
        for teks, skor in paragraf:
            m = RE_HP.search(teks)
            if m and not data["phone"]:
                data["phone"] = m.group(0).strip()
                yakin["phone"] = skor
                sisa = RE_HP.sub("", teks).strip(" ()-,")
                if sisa:
                    baris_alamat.append(sisa)
                    skor_alamat.append(skor)
                continue
            if not data["recipient_name"] and not baris_alamat and not data["phone"]:
                data["recipient_name"] = teks
                yakin["recipient_name"] = skor
                continue
            baris_alamat.append(teks)
            skor_alamat.append(skor)

        # nama bisa muncul setelah nomor kalau urutannya tidak biasa
        if not data["recipient_name"] and baris_alamat:
            data["recipient_name"] = baris_alamat.pop(0)
            yakin["recipient_name"] = skor_alamat.pop(0)

        if baris_alamat:
            data["full_address_raw"] = "\n".join(baris_alamat)
            yakin["full_address_raw"] = min(skor_alamat)

    # --- kreator afiliasi ---
    for b in blok:
        m = re.search(r"Penerima komisi\s*[:：]\s*(.+)", b.teks, re.I)
        if m:
            data["affiliate_creator"] = m.group(1).strip()
            yakin["affiliate_creator"] = b.skor
            break

    # --- ID pesanan & waktu (pasangan label–nilai) ---
    i = _cari(blok, r"ID\s*Pesanan")
    if i is not None:
        nilai = _nilai_sebaris(blok, i)
        sumber = nilai or blok[i]
        m = RE_ID_PESANAN.search(sumber.teks)
        if m:
            data["order_id"] = m.group(1)
            yakin["order_id"] = sumber.skor
    if not data["order_id"]:
        m = RE_ID_PESANAN.search(semua_teks)
        if m:
            data["order_id"] = m.group(1)
            yakin["order_id"] = 0.6

    i = _cari(blok, r"Waktu\s*Pembuatan")
    if i is not None:
        nilai = _nilai_sebaris(blok, i)
        sumber = nilai or blok[i]
        m = RE_WAKTU.search(sumber.teks)
        if m:
            data["created_at"] = m.group(1)
            yakin["created_at"] = sumber.skor
    if not data["created_at"]:
        m = RE_WAKTU.search(semua_teks)
        if m:
            data["created_at"] = m.group(1)
            yakin["created_at"] = 0.6

    # --- pengikut & suka (muncul di popup profil pembeli) ---
    for i, b in enumerate(blok):
        label = b.teks.lower()
        bidang = ("tiktok_followers" if re.search(r"pengikut|followers", label)
                  else "tiktok_likes" if re.search(r"\bsuka\b|likes", label) else None)
        if not bidang or data[bidang]:
            continue
        # angkanya bisa di blok yang sama, sebelum, atau sesudah label
        m = re.search(r"([\d.,]+\s*[KMBkmb]?)", b.teks.replace(label, " "))
        kandidat = m.group(1).strip() if m else None
        if not kandidat:
            for tetangga in (blok[i - 1] if i else None, blok[i + 1] if i + 1 < len(blok) else None):
                if tetangga and RE_ANGKA_SOSIAL.match(tetangga.teks.strip()):
                    kandidat = tetangga.teks.strip()
                    break
        if kandidat:
            data[bidang] = kandidat
            yakin[bidang] = b.skor

    # --- turunkan keyakinan kalau isinya tidak masuk akal ---
    if data["phone"]:
        digit = re.sub(r"\D", "", data["phone"])
        if not (10 <= len(digit) <= 15):
            yakin["phone"] *= 0.4
    if data["full_address_raw"]:
        if not re.search(r"indonesia\s*$", data["full_address_raw"], re.I):
            yakin["full_address_raw"] *= 0.6
    if data["recipient_name"] and len(data["recipient_name"]) < 2:
        yakin["recipient_name"] *= 0.3
    for k, v in data.items():
        if isinstance(v, str) and RE_SENSOR.search(v):
            yakin[k] = 0.0

    return {**data, "confidence": yakin, "_sumber": "lokal",
            "_tersensor": tersensor, "_halaman_pesanan": halaman_pesanan}


def perlu_naik_ke_ai(hasil: Dict[str, Any]) -> bool:
    """Putuskan apakah hasil lokal cukup baik, atau harus dibantu AI."""
    if hasil.get("_tersensor"):
        return False        # AI pun tidak bisa membaca data yang disensor
    if not hasil.get("_halaman_pesanan"):
        return False        # bukan halaman pesanan — jangan buang biaya
    yakin = hasil.get("confidence", {})
    for bidang in WAJIB:
        if not hasil.get(bidang):
            return True
        if yakin.get(bidang, 0) < AMBANG_NAIK:
            return True
    return False


# -------------------------------------------------------- ekstraksi tingkat 2
SYSTEM_PROMPT = """Anda adalah asisten OCR yang mengekstrak data pelanggan dari screenshot halaman detail pesanan TikTok Shop (Bahasa Indonesia).

Ekstrak HANYA yang benar-benar tercetak pada gambar. Jangan menebak. Jika sebuah field tidak terlihat, kembalikan null.

Kembalikan JSON valid dengan struktur:
{
  "order_id": string | null,
  "created_at": string | null,
  "tiktok_username": string | null,
  "tiktok_followers": string | null,
  "tiktok_likes": string | null,
  "recipient_name": string | null,
  "phone": string | null,
  "full_address_raw": string | null,
  "affiliate_creator": string | null,
  "confidence": {
    "order_id": number, "created_at": number, "tiktok_username": number,
    "tiktok_followers": number, "tiktok_likes": number, "recipient_name": number,
    "phone": number, "full_address_raw": number, "affiliate_creator": number
  }
}

Petunjuk field:
- order_id: angka panjang setelah "ID Pesanan"
- created_at: nilai setelah "Waktu Pembuatan", format DD/MM/YYYY HH:MM:SS
- tiktok_username: handle di bawah heading "Pembeli"
- tiktok_followers: jumlah pengikut pembeli (mis. "1.2K", "156"). Persis seperti tercetak, tanpa kata "Pengikut".
- tiktok_likes: jumlah suka profil pembeli. Jangan tertukar dengan pengikut.
- recipient_name: nama di bawah heading "Alamat pengiriman"
- phone: nomor telepon persis seperti tampak, termasuk (+62) jika ada
- full_address_raw: SELURUH teks alamat di bawah nama & telepon, termasuk baris terakhir "kelurahan,kecamatan,kota,provinsi,Indonesia". Pertahankan pergantian baris.
- affiliate_creator: handle setelah "Penerima komisi:". Kalau tidak terlihat, null.
- confidence: 0.0-1.0 seberapa yakin Anda pada tiap field.

Balas HANYA JSON, tanpa markdown, tanpa komentar."""


async def ekstrak_ai(image_base64: str) -> Dict[str, Any]:
    """Tingkat 2: panggil Gemini langsung memakai kunci milik sendiri."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY belum diisi")

    import httpx

    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{GEMINI_MODEL}:generateContent")
    muatan = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{
            "role": "user",
            "parts": [
                {"text": "Ekstrak data pesanan dari screenshot ini sebagai JSON."},
                {"inline_data": {"mime_type": "image/png", "data": image_base64}},
            ],
        }],
        "generationConfig": {"temperature": 0, "responseMimeType": "application/json"},
    }
    async with httpx.AsyncClient(timeout=90) as klien:
        r = await klien.post(url, json=muatan,
                             headers={"x-goog-api-key": GEMINI_API_KEY})
        r.raise_for_status()
        jawab = r.json()

    teks = jawab["candidates"][0]["content"]["parts"][0]["text"].strip()
    teks = re.sub(r"^```(?:json)?\s*", "", teks)
    teks = re.sub(r"\s*```$", "", teks)
    try:
        data = json.loads(teks)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", teks, re.DOTALL)
        if not m:
            raise ValueError(f"Model tidak mengembalikan JSON valid: {teks[:200]}")
        data = json.loads(m.group(0))
    data["_sumber"] = "ai"
    return data


# ----------------------------------------------------------------- gerbang
async def extract_from_image(image_base64: str) -> Dict[str, Any]:
    """Pintu masuk yang dipakai server.py. Bentuk keluarannya tidak berubah."""
    gambar = base64.b64decode(image_base64)

    try:
        hasil = ekstrak_lokal(gambar)
    except Exception as e:                       # OCR lokal gagal total
        hasil = {"confidence": {}, "_sumber": "lokal-gagal",
                 "_tersensor": False, "_halaman_pesanan": True,
                 "_galat_lokal": str(e)}

    if AI_DIIZINKAN and GEMINI_API_KEY and perlu_naik_ke_ai(hasil):
        try:
            hasil_ai = await ekstrak_ai(image_base64)
            # ambil nilai AI, tapi pertahankan yang lokal kalau AI mengosongkan
            gabung = dict(hasil)
            for k, v in hasil_ai.items():
                if k == "confidence":
                    continue
                if v not in (None, ""):
                    gabung[k] = v
            gabung["confidence"] = hasil_ai.get("confidence", hasil.get("confidence", {}))
            gabung["_sumber"] = "ai"
            hasil = gabung
        except Exception as e:
            hasil["_galat_ai"] = str(e)          # tetap kembalikan hasil lokal

    hasil["phone_normalized"] = normalize_phone(hasil.get("phone"))
    hasil.update(parse_address(hasil.get("full_address_raw")))
    hasil["tiktok_followers_num"] = parse_social_count(hasil.get("tiktok_followers"))
    hasil["tiktok_likes_num"] = parse_social_count(hasil.get("tiktok_likes"))
    return hasil
