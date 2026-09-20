"""
Lokasi berkas milik aplikasi di komputer pengguna.

Semua data pelanggan (basis data, hasil ekspor, log) disimpan di folder
milik pengguna sendiri — tidak pernah dikirim ke mana pun.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

NAMA_APP = "PelangganKu"


def folder_data() -> Path:
    """Folder tempat basis data dan pengaturan disimpan."""
    if os.environ.get("PELANGGANKU_DATA"):
        p = Path(os.environ["PELANGGANKU_DATA"])
    elif sys.platform == "win32":
        dasar = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        p = Path(dasar) / NAMA_APP
    elif sys.platform == "darwin":
        p = Path.home() / "Library" / "Application Support" / NAMA_APP
    else:
        dasar = os.environ.get("XDG_DATA_HOME") or (Path.home() / ".local" / "share")
        p = Path(dasar) / NAMA_APP
    p.mkdir(parents=True, exist_ok=True)
    return p


def folder_dokumen() -> Path:
    """Folder tempat hasil ekspor Excel/CSV diletakkan supaya mudah dicari."""
    kandidat = Path.home() / "Documents" / NAMA_APP
    try:
        kandidat.mkdir(parents=True, exist_ok=True)
        return kandidat
    except OSError:
        return folder_data() / "ekspor"


def folder_aplikasi() -> Path:
    """Folder tempat berkas program berada (berbeda saat dibungkus PyInstaller)."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)          # type: ignore[attr-defined]
    return Path(__file__).parent
