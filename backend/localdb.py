"""
localdb — basis data dokumen tertanam, meniru sebagian API Motor/MongoDB.

Dipakai supaya PelangganKu bisa jalan sebagai aplikasi terinstal tanpa
server MongoDB: seluruh data tersimpan dalam satu berkas SQLite di komputer
pengguna. API-nya sengaja dibuat sama persis dengan Motor sehingga
server.py hampir tidak perlu diubah.

Yang didukung:
  find / find_one / insert_one / insert_many / update_one / update_many /
  delete_one / delete_many / count_documents / distinct / aggregate
  Operator kueri : $regex $options $gte $gt $lte $lt $ne $in $nin $or $and
                   $exists $not $all $elemMatch
  Operator ubah  : $set $unset $inc $push (+$each) $addToSet (+$each) $pull
  Agregasi       : $match $group (+$sum) $sort $limit
  Kursor         : sort / skip / limit / to_list / async for

Catatan skala: dokumen difilter di memori. Untuk puluhan ribu baris per
koleksi — ukuran wajar satu penjual — ini lebih dari cukup dan jauh lebih
sederhana daripada menerjemahkan kueri ke SQL.
"""
from __future__ import annotations

import json
import re
import sqlite3
import threading
import uuid
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

__all__ = ["LocalClient"]

_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


# ---------------------------------------------------------------- pencocokan
def _ambil(doc: Any, jalur: str) -> Any:
    """Ambil nilai lewat jalur bertitik, mis. 'alamat.kota'."""
    cur = doc
    for bagian in jalur.split("."):
        if isinstance(cur, dict) and bagian in cur:
            cur = cur[bagian]
        else:
            return None
    return cur


def _bandingkan(a: Any, b: Any) -> Optional[int]:
    """-1/0/1, atau None kalau memang tidak bisa dibandingkan."""
    if a is None or b is None:
        return None
    if isinstance(a, bool) != isinstance(b, bool):
        return None
    try:
        if a < b:
            return -1
        if a > b:
            return 1
        return 0
    except TypeError:
        try:
            sa, sb = str(a), str(b)
            return -1 if sa < sb else (1 if sa > sb else 0)
        except Exception:
            return None


def _cocok_operator(nilai: Any, op: str, arg: Any, syarat: Dict[str, Any]) -> bool:
    if op == "$eq":
        return _cocok_nilai(nilai, arg)
    if op == "$ne":
        return not _cocok_nilai(nilai, arg)
    if op in ("$gt", "$gte", "$lt", "$lte"):
        c = _bandingkan(nilai, arg)
        if c is None:
            return False
        return {"$gt": c > 0, "$gte": c >= 0,
                "$lt": c < 0, "$lte": c <= 0}[op]
    if op == "$in":
        daftar = arg if isinstance(arg, (list, tuple)) else [arg]
        if isinstance(nilai, list):
            return any(_cocok_nilai(v, x) for v in nilai for x in daftar)
        return any(_cocok_nilai(nilai, x) for x in daftar)
    if op == "$nin":
        return not _cocok_operator(nilai, "$in", arg, syarat)
    if op == "$exists":
        return (nilai is not None) == bool(arg)
    if op == "$regex":
        bendera = 0
        opsi = syarat.get("$options", "")
        if "i" in opsi:
            bendera |= re.IGNORECASE
        if "s" in opsi:
            bendera |= re.DOTALL
        if "m" in opsi:
            bendera |= re.MULTILINE
        pola = arg.pattern if isinstance(arg, re.Pattern) else str(arg)
        if nilai is None:
            return False
        if isinstance(nilai, list):
            return any(re.search(pola, str(v), bendera) for v in nilai)
        return re.search(pola, str(nilai), bendera) is not None
    if op == "$options":
        return True                      # ditangani bersama $regex
    if op == "$all":
        punya = nilai if isinstance(nilai, list) else [nilai]
        return all(any(_cocok_nilai(v, x) for v in punya) for x in arg)
    if op == "$size":
        return isinstance(nilai, list) and len(nilai) == arg
    if op == "$elemMatch":
        if not isinstance(nilai, list):
            return False
        return any(_cocok_syarat(v, arg) if isinstance(v, dict)
                   else _cocok_nilai(v, arg) for v in nilai)
    if op == "$not":
        if isinstance(arg, dict):
            return not all(_cocok_operator(nilai, o, a, arg) for o, a in arg.items())
        return not _cocok_nilai(nilai, arg)
    # operator tak dikenal: jangan diam-diam meloloskan data
    raise ValueError(f"operator kueri belum didukung: {op}")


def _cocok_nilai(nilai: Any, harapan: Any) -> bool:
    if isinstance(nilai, list) and not isinstance(harapan, list):
        return harapan in nilai or nilai == harapan
    return nilai == harapan


def _cocok_syarat(doc: Any, syarat: Dict[str, Any]) -> bool:
    """Cocokkan satu dokumen terhadap syarat kueri."""
    for kunci, harapan in syarat.items():
        if kunci == "$or":
            if not any(_cocok_syarat(doc, s) for s in harapan):
                return False
        elif kunci == "$and":
            if not all(_cocok_syarat(doc, s) for s in harapan):
                return False
        elif kunci == "$nor":
            if any(_cocok_syarat(doc, s) for s in harapan):
                return False
        elif kunci.startswith("$"):
            raise ValueError(f"operator tingkat atas belum didukung: {kunci}")
        else:
            nilai = _ambil(doc, kunci)
            if isinstance(harapan, dict) and any(k.startswith("$") for k in harapan):
                for op, arg in harapan.items():
                    if not _cocok_operator(nilai, op, arg, harapan):
                        return False
            elif not _cocok_nilai(nilai, harapan):
                return False
    return True


# ------------------------------------------------------------------ proyeksi
def _proyeksikan(doc: Dict[str, Any], proyeksi: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not proyeksi:
        return dict(doc)
    sertakan = {k: v for k, v in proyeksi.items() if k != "_id" and v}
    if sertakan:
        hasil = {k: _ambil(doc, k) for k in sertakan if _ambil(doc, k) is not None}
    else:
        buang = {k for k, v in proyeksi.items() if not v}
        hasil = {k: v for k, v in doc.items() if k not in buang}
    if proyeksi.get("_id", 1):
        if "_id" in doc:
            hasil["_id"] = doc["_id"]
    else:
        hasil.pop("_id", None)
    return hasil


# ------------------------------------------------------------------ perubahan
def _terapkan_perubahan(doc: Dict[str, Any], ubah: Dict[str, Any]) -> Dict[str, Any]:
    baru = json.loads(json.dumps(doc))
    ada_operator = any(k.startswith("$") for k in ubah)
    if not ada_operator:
        hasil = json.loads(json.dumps(ubah))
        for kunci in ("_id", "id"):
            if kunci in doc:
                hasil.setdefault(kunci, doc[kunci])
        return hasil

    for op, bidang in ubah.items():
        if op == "$set":
            for k, v in bidang.items():
                _tanam(baru, k, v)
        elif op == "$unset":
            for k in bidang:
                _cabut(baru, k)
        elif op == "$inc":
            for k, v in bidang.items():
                _tanam(baru, k, (_ambil(baru, k) or 0) + v)
        elif op == "$push":
            for k, v in bidang.items():
                arr = list(_ambil(baru, k) or [])
                arr.extend(v["$each"] if isinstance(v, dict) and "$each" in v else [v])
                _tanam(baru, k, arr)
        elif op == "$addToSet":
            for k, v in bidang.items():
                arr = list(_ambil(baru, k) or [])
                tambah = v["$each"] if isinstance(v, dict) and "$each" in v else [v]
                for x in tambah:
                    if x not in arr:
                        arr.append(x)
                _tanam(baru, k, arr)
        elif op == "$pull":
            for k, v in bidang.items():
                arr = list(_ambil(baru, k) or [])
                if isinstance(v, dict) and any(s.startswith("$") for s in v):
                    arr = [x for x in arr if not _cocok_operator(
                        x, *next(iter(v.items())), v)]
                else:
                    arr = [x for x in arr if x != v]
                _tanam(baru, k, arr)
        elif op == "$setOnInsert":
            continue                      # ditangani di update_one(upsert)
        else:
            raise ValueError(f"operator perubahan belum didukung: {op}")
    return baru


def _tanam(doc: Dict[str, Any], jalur: str, nilai: Any) -> None:
    bagian = jalur.split(".")
    cur = doc
    for b in bagian[:-1]:
        if not isinstance(cur.get(b), dict):
            cur[b] = {}
        cur = cur[b]
    cur[bagian[-1]] = nilai


def _cabut(doc: Dict[str, Any], jalur: str) -> None:
    bagian = jalur.split(".")
    cur = doc
    for b in bagian[:-1]:
        if not isinstance(cur.get(b), dict):
            return
        cur = cur[b]
    cur.pop(bagian[-1], None)


# -------------------------------------------------------------------- kursor
class Cursor:
    def __init__(self, dokumen: List[Dict[str, Any]], proyeksi=None):
        self._dokumen = dokumen
        self._proyeksi = proyeksi
        self._urut: List[tuple] = []
        self._lewati = 0
        self._batas: Optional[int] = None

    def sort(self, kunci, arah: int = 1):
        if isinstance(kunci, str):
            self._urut.append((kunci, arah))
        elif isinstance(kunci, dict):
            self._urut.extend(kunci.items())
        else:
            self._urut.extend(kunci)
        return self

    def skip(self, n: int):
        self._lewati = n
        return self

    def limit(self, n: int):
        self._batas = n if n and n > 0 else None
        return self

    def _susun(self) -> List[Dict[str, Any]]:
        baris = list(self._dokumen)
        for kunci, arah in reversed(self._urut):
            baris.sort(
                key=lambda d: _kunci_urut(_ambil(d, kunci)),
                reverse=(arah < 0),
            )
        baris = baris[self._lewati:]
        if self._batas is not None:
            baris = baris[: self._batas]
        return [_proyeksikan(d, self._proyeksi) for d in baris]

    async def to_list(self, panjang: Optional[int] = None):
        baris = self._susun()
        return baris[:panjang] if panjang else baris

    def __aiter__(self):
        self._iter = iter(self._susun())
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


def _kunci_urut(v: Any):
    """Urutkan campuran tipe tanpa meledak: None paling akhir."""
    if v is None:
        return (3, 0)
    if isinstance(v, bool):
        return (1, int(v))
    if isinstance(v, (int, float)):
        return (1, v)
    return (2, str(v))


# ------------------------------------------------------------------- hasil
class HasilUbah:
    def __init__(self, cocok: int, diubah: int, id_baru=None):
        self.matched_count = cocok
        self.modified_count = diubah
        self.upserted_id = id_baru


class HasilHapus:
    def __init__(self, jumlah: int):
        self.deleted_count = jumlah


class HasilSisip:
    def __init__(self, id_: Any):
        self.inserted_id = id_


# ----------------------------------------------------------------- koleksi
class Collection:
    def __init__(self, db: "Database", nama: str):
        self._db = db
        self._nama = nama
        db._pastikan_tabel(nama)

    # ---- baca
    def _semua(self) -> List[Dict[str, Any]]:
        return self._db._muat(self._nama)

    def _tersaring(self, syarat) -> List[Dict[str, Any]]:
        syarat = syarat or {}
        if not syarat:
            return self._semua()
        return [d for d in self._semua() if _cocok_syarat(d, syarat)]

    def find(self, syarat=None, proyeksi=None) -> Cursor:
        return Cursor(self._tersaring(syarat), proyeksi)

    async def find_one(self, syarat=None, proyeksi=None):
        for d in self._tersaring(syarat):
            return _proyeksikan(d, proyeksi)
        return None

    async def count_documents(self, syarat=None) -> int:
        return len(self._tersaring(syarat))

    async def distinct(self, bidang: str, syarat=None) -> List[Any]:
        keluar: List[Any] = []
        for d in self._tersaring(syarat):
            v = _ambil(d, bidang)
            for x in (v if isinstance(v, list) else [v]):
                if x is not None and x not in keluar:
                    keluar.append(x)
        return keluar

    # ---- tulis
    async def insert_one(self, doc: Dict[str, Any]) -> HasilSisip:
        doc = json.loads(json.dumps(doc))
        kunci = doc.get("_id") or doc.get("id") or str(uuid.uuid4())
        doc.setdefault("_id", kunci)
        self._db._simpan(self._nama, str(kunci), doc)
        return HasilSisip(kunci)

    async def insert_many(self, dokumen: Iterable[Dict[str, Any]]):
        id_ = [(await self.insert_one(d)).inserted_id for d in dokumen]
        return HasilSisip(id_)

    async def update_one(self, syarat, ubah, upsert: bool = False) -> HasilUbah:
        for d in self._tersaring(syarat):
            baru = _terapkan_perubahan(d, ubah)
            self._db._simpan(self._nama, str(d["_id"]), baru)
            return HasilUbah(1, 1)
        if upsert:
            dasar = {k: v for k, v in (syarat or {}).items()
                     if not k.startswith("$") and not isinstance(v, dict)}
            dasar.update(ubah.get("$setOnInsert", {}))
            baru = _terapkan_perubahan(dasar, ubah)
            hasil = await self.insert_one(baru)
            return HasilUbah(0, 0, hasil.inserted_id)
        return HasilUbah(0, 0)

    async def update_many(self, syarat, ubah) -> HasilUbah:
        n = 0
        for d in self._tersaring(syarat):
            baru = _terapkan_perubahan(d, ubah)
            self._db._simpan(self._nama, str(d["_id"]), baru)
            n += 1
        return HasilUbah(n, n)

    async def delete_one(self, syarat) -> HasilHapus:
        for d in self._tersaring(syarat):
            self._db._hapus(self._nama, str(d["_id"]))
            return HasilHapus(1)
        return HasilHapus(0)

    async def delete_many(self, syarat) -> HasilHapus:
        n = 0
        for d in self._tersaring(syarat):
            self._db._hapus(self._nama, str(d["_id"]))
            n += 1
        return HasilHapus(n)

    async def replace_one(self, syarat, doc, upsert: bool = False):
        return await self.update_one(syarat, doc, upsert=upsert)

    # ---- lain-lain
    async def create_index(self, *a, **k):
        return None                        # indeks tidak diperlukan di skala ini

    def aggregate(self, pipeline: List[Dict[str, Any]]) -> Cursor:
        baris = self._semua()
        for tahap in pipeline:
            (op, arg), = tahap.items()
            if op == "$match":
                baris = [d for d in baris if _cocok_syarat(d, arg)]
            elif op == "$group":
                baris = _kelompokkan(baris, arg)
            elif op == "$sort":
                for kunci, arah in reversed(list(arg.items())):
                    baris.sort(key=lambda d: _kunci_urut(_ambil(d, kunci)),
                               reverse=(arah < 0))
            elif op == "$limit":
                baris = baris[:arg]
            elif op == "$skip":
                baris = baris[arg:]
            elif op == "$project":
                baris = [_proyeksikan(d, arg) for d in baris]
            elif op == "$count":
                baris = [{arg: len(baris)}]
            else:
                raise ValueError(f"tahap agregasi belum didukung: {op}")
        return Cursor(baris)


def _kelompokkan(baris, spec):
    ekspresi_id = spec.get("_id")

    def kunci_dari(d):
        if isinstance(ekspresi_id, str) and ekspresi_id.startswith("$"):
            return _ambil(d, ekspresi_id[1:])
        if isinstance(ekspresi_id, dict):
            return tuple(sorted(
                (k, _ambil(d, v[1:]) if isinstance(v, str) and v.startswith("$") else v)
                for k, v in ekspresi_id.items()))
        return ekspresi_id

    ember: Dict[Any, List[Dict[str, Any]]] = {}
    for d in baris:
        ember.setdefault(kunci_dari(d), []).append(d)

    keluar = []
    for kunci, anggota in ember.items():
        item: Dict[str, Any] = {"_id": dict(kunci) if isinstance(kunci, tuple) else kunci}
        for bidang, ekspresi in spec.items():
            if bidang == "_id":
                continue
            (akum, nilai), = ekspresi.items()
            if akum == "$sum":
                if isinstance(nilai, str) and nilai.startswith("$"):
                    item[bidang] = sum(_ambil(a, nilai[1:]) or 0 for a in anggota)
                else:
                    item[bidang] = nilai * len(anggota)
            elif akum == "$count":
                item[bidang] = len(anggota)
            elif akum in ("$max", "$min", "$first", "$last", "$avg"):
                vals = [_ambil(a, nilai[1:]) for a in anggota
                        if isinstance(nilai, str) and nilai.startswith("$")]
                vals = [v for v in vals if v is not None]
                if not vals:
                    item[bidang] = None
                elif akum == "$max":
                    item[bidang] = max(vals)
                elif akum == "$min":
                    item[bidang] = min(vals)
                elif akum == "$first":
                    item[bidang] = vals[0]
                elif akum == "$last":
                    item[bidang] = vals[-1]
                else:
                    item[bidang] = sum(vals) / len(vals)
            elif akum == "$addToSet":
                unik = []
                for a in anggota:
                    v = _ambil(a, nilai[1:]) if isinstance(nilai, str) and nilai.startswith("$") else nilai
                    if v is not None and v not in unik:
                        unik.append(v)
                item[bidang] = unik
            elif akum == "$push":
                item[bidang] = [
                    _ambil(a, nilai[1:]) if isinstance(nilai, str) and nilai.startswith("$") else nilai
                    for a in anggota]
            else:
                raise ValueError(f"akumulator belum didukung: {akum}")
        keluar.append(item)
    return keluar


# ----------------------------------------------------------------- database
class Database:
    def __init__(self, berkas: str | Path):
        self.path = Path(berkas)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._kunci = threading.RLock()
        self._sambung = sqlite3.connect(str(self.path), check_same_thread=False)
        self._sambung.execute("PRAGMA journal_mode=WAL")
        self._tabel: set[str] = set()
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    # ---- lapisan penyimpanan
    def _pastikan_tabel(self, nama: str) -> None:
        if nama in self._tabel:
            return
        if not _IDENT.match(nama):
            raise ValueError(f"nama koleksi tidak sah: {nama}")
        with self._kunci:
            self._sambung.execute(
                f'CREATE TABLE IF NOT EXISTS "{nama}" '
                "(id TEXT PRIMARY KEY, doc TEXT NOT NULL)")
            self._sambung.commit()
        self._tabel.add(nama)

    def _muat(self, nama: str) -> List[Dict[str, Any]]:
        with self._kunci:
            if nama not in self._cache:
                baris = self._sambung.execute(f'SELECT doc FROM "{nama}"').fetchall()
                self._cache[nama] = [json.loads(b[0]) for b in baris]
            return list(self._cache[nama])

    def _simpan(self, nama: str, kunci: str, doc: Dict[str, Any]) -> None:
        with self._kunci:
            self._sambung.execute(
                f'INSERT INTO "{nama}" (id, doc) VALUES (?, ?) '
                "ON CONFLICT(id) DO UPDATE SET doc=excluded.doc",
                (kunci, json.dumps(doc, default=str)))
            self._sambung.commit()
            self._cache.pop(nama, None)

    def _hapus(self, nama: str, kunci: str) -> None:
        with self._kunci:
            self._sambung.execute(f'DELETE FROM "{nama}" WHERE id=?', (kunci,))
            self._sambung.commit()
            self._cache.pop(nama, None)

    # ---- akses koleksi, meniru gaya Motor
    def __getattr__(self, nama: str) -> Collection:
        if nama.startswith("_"):
            raise AttributeError(nama)
        return Collection(self, nama)

    def __getitem__(self, nama: str) -> Collection:
        return Collection(self, nama)

    async def list_collection_names(self) -> List[str]:
        with self._kunci:
            baris = self._sambung.execute(
                "SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        return [b[0] for b in baris]


class LocalClient:
    """Pengganti AsyncIOMotorClient. Satu berkas SQLite per basis data."""

    def __init__(self, folder: str | Path):
        self.folder = Path(folder)
        self.folder.mkdir(parents=True, exist_ok=True)
        self._db: Dict[str, Database] = {}

    def __getitem__(self, nama: str) -> Database:
        if nama not in self._db:
            self._db[nama] = Database(self.folder / f"{nama}.db")
        return self._db[nama]

    def get_database(self, nama: str) -> Database:
        return self[nama]

    def close(self) -> None:
        for db in self._db.values():
            db._sambung.close()
