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
import traceback
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
BERKAS_LOG = folder_data() / "log.txt"


# ---------------------------------------------------------------- keluaran
def siapkan_keluaran() -> None:
    """Beri stdout & stderr tujuan yang nyata.

    Saat dibungkus sebagai aplikasi Windows tanpa jendela konsol,
    PyInstaller menyetel sys.stdout dan sys.stderr menjadi None. Banyak
    pustaka menganggap keduanya selalu ada — uvicorn misalnya memanggil
    sys.stdout.isatty() untuk memutuskan warna lognya, lalu gagal total.
    Mengarahkan keduanya ke berkas log memperbaiki itu sekaligus memberi
    kita catatan kalau ada yang bermasalah di komputer pengguna.
    """
    if sys.stdout is not None and sys.stderr is not None:
        return
    try:
        BERKAS_LOG.parent.mkdir(parents=True, exist_ok=True)
        # potong log kalau sudah membengkak
        if BERKAS_LOG.exists() and BERKAS_LOG.stat().st_size > 2_000_000:
            BERKAS_LOG.unlink()
        aliran = open(BERKAS_LOG, "a", encoding="utf-8", buffering=1)
    except Exception:
        import io
        aliran = io.StringIO()          # jangan sampai gagal cuma karena log
    if sys.stdout is None:
        sys.stdout = aliran
    if sys.stderr is None:
        sys.stderr = aliran


siapkan_keluaran()


def catat(pesan: str) -> None:
    waktu = time.strftime("%Y-%m-%d %H:%M:%S")
    try:
        print(f"[{waktu}] {pesan}", flush=True)
    except Exception:
        pass


def beri_tahu(judul: str, pesan: str) -> None:
    """Tampilkan pesan ke pengguna.

    Aplikasi ini tidak punya konsol, jadi input() maupun print() tidak
    akan terlihat siapa pun. Di Windows dipakai kotak pesan bawaan sistem
    lewat ctypes — tanpa pustaka tambahan.
    """
    catat(f"{judul}: {pesan}")
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(
                None, str(pesan), str(judul), 0x00000010)  # MB_ICONERROR
            return
        except Exception:
            pass
    try:
        print(f"\n{judul}\n{pesan}\n", flush=True)
    except Exception:
        pass


# ------------------------------------------------------------------ server
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
    os.environ.pop("MONGO_URL", None)      # aplikasi terinstal tidak pakai MongoDB
    os.environ.setdefault("DB_NAME", "pelangganku")


galat_server: list[str] = []


def jalankan_server(port: int) -> None:
    """Jalankan backend. Kalau gagal, simpan jejaknya supaya bisa ditampilkan
    — tanpa ini, thread mati diam-diam dan penyebabnya tidak pernah terlihat."""
    try:
        import uvicorn
        from server import app
        catat(f"Menjalankan server di port {port}")
        uvicorn.run(
            app, host="127.0.0.1", port=port,
            log_config=None,     # jangan biarkan uvicorn mengutak-atik logging
            log_level="warning",
            access_log=False,
        )
    except BaseException:
        jejak = traceback.format_exc()
        galat_server.append(jejak)
        catat("SERVER GAGAL:\n" + jejak)


def tunggu_siap(url: str, batas_detik: float = 120.0) -> bool:
    tenggat = time.time() + batas_detik
    while time.time() < tenggat:
        if galat_server:                  # gagal duluan, tidak perlu menunggu
            return False
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                if r.status < 500:
                    return True
        except urllib.error.HTTPError:
            return True                   # server menjawab, itu sudah cukup
        except Exception:
            time.sleep(0.3)
    return False


# ----------------------------------------------------------------- jendela
def buka_jendela(url: str) -> None:
    """Buka jendela aplikasi asli. Kalau tidak tersedia, pakai peramban."""
    try:
        import webview                    # pywebview
    except ImportError:
        import webbrowser
        catat(f"pywebview tidak ada, membuka peramban: {url}")
        beri_tahu(JUDUL,
                  "Jendela aplikasi tidak tersedia, jadi PelangganKu dibuka "
                  f"di peramban:\n\n{url}\n\nJangan tutup jendela ini selama "
                  "Anda memakai aplikasi.")
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


# -------------------------------------------------------------------- main
def main() -> None:
    catat(f"=== {NAMA_APP} mulai ===")
    catat(f"Python {sys.version.split()[0]} | dibungkus={getattr(sys,'frozen',False)}")
    siapkan_lingkungan()

    port = port_bebas()
    url = f"http://127.0.0.1:{port}"
    threading.Thread(target=jalankan_server, args=(port,), daemon=True).start()

    if not tunggu_siap(f"{url}/api/auth/me", 120):
        rincian = galat_server[0].strip().splitlines()[-1] if galat_server \
            else "Server tidak merespons dalam 2 menit."
        beri_tahu(
            f"{JUDUL} gagal dijalankan",
            f"{rincian}\n\n"
            f"Catatan lengkapnya ada di:\n{BERKAS_LOG}\n\n"
            "Kirimkan berkas itu untuk diperiksa.")
        sys.exit(1)

    catat(f"Server siap di {url}")
    buka_jendela(url)
    catat("Jendela ditutup, aplikasi selesai")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except BaseException:
        jejak = traceback.format_exc()
        catat("GALAT TAK TERTANGANI:\n" + jejak)
        beri_tahu(
            f"{JUDUL} berhenti tak terduga",
            f"{jejak.strip().splitlines()[-1]}\n\n"
            f"Catatan lengkapnya ada di:\n{BERKAS_LOG}")
        sys.exit(1)
