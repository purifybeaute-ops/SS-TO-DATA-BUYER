"""PetaPembeli backend end-to-end API tests."""
import os
import io
import base64
import uuid
import time

import pytest
import requests

BACKEND = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND:
    # Fallback: read from frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BACKEND = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE_URL = (BACKEND or "").rstrip("/")

OWNER_EMAIL = "owner@petapembeli.id"
OWNER_PASSWORD = "owner123"
OPERATOR_EMAIL = "operator@petapembeli.id"
OPERATOR_PASSWORD = "operator123"

SAMPLE_IMAGE_URL = "https://customer-assets-39nsmqrw.emergentagent.net/job_petapembeli-demo/artifacts/q0wpd1qd_Screenshot_20260723-080720.webp"
SAMPLE_CSV_URL = "https://customer-assets-39nsmqrw.emergentagent.net/job_petapembeli-demo/artifacts/cy9quo52_Data%20Pembeli.csv"


# --------------------------------------------------------------------------- Fixtures
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="session")
def owner_token():
    r = _login(OWNER_EMAIL, OWNER_PASSWORD)
    assert r.status_code == 200, f"Owner login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def operator_token():
    r = _login(OPERATOR_EMAIL, OPERATOR_PASSWORD)
    assert r.status_code == 200, f"Operator login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _owner_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# --------------------------------------------------------------------------- Auth
class TestAuth:
    def test_owner_login_ok(self):
        r = _login(OWNER_EMAIL, OWNER_PASSWORD)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "owner"
        assert data["user"]["email"] == OWNER_EMAIL
        assert isinstance(data["token"], str) and len(data["token"]) > 20

    def test_operator_login_ok(self):
        r = _login(OPERATOR_EMAIL, OPERATOR_PASSWORD)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "operator"

    def test_login_wrong_password_401_indonesian(self):
        r = _login(OWNER_EMAIL, "wrongpass")
        assert r.status_code == 401
        assert "salah" in r.json().get("detail", "").lower()

    def test_me(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == OWNER_EMAIL

    def test_register_requires_owner(self, operator_token):
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          headers=_owner_headers(operator_token),
                          json={"email": f"TEST_{uuid.uuid4().hex[:6]}@petapembeli.id",
                                "password": "pw123", "name": "T"}, timeout=15)
        assert r.status_code == 403

    def test_register_by_owner_ok(self, owner_token):
        email = f"test_{uuid.uuid4().hex[:8]}@petapembeli.id"
        r = requests.post(f"{BASE_URL}/api/auth/register",
                          headers=_owner_headers(owner_token),
                          json={"email": email, "password": "pw123456", "name": "Tester"},
                          timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "operator"
        assert r.json()["email"] == email


# --------------------------------------------------------------------------- Vision
class TestVision:
    def test_extract_from_sample_screenshot(self, owner_token):
        img = requests.get(SAMPLE_IMAGE_URL, timeout=60)
        assert img.status_code == 200
        b64 = base64.b64encode(img.content).decode()
        r = requests.post(f"{BASE_URL}/api/vision/extract",
                          headers=_owner_headers(owner_token),
                          json={"image_base64": b64, "filename": "sample.webp"},
                          timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()["extracted"]
        # Print for visibility
        print("VISION EXTRACT:", data)
        # Field presence
        assert "phone_normalized" in data or "phone" in data
        phone = data.get("phone_normalized") or data.get("phone", "")
        assert phone.startswith("+62"), f"Phone not normalized: {phone}"
        assert data.get("phone_normalized") == "+6282238994951"
        assert "Cahyo" in (data.get("recipient_name") or "")
        assert "Jakarta" in (data.get("kota") or "")
        assert data.get("provinsi") == "DKI Jakarta"
        assert data.get("affiliate_creator") == "anyagabrielles"


# --------------------------------------------------------------------------- Orders save + dedupe
class TestOrders:
    def test_save_orders_dedupe_and_normalization(self, owner_token):
        phone = f"+628{int(time.time()) % 100000000}999"  # unique-ish
        payload = [{
            "order_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "recipient_name": "Test User",
            "phone": phone,
            "tiktok_username": "testuser",
            "kota": "Bandung City",
            "provinsi": "West Java",
            "kecamatan": "Coblong",
            "affiliate_creator": "anyagabrielles",
        }]
        r1 = requests.post(f"{BASE_URL}/api/orders/save",
                           headers=_owner_headers(owner_token), json=payload, timeout=30)
        assert r1.status_code == 200, r1.text
        cust_id = r1.json()["results"][0]["customer_id"]

        # Verify normalization + first save
        g = requests.get(f"{BASE_URL}/api/customers/{cust_id}",
                         headers=_owner_headers(owner_token), timeout=15)
        assert g.status_code == 200
        c = g.json()["customer"]
        assert c["provinsi"] == "Jawa Barat", f"prov not normalized: {c['provinsi']}"
        assert c["kota"] == "Kota Bandung", f"kota not normalized: {c['kota']}"
        assert c["order_count"] == 1
        assert c["is_repeat"] is False

        # 2nd save -> same phone -> dedupe
        payload2 = [{
            "order_id": f"TEST_{uuid.uuid4().hex[:8]}",
            "recipient_name": "Test User",
            "phone": phone,
        }]
        r2 = requests.post(f"{BASE_URL}/api/orders/save",
                           headers=_owner_headers(owner_token), json=payload2, timeout=30)
        assert r2.status_code == 200
        g2 = requests.get(f"{BASE_URL}/api/customers/{cust_id}",
                          headers=_owner_headers(owner_token), timeout=15)
        c2 = g2.json()["customer"]
        assert c2["order_count"] == 2
        assert c2["is_repeat"] is True


# --------------------------------------------------------------------------- Customers
class TestCustomers:
    def test_list_seeded(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/customers",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        # 40 seeded + potential test-created. At least 40.
        assert len(rows) >= 40, f"Only {len(rows)} customers"

    def test_filter_by_provinsi(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/customers?provinsi=DKI Jakarta",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert all(x["provinsi"] == "DKI Jakarta" for x in rows)
        assert len(rows) >= 5

    def test_filter_repeat_true(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/customers?repeat=true",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert all(x.get("is_repeat") is True for x in rows)
        assert len(rows) >= 5

    def test_search_q(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/customers?q=Cahyo",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert any("Cahyo" in x["recipient_name"] for x in rows)

    def test_patch_notes_and_tags(self, owner_token):
        # Get first customer
        rows = requests.get(f"{BASE_URL}/api/customers",
                            headers=_owner_headers(owner_token), timeout=15).json()
        cid = rows[0]["id"]
        tags = requests.get(f"{BASE_URL}/api/tags",
                            headers=_owner_headers(owner_token), timeout=15).json()
        tag_id = tags[0]["id"]
        r = requests.patch(f"{BASE_URL}/api/customers/{cid}",
                           headers=_owner_headers(owner_token),
                           json={"notes": "TEST_NOTE_XYZ", "tag_ids": [tag_id]}, timeout=15)
        assert r.status_code == 200
        c = requests.get(f"{BASE_URL}/api/customers/{cid}",
                         headers=_owner_headers(owner_token), timeout=15).json()["customer"]
        assert c["notes"] == "TEST_NOTE_XYZ"
        assert tag_id in c["tag_ids"]


# --------------------------------------------------------------------------- Tags
class TestTags:
    def test_list_seeded_tags(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/tags",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 6

    def test_operator_cannot_delete_tag(self, operator_token, owner_token):
        # Create a tag as owner first
        c = requests.post(f"{BASE_URL}/api/tags",
                          headers=_owner_headers(owner_token),
                          json={"name": f"TEST_{uuid.uuid4().hex[:5]}", "color": "#123456"},
                          timeout=15)
        assert c.status_code == 200
        tid = c.json()["id"]
        r = requests.delete(f"{BASE_URL}/api/tags/{tid}",
                            headers=_owner_headers(operator_token), timeout=15)
        assert r.status_code == 403
        # Cleanup
        requests.delete(f"{BASE_URL}/api/tags/{tid}", headers=_owner_headers(owner_token))

    def test_operator_cannot_patch_tag(self, operator_token, owner_token):
        tags = requests.get(f"{BASE_URL}/api/tags",
                            headers=_owner_headers(owner_token)).json()
        tid = tags[0]["id"]
        r = requests.patch(f"{BASE_URL}/api/tags/{tid}",
                           headers=_owner_headers(operator_token),
                           json={"name": "hack", "color": "#000"}, timeout=15)
        assert r.status_code == 403


# --------------------------------------------------------------------------- Normalization
class TestNormalization:
    def test_list_rules_seeded(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/normalization/rules",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 26

    def test_unmapped_endpoint(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/normalization/unmapped",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_new_rule_retroactive(self, owner_token):
        # Create an order with a novel raw provinsi
        raw_val = f"TESTPROV_{uuid.uuid4().hex[:6]}"
        phone = f"+62815999{int(time.time()) % 1000000}"
        save = requests.post(f"{BASE_URL}/api/orders/save",
                             headers=_owner_headers(owner_token),
                             json=[{"order_id": f"TEST_{uuid.uuid4().hex[:6]}",
                                    "recipient_name": "Retro Test",
                                    "phone": phone,
                                    "provinsi": raw_val}], timeout=30)
        assert save.status_code == 200
        cid = save.json()["results"][0]["customer_id"]
        # Add rule
        r = requests.post(f"{BASE_URL}/api/normalization/rules",
                          headers=_owner_headers(owner_token),
                          json={"raw": raw_val, "normalized": "Normalized Retro",
                                "level": "provinsi"}, timeout=15)
        assert r.status_code == 200
        # Verify retroactive
        c = requests.get(f"{BASE_URL}/api/customers/{cid}",
                         headers=_owner_headers(owner_token)).json()["customer"]
        assert c["provinsi"] == "Normalized Retro"


# --------------------------------------------------------------------------- Creators
class TestCreators:
    def test_creators_aggregate(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/creators",
                         headers=_owner_headers(owner_token), timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "creators" in d and "niche_summary" in d
        assert len(d["creators"]) > 0
        c0 = d["creators"][0]
        for k in ["total_orders", "unique_buyers", "repeat_pct", "top_cities", "niche"]:
            assert k in c0
        # Seeded niche should show for anyagabrielles
        found = [c for c in d["creators"] if c["handle"] == "anyagabrielles"]
        assert found and found[0]["niche"] == "reviewer skincare"

    def test_niche_upsert_owner_only(self, owner_token, operator_token):
        r = requests.post(f"{BASE_URL}/api/creators/niche",
                          headers=_owner_headers(operator_token),
                          json={"handle": "testhandle", "niche": "test"}, timeout=15)
        assert r.status_code == 403
        r2 = requests.post(f"{BASE_URL}/api/creators/niche",
                           headers=_owner_headers(owner_token),
                           json={"handle": "testhandle_x", "niche": "test niche"}, timeout=15)
        assert r2.status_code == 200


# --------------------------------------------------------------------------- CSV
class TestCSV:
    def test_import_and_gap(self, owner_token):
        csv_resp = requests.get(SAMPLE_CSV_URL, timeout=60)
        assert csv_resp.status_code == 200
        files = {"file": ("data.csv", csv_resp.content, "text/csv")}
        headers = {"Authorization": f"Bearer {owner_token}"}
        r = requests.post(f"{BASE_URL}/api/csv/import",
                          headers=headers, files=files, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["read"] > 0
        assert data["upserted"] > 0

        gap = requests.get(f"{BASE_URL}/api/csv/gap",
                           headers=_owner_headers(owner_token), timeout=30)
        assert gap.status_code == 200
        gd = gap.json()
        assert "gap" in gd and "total" in gd and "captured" in gd
        assert len(gd["gap"]) > 0


# --------------------------------------------------------------------------- Settings
class TestSettings:
    def test_wa_template_get(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/settings/wa_template",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["value"] is not None

    def test_csv_mapping_get(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/settings/csv_mapping",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        v = r.json()["value"]
        assert isinstance(v, dict) and "order_id" in v

    def test_put_wa_template_owner_only(self, owner_token, operator_token):
        r = requests.put(f"{BASE_URL}/api/settings/wa_template",
                         headers=_owner_headers(operator_token),
                         json={"value": "hack"}, timeout=15)
        assert r.status_code == 403
        r2 = requests.put(f"{BASE_URL}/api/settings/wa_template",
                          headers=_owner_headers(owner_token),
                          json={"value": "Halo {nama}, terima kasih!"}, timeout=15)
        assert r2.status_code == 200


# --------------------------------------------------------------------------- Analytics
class TestAnalytics:
    def test_dashboard(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/analytics/dashboard",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["total_customers"] >= 40
        assert d["repeat_pct"] > 0
        assert d["top_provinsi"] is not None

    def test_regions_screenshots(self, owner_token):
        r = requests.get(f"{BASE_URL}/api/analytics/regions?source=screenshots",
                         headers=_owner_headers(owner_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for key in ["provinsi", "kota", "kecamatan", "repeat_kota"]:
            assert key in d
        # Sorted desc
        counts = [x["count"] for x in d["provinsi"]]
        assert counts == sorted(counts, reverse=True)
        assert len(d["provinsi"]) > 0


# --------------------------------------------------------------------------- Segments
class TestSegments:
    def test_preview(self, owner_token):
        r = requests.post(f"{BASE_URL}/api/segments/preview",
                          headers=_owner_headers(owner_token),
                          json={"provinsi": "DKI Jakarta"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] >= 5
        assert all(c["provinsi"] == "DKI Jakarta" for c in d["customers"])

    def test_export_csv(self, owner_token):
        r = requests.post(f"{BASE_URL}/api/segments/export/csv",
                          headers=_owner_headers(owner_token),
                          json={"repeat": True}, timeout=20)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        content = r.text
        # Check headers
        first_line = content.splitlines()[0]
        for h in ["recipient_name", "phone", "kota", "provinsi", "tags"]:
            assert h in first_line
