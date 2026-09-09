"""Lightweight i18n for backend HTTPException messages.

Middleware in server.py picks up `Accept-Language` header and sets the
context var. Endpoints call ``T("key.name")`` when raising HTTPException.
"""
from contextvars import ContextVar
from typing import Any

_lang: ContextVar[str] = ContextVar("lang", default="id")


def set_lang(lang: str) -> None:
    _lang.set("en" if (lang or "").lower().startswith("en") else "id")


def get_lang() -> str:
    return _lang.get()


MESSAGES: dict[str, dict[str, str]] = {
    "auth.invalid_credentials": {
        "id": "Email atau password salah",
        "en": "Invalid email or password",
    },
    "auth.user_not_found": {
        "id": "User tidak ditemukan",
        "en": "User not found",
    },
    "auth.email_exists": {
        "id": "Email sudah terdaftar",
        "en": "Email already registered",
    },
    "vision.failed": {
        "id": "Ekstraksi gagal",
        "en": "Extraction failed",
    },
    "vision.failed_detail": {
        "id": "Ekstraksi gagal: {err}",
        "en": "Extraction failed: {err}",
    },
    "customer.not_found": {
        "id": "Pelanggan tidak ditemukan",
        "en": "Customer not found",
    },
    "customer.select_min": {
        "id": "Pilih minimal 1 pelanggan",
        "en": "Select at least 1 customer",
    },
    "zip.must_be_zip": {
        "id": "File harus berformat .zip",
        "en": "File must be .zip",
    },
    "zip.too_large": {
        "id": "Ukuran ZIP maksimal 200MB",
        "en": "ZIP file must be 200MB or less",
    },
    "job.not_found": {
        "id": "Job tidak ditemukan",
        "en": "Job not found",
    },
}


def T(key: str, **params: Any) -> str:
    lang = _lang.get()
    entry = MESSAGES.get(key, {})
    s = entry.get(lang) or entry.get("id") or key
    for k, v in params.items():
        s = s.replace("{" + k + "}", str(v))
    return s
