"""
PelangganKu — peluncur aplikasi terinstal.

Menjalankan backend di dalam aplikasi itu sendiri, lalu membuka jendela
aplikasi. Tidak ada server luar, tidak ada peramban yang perlu dibuka,
tidak ada internet yang dibutuhkan.

Dijalankan lewat: PelangganKu.exe (hasil bungkusan) atau `python app_desktop.py`.
"""
from __future__ import annotations

import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

# --- siapkan jalur impor sebelum apa pun diimpor dari backend ---
DASAR = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)).resolve()
for tambahan in (DASAR, DASAR / "backend"):
    if str(tambahan) not in sys.path and tambahan.exists():
        sys.path.insert(0, str(tambahan))

from appdirs_local import folder_data, NAMA_APP   # noqa: E402

JUDUL = "PelangganKu"


def port_bebas() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def siapkan_lingkungan() -> None:
    """Baca pengaturan pengguna (mis. kunci Gemini) dari folder datanya."""
    berkas = folder_data() / "pengaturan.env"
    if berkas.exists():
        for baris in berkas.read_text(encoding="utf-8").splitlines():
            baris = baris.strip()
            if not baris or baris.startswith("#") or "=" not in baris:
                continue
            k, v = baris.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    else:
        berkas.write_text(
            "# Pengaturan PelangganKu\n"
            "#\n"
            "# OCR berjalan di komputer ini dan gratis. Baris di bawah hanya\n"
            "# diperlukan kalau Anda ingin bantuan AI untuk screenshot yang\n"
            "# sulit terbaca. Kosongkan saja kalau tidak perlu.\n"
            "# GEMINI_API_KEY=\n"
            "#\n"
            "# Ambang keyakinan sebelum dibantu AI (0.0 - 1.0)\n"
            "# OCR_AMBANG_NAIK=0.75\n",
            encoding="utf-8")
    # aplikasi terinstal tidak pernah memakai MongoDB
    os.environ.pop("MONGO_URL", None)
    os.environ.setdefault("DB_NAME", "pelangganku")


def jalankan_server(port: int) -> None:
    import uvicorn
    from server import app
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


def tunggu_siap(url: str, batas_detik: float = 60.0) -> bool:
    tenggat = time.time() + batas_detik
    while time.time() < tenggat:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status < 500:
                    return True
        except urllib.error.HTTPError:
            return True                      # server menjawab, itu cukup
        except Exception:
            time.sleep(0.25)
    return False


def buka_jendela(url: str) -> None:
    """Buka jendela aplikasi asli. Kalau tidak tersedia, pakai peramban."""
    try:
        import webview                       # pywebview
    except ImportError:
        import webbrowser
        print(f"Jendela aplikasi tidak tersedia, membuka di peramban: {url}")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(3600)
        except KeyboardInterrupt:
            pass
        return

    ikon = DASAR / "ikon.png"
    webview.create_window(
        JUDUL, url,
        width=1440, height=900, min_size=(1024, 700),
        confirm_close=False,
    )
    webview.start(icon=str(ikon) if ikon.exists() else None)


def main() -> None:
    siapkan_lingkungan()
    port = port_bebas()
    url = f"http://127.0.0.1:{port}"

    threading.Thread(target=jalankan_server, args=(port,), daemon=True).start()

    if not tunggu_siap(f"{url}/api/auth/me", 60):
        print("Gagal menjalankan aplikasi: server tidak merespons.")
        print(f"Data aplikasi ada di: {folder_data()}")
        input("Tekan Enter untuk menutup...")
        sys.exit(1)

    print(f"{NAMA_APP} berjalan di {url}")
    print(f"Data tersimpan di {folder_data()}")
    buka_jendela(url)


if __name__ == "__main__":
    main()
