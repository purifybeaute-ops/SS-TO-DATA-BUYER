"""Gemini 3 Flash vision extraction for TikTok Shop order screenshots."""
import os
import re
import json
import base64
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

SYSTEM_PROMPT = """Anda adalah asisten OCR yang mengekstrak data pelanggan dari screenshot halaman detail pesanan TikTok Shop (Bahasa Indonesia).

Ekstrak HANYA yang benar-benar tercetak pada gambar. Jangan menebak. Jika sebuah field tidak terlihat, kembalikan null.

Kembalikan JSON valid dengan struktur:
{
  "order_id": string | null,
  "created_at": string | null,
  "tiktok_username": string | null,
  "recipient_name": string | null,
  "phone": string | null,
  "full_address_raw": string | null,
  "affiliate_creator": string | null,
  "confidence": {
    "order_id": number,
    "created_at": number,
    "tiktok_username": number,
    "recipient_name": number,
    "phone": number,
    "full_address_raw": number,
    "affiliate_creator": number
  }
}

Petunjuk field:
- order_id: angka panjang setelah "ID Pesanan"
- created_at: nilai setelah "Waktu Pembuatan", format DD/MM/YYYY HH:MM:SS
- tiktok_username: handle di bawah heading "Pembeli"
- recipient_name: nama di bawah heading "Alamat pengiriman"
- phone: nomor telepon persis seperti tampak, termasuk (+62) jika ada
- full_address_raw: SELURUH teks alamat pengiriman di bawah nama & telepon (termasuk baris terakhir "kelurahan, kecamatan, kota, provinsi, Indonesia"). Gabungkan menjadi satu string dengan koma/newline sesuai aslinya.
- affiliate_creator: handle setelah "Penerima komisi:" pada blok "Kreator afiliasi". Jika tidak terlihat, null.
- confidence: nilai 0.0-1.0 seberapa yakin Anda pada tiap field.

Balas HANYA JSON, tanpa markdown, tanpa komentar."""


async def extract_from_image(image_base64: str) -> dict:
    """Send image to Gemini and return structured extraction."""
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY tidak dikonfigurasi")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vision-{os.urandom(4).hex()}",
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    image = ImageContent(image_base64=image_base64)
    msg = UserMessage(
        text="Ekstrak data pesanan dari screenshot ini sebagai JSON.",
        file_contents=[image],
    )

    resp = await chat.send_message(msg)
    text = str(resp).strip()

    # Strip ```json fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON block
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            raise ValueError(f"Model tidak mengembalikan JSON valid: {text[:200]}")
        data = json.loads(m.group(0))

    # Post-process
    data["phone_normalized"] = normalize_phone(data.get("phone"))
    parsed = parse_address(data.get("full_address_raw"))
    data.update(parsed)
    return data


def normalize_phone(raw: Optional[str]) -> Optional[str]:
    """Normalize Indonesian phone to +62XXXXXXXX format."""
    if not raw:
        return None
    # Keep only digits
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if digits.startswith("62"):
        return "+" + digits
    if digits.startswith("0"):
        return "+62" + digits[1:]
    if digits.startswith("8"):
        return "+62" + digits
    return "+" + digits


def parse_address(raw: Optional[str]) -> dict:
    """Split full_address_raw into detail + kelurahan/kecamatan/kota/provinsi/negara.

    Last comma-separated line always: kelurahan, kecamatan, kota, provinsi, negara.
    Everything above = address_detail.
    """
    out = {
        "address_detail": None,
        "kelurahan": None,
        "kecamatan": None,
        "kota": None,
        "provinsi": None,
        "negara": None,
    }
    if not raw:
        return out
    text = raw.strip()
    # Split into logical lines by newline first
    lines = [l.strip() for l in re.split(r"[\n\r]+", text) if l.strip()]
    if not lines:
        return out

    # The last "line" (or comma cluster) with 4-5 commas is the taxonomy row
    tail = lines[-1]
    parts = [p.strip() for p in tail.split(",") if p.strip()]

    if len(parts) >= 4:
        # Take last 5 parts as kelurahan..negara (if 4 parts, negara may be missing)
        tail_parts = parts[-5:] if len(parts) >= 5 else parts[-4:]
        if len(tail_parts) == 5:
            out["kelurahan"], out["kecamatan"], out["kota"], out["provinsi"], out["negara"] = tail_parts
        elif len(tail_parts) == 4:
            out["kelurahan"], out["kecamatan"], out["kota"], out["provinsi"] = tail_parts
            out["negara"] = "Indonesia"
        # Address detail = everything BEFORE these tail_parts within `raw`
        # Simpler approach: address_detail = all lines except last, joined
        if len(lines) > 1:
            out["address_detail"] = " ".join(lines[:-1]).strip()
        else:
            # tail_parts came from same line; strip them off
            head = tail
            for p in tail_parts:
                head = head.replace(p, "", 1)
            out["address_detail"] = head.strip(" ,")
    else:
        # Not enough parts, treat entire raw as detail
        out["address_detail"] = raw.strip()

    return out
