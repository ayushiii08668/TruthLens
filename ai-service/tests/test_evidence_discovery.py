import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import is_safe_url
from app.services.evidence.query_generator import generate_search_queries
from app.services.evidence.deduplicator import EvidenceDeduplicator
from app.services.evidence.page_fetcher import PageFetcher
from app.models.evidence_schemas import RawEvidenceSnippet

client = TestClient(app, base_url="http://localhost")

def test_query_generation_creates_diverse_queries():
    claim = "The Federal Reserve lowered benchmark interest rates by 50 basis points on Wednesday."
    queries = generate_search_queries(claim)

    assert len(queries) >= 3
    # Check that core entities or numbers are included
    assert any("Federal Reserve" in q for q in queries)
    # Check that multi-stance queries are present
    assert any("fact check" in q for q in queries)
    assert any("false" in q or "inaccurate" in q or "debunk" in q for q in queries)

def test_evidence_search_with_supporting_evidence():
    payload = {
        "claim": "NASA launched the Europa Clipper spacecraft on a journey to Jupiter's ocean moon.",
        "max_results": 5
    }
    response = client.post("/evidence/search", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["claim"] == payload["claim"]
    assert data["search_status"] == "completed"
    assert len(data["evidence"]) >= 1

    first_item = data["evidence"][0]
    assert "nasa.gov" in first_item["domain"] or "apnews.com" in first_item["domain"]
    assert first_item["url"].startswith("http")
    assert first_item["provisional_stance"] in ["SUPPORTS", "NEUTRAL"]
    assert first_item["relevance_score"] >= 0.30
    assert first_item["publisher"] != ""
    assert first_item["excerpt"] != ""
    # Section 6 metadata validation
    assert first_item["publisher_identity"] is not None
    assert first_item["event_date"] is not None
    assert first_item["original_document_availability"] in ["snippet_only", "full_text", "inaccessible"]

def test_evidence_search_with_contradicting_evidence():
    payload = {
        "claim": "The government passed a 40% income tax increase last Tuesday."
    }
    response = client.post("/evidence/search", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["evidence"]) >= 1
    # Should locate the fact check record debunking this claim
    contradicting = [e for e in data["evidence"] if e["provisional_stance"] == "CONTRADICTS"]
    assert len(contradicting) >= 1
    assert "factcheck.org" in contradicting[0]["domain"].lower()

def test_ssrf_protection_blocks_malicious_urls():
    blocked_urls = [
        "http://localhost:5000/api",
        "http://127.0.0.1:8000/admin",
        "http://169.254.169.254/latest/meta-data/",
        "http://192.168.1.1/router",
        "http://10.0.0.1/internal",
        "ftp://example.com/file",
        "file:///etc/passwd",
        ""
    ]
    for url in blocked_urls:
        assert is_safe_url(url) is False, f"Expected {url} to be blocked by SSRF protection"

    # Public safe URLs should pass
    assert is_safe_url("https://www.reuters.com/markets") is True
    assert is_safe_url("https://www.nasa.gov/news") is True

def test_canonical_url_deduplication():
    url1 = "https://www.nasa.gov/news-release/europa-clipper/?utm_source=twitter&utm_medium=social"
    url2 = "https://nasa.gov/news-release/europa-clipper/"

    norm1 = EvidenceDeduplicator.normalize_url(url1)
    norm2 = EvidenceDeduplicator.normalize_url(url2)

    assert norm1 == norm2
    assert "utm_source" not in norm1

def test_syndication_grouping_prevents_duplicate_weight():
    identical_excerpt = "The Federal Reserve lowered benchmark policy rates by 50 basis points following unanimous vote."
    raw_items = [
        RawEvidenceSnippet(
            title="Fed lowers rates by half point",
            url="https://wire.reuters.com/article/1",
            publisher="Reuters Wire",
            domain="reuters.com",
            retrieval_date="2026-11-17T00:00:00Z",
            excerpt=identical_excerpt,
            source_type="news"
        ),
        RawEvidenceSnippet(
            title="Fed lowers rates by half point",
            url="https://localaffiliate.com/syndicated-news/1",
            publisher="Local News Partner",
            domain="localaffiliate.com",
            retrieval_date="2026-11-17T00:00:00Z",
            excerpt=identical_excerpt,
            source_type="news"
        )
    ]
    grouped = EvidenceDeduplicator.deduplicate_and_group(raw_items)
    assert len(grouped) == 2
    assert grouped[0]["syndication_group"] is not None
    assert grouped[0]["is_syndicated_duplicate"] is False
    # Second reprint is tagged as a duplicate of the same wire syndication
    assert grouped[1]["is_syndicated_duplicate"] is True
    assert grouped[1]["syndication_group"] == grouped[0]["syndication_group"]

def test_unknown_claim_returns_empty_results_without_inventing_sources():
    payload = {
        "claim": "Zanzibar subterranean crystal anomalies generated anti-gravity pulses in 1842."
    }
    response = client.post("/evidence/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["search_status"] == "no_results"
    assert len(data["evidence"]) == 0
    assert any("No authoritative source documents found" in lim for lim in data["limitations"])

def test_empty_claim_input():
    response = client.post("/evidence/search", json={"claim": "   "})
    assert response.status_code == 200
    assert len(response.json()["evidence"]) == 0

@pytest.mark.asyncio
async def test_page_fetcher_safely_marks_inaccessible_on_blocked_ssrf():
    text, status, limits = await PageFetcher.fetch_article_text("http://127.0.0.1:8000/private")
    assert text is None
    assert status == "inaccessible"
    assert any("SSRF" in lim for lim in limits)
