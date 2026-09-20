"""JWT auth utilities for PelangganKu."""
import os
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

def _rahasia_jwt() -> str:
    """Kunci penanda tangan sesi.

    Nilai bawaan "dev-secret" tidak aman untuk produk yang dibagikan: siapa
    pun yang tahu nilainya bisa membuat token palsu. Jadi kalau JWT_SECRET
    tidak diisi, aplikasi membuat kunci acak 64 karakter sekali saat pertama
    dijalankan, lalu menyimpannya di folder data pengguna. Setiap pemasangan
    punya kunci sendiri, dan kunci itu tidak pernah ikut terbawa di kode.
    """
    dari_env = os.environ.get("JWT_SECRET", "").strip()
    if dari_env and dari_env != "dev-secret":
        return dari_env
    try:
        from appdirs_local import folder_data
        berkas = folder_data() / "kunci_sesi.txt"
        if berkas.exists():
            nilai = berkas.read_text(encoding="utf-8").strip()
            if len(nilai) >= 32:
                return nilai
        nilai = secrets.token_urlsafe(48)
        berkas.write_text(nilai, encoding="utf-8")
        try:
            os.chmod(berkas, 0o600)
        except OSError:
            pass
        return nilai
    except Exception:
        # jangan sampai aplikasi gagal jalan hanya karena berkas tak bisa ditulis
        return secrets.token_urlsafe(48)


JWT_SECRET = _rahasia_jwt()
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token kadaluarsa")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Belum masuk")
    return decode_token(creds.credentials)


async def require_owner(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Hanya owner")
    return user
