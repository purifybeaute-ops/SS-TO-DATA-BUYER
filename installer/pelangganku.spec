# -*- mode: python ; coding: utf-8 -*-
"""
Resep pembungkusan PelangganKu jadi satu aplikasi Windows.

Hasilnya folder dist/PelangganKu/ berisi PelangganKu.exe beserta seluruh
kebutuhannya — pengguna tidak perlu memasang Python, Tesseract, atau
apa pun. Folder itu lalu dibungkus jadi installer oleh Inno Setup.
"""
from pathlib import Path
from PyInstaller.utils.hooks import collect_all, collect_submodules

AKAR = Path(SPECPATH).parent          # noqa: F821  (disediakan PyInstaller)

berkas_data = [
    (str(AKAR / "frontend" / "build"), "frontend_build"),
]
ikon_png = AKAR / "installer" / "ikon.png"
if ikon_png.exists():
    berkas_data.append((str(ikon_png), "."))

tersembunyi = [
    "uvicorn.logging", "uvicorn.loops", "uvicorn.loops.auto",
    "uvicorn.protocols", "uvicorn.protocols.http", "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets", "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan", "uvicorn.lifespan.on",
    "email_validator", "passlib.handlers.bcrypt", "bcrypt",
    "openpyxl", "pandas",
]
tersembunyi += collect_submodules("webview")

biner = []
# RapidOCR membawa berkas model ONNX yang harus ikut dibungkus
for paket in ("rapidocr_onnxruntime", "onnxruntime"):
    d, b, h = collect_all(paket)
    berkas_data += d
    biner += b
    tersembunyi += h

a = Analysis(                                  # noqa: F821
    [str(AKAR / "app_desktop.py")],
    pathex=[str(AKAR), str(AKAR / "backend")],
    binaries=biner,
    datas=berkas_data,
    hiddenimports=tersembunyi,
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        "motor", "pymongo",          # aplikasi terinstal tidak memakai MongoDB
        "matplotlib", "tkinter", "PyQt5", "PySide6",
        "pytest", "black", "mypy", "flake8", "isort",
        "torch", "torchvision", "scipy",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)                              # noqa: F821

exe = EXE(                                     # noqa: F821
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="PelangganKu",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,                             # tanpa jendela hitam
    disable_windowed_traceback=False,
    icon=str(AKAR / "installer" / "ikon.ico")
    if (AKAR / "installer" / "ikon.ico").exists() else None,
)

coll = COLLECT(                                # noqa: F821
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="PelangganKu",
)
