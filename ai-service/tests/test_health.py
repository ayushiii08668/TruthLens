from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, base_url="http://localhost")

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert "TruthLens" in data["service"]

def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "llm_provider" in data

