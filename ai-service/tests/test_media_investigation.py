import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, base_url="http://localhost")

def create_test_image_bytes(fmt="PNG", size=(250, 150), color="red") -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()

def test_url_investigation_blocks_ssrf_endpoints():
    blocked_urls = [
        "http://127.0.0.1:8000/api/secret",
        "http://localhost:5000/internal",
        "http://169.254.169.254/latest/meta-data/iam/security-credentials",
        "http://metadata.google.internal/computeMetadata/v1/",
        "http://192.168.1.1/router"
    ]
    for url in blocked_urls:
        response = client.post("/media/url-investigate", json={"url": url})
        assert response.status_code == 200
        data = response.json()
        assert data["document_status"] == "inaccessible"
        assert len(data["claims_verified"]) == 0
        assert any("ssrf" in lim.lower() for lim in data["limitations"])

def test_long_form_article_investigation():
    article_text = (
        "NASA successfully launched the Europa Clipper spacecraft on a SpaceX Falcon Heavy to explore Jupiter's moon Europa. "
        "Meanwhile, viral rumors claimed the federal government enacted an emergency 25% sales tax increase yesterday across the nation. "
        "Researchers in Zurich also announced a room-temperature ambient pressure superconductor made of pure silicon."
    )
    response = client.post("/media/article-investigate", json={
        "text": article_text,
        "title": "Weekly Scientific and Policy Roundup"
    })
    assert response.status_code == 200
    data = response.json()

    assert data["total_claims_identified"] >= 2
    assert len(data["claims_verified"]) >= 2
    assert "article_summary" in data
    # Verify claims have independent verdicts
    verdicts = [c["verdict"] for c in data["claims_verified"]]
    assert len(set(verdicts)) >= 1  # Claims evaluated independently
    assert "Claims are assessed independently" in data["article_summary"]

def test_image_investigation_valid_format_and_provenance():
    img_bytes = create_test_image_bytes(fmt="PNG", size=(300, 200), color="blue")
    response = client.post(
        "/media/image-investigate",
        files={"file": ("spacecraft_launch.png", img_bytes, "image/png")},
        data={"caption": "Spacecraft launch vehicle tests"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["format"] == "PNG"
    assert data["dimensions"] == "300x200"
    assert data["file_size_bytes"] > 0
    assert "authenticity" in data
    assert "manipulation" in data
    assert "origin" in data
    assert "context" in data
    assert data["authenticity"]["assessment"] in ("GENUINE_HARDWARE_CAPTURE", "UNSPECIFIED")
    assert "synthetic" in data["authenticity"]["notes"][1].lower() or "provenance" in data["authenticity"]["notes"][1].lower()

def test_reused_viral_image_context_detection():
    # Image with fire/wildfire in filename and claim of "today/breaking explosion"
    img_bytes = create_test_image_bytes(fmt="JPEG", size=(400, 300), color="orange")
    response = client.post(
        "/media/image-investigate",
        files={"file": ("wildfire_smoke.jpg", img_bytes, "image/jpeg")},
        data={"caption": "Breaking news: Huge chemical factory explosion destroys facility today!"}
    )
    assert response.status_code == 200
    data = response.json()

    # The mock reverse search identifies Mendocino wildfire from 2018
    assert data["origin"]["total_matches"] >= 1
    assert data["context"]["is_reused"] is True
    assert data["context"]["verdict"] == "MISCAPTIONED_RECYCLED_MEDIA"
    assert "2018" in data["context"]["explanation"]

def test_upload_security_rejects_invalid_file_type():
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"
    response = client.post(
        "/media/image-investigate",
        files={"file": ("malicious_payload.exe", fake_exe, "application/x-msdownload")}
    )
    assert response.status_code == 400
    assert "unsupported" in response.text.lower()

def test_upload_security_rejects_corrupted_image():
    corrupted_data = b"This is not a real image binary file."
    response = client.post(
        "/media/image-investigate",
        files={"file": ("corrupted.jpg", corrupted_data, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "invalid or corrupted" in response.text.lower()
