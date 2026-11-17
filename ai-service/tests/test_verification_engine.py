import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.evidence_schemas import ProcessedEvidenceItem

client = TestClient(app, base_url="http://localhost")

def make_evidence_item(
    title: str, url: str, publisher: str, excerpt: str, stance: str,
    publication_date: str = "2024-10-14", is_primary: bool = False,
    relevance: float = 0.85
) -> dict:
    return {
        "title": title,
        "url": url,
        "publisher": publisher,
        "domain": url.split("//")[1].split("/")[0].replace("www.", ""),
        "publication_date": publication_date,
        "retrieval_date": "2026-11-17T00:00:00Z",
        "excerpt": excerpt,
        "source_type": "government" if is_primary else "news",
        "provisional_stance": stance,
        "relevance_score": relevance,
        "is_primary_source": is_primary,
        "document_status": "snippet_only",
        "original_document_availability": "snippet_only",
        "syndication_group": None,
        "is_syndicated_duplicate": False,
        "access_limitations": []
    }

def test_clearly_supported_claim():
    payload = {
        "claim": "NASA launched the Europa Clipper spacecraft on a 1.8-billion-mile journey to Jupiter's ocean moon.",
        "evidence": [
            make_evidence_item(
                title="NASA Launches Europa Clipper to Investigate Habitability of Jupiter Moon",
                url="https://nasa.gov/news-release/europa-clipper/",
                publisher="NASA Official Press Office",
                excerpt="NASA's Europa Clipper spacecraft lifted off aboard a Falcon Heavy rocket on a 1.8-billion-mile journey to Jupiter's ocean moon Europa.",
                stance="SUPPORTS",
                is_primary=True,
                relevance=0.95
            ),
            make_evidence_item(
                title="Europa Clipper mission launches on 1.8 billion mile journey",
                url="https://apnews.com/article/nasa-europa-clipper-launch",
                publisher="Associated Press",
                excerpt="A NASA spacecraft embarked on a long journey to an icy moon of Jupiter on Monday.",
                stance="SUPPORTS",
                is_primary=False,
                relevance=0.88
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "SUPPORTED"
    assert data["evidence_sufficiency"] in ["Moderate", "Strong"]
    assert data["confidence"] >= 80
    assert len(data["supporting_evidence"]) >= 1
    assert len(data["contradicting_evidence"]) == 0
    assert "NASA Official Press Office" in data["explanation"]

def test_clearly_false_claim():
    payload = {
        "claim": "The government passed a 40% income tax increase last Tuesday.",
        "evidence": [
            make_evidence_item(
                title="Fact Check: False claims circulate regarding sudden 40 percent income tax hike",
                url="https://factcheck.org/2026/11/false-claims-tax-hike",
                publisher="FactCheck.org",
                excerpt="Viral social media posts claiming parliament secretly passed a 40% income tax increase last Tuesday are completely fabricated. Official parliamentary voting records confirm no such legislation was considered or passed.",
                stance="CONTRADICTS",
                is_primary=False,
                relevance=0.92
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "FALSE"
    assert len(data["contradicting_evidence"]) == 1
    assert len(data["supporting_evidence"]) == 0
    assert "FactCheck.org" in data["explanation"]

def test_partially_true_claim_mostly_supported():
    payload = {
        "claim": "All European nations unanimously banned gasoline cars last week.",
        "evidence": [
            make_evidence_item(
                title="EU Parliament endorses zero-emission targets for new vehicles",
                url="https://europarl.europa.eu/news/zero-emissions-vehicles",
                publisher="European Parliament",
                excerpt="MEPs approved new targets for zero-emission passenger cars by 2035 with specific exemptions agreed for synthetic e-fuels following member state negotiations.",
                stance="SUPPORTS",
                is_primary=True,
                relevance=0.80
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Absolute quantifier 'All' requires qualification
    assert data["verdict"] == "MOSTLY SUPPORTED"
    assert any("qualification" in lim.lower() or "qualifier" in lim.lower() for lim in data["limitations"])

def test_misleading_headline():
    payload = {
        "claim": "Shocking economic disaster as central bank changes policy.",
        "evidence": [
            make_evidence_item(
                title="Federal Reserve lowers rate by 25 basis points in routine adjustment",
                url="https://federalreserve.gov/monetary2024.htm",
                publisher="Federal Reserve Board",
                excerpt="The Committee decided to lower the target range by 25 basis points to support continued economic expansion.",
                stance="SUPPORTS",
                is_primary=True,
                relevance=0.75
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "MISLEADING"
    assert any("sensationalized" in lim.lower() or "framing" in lim.lower() for lim in data["limitations"])

def test_outdated_claim():
    payload = {
        "claim": "The corporate income tax rate currently stands at 35 percent in the United States today.",
        "evidence": [
            make_evidence_item(
                title="Historical Corporate Tax Rate Schedule",
                url="https://treasury.gov/tax-schedule-archive-2016",
                publisher="U.S. Department of the Treasury Archive",
                excerpt="The federal corporate income tax rate graduated up to 35% on taxable income.",
                stance="SUPPORTS",
                publication_date="2016-01-15",
                is_primary=True,
                relevance=0.75
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "MISLEADING"
    assert any("superseded" in lim.lower() or "outdated" in lim.lower() for lim in data["limitations"])

def test_conflicting_reports():
    payload = {
        "claim": "Diplomatic peace negotiations in Geneva reached a preliminary ceasefire agreement on Wednesday.",
        "evidence": [
            make_evidence_item(
                title="Diplomats sign preliminary ceasefire agreement in Geneva",
                url="https://reuters.com/world/geneva-accord-signed",
                publisher="Reuters News",
                excerpt="Delegates signed a preliminary ceasefire framework on Wednesday officially agreeing to freeze frontline positions.",
                stance="SUPPORTS",
                is_primary=False,
                relevance=0.90
            ),
            make_evidence_item(
                title="Geneva peace talks collapse without agreement",
                url="https://apnews.com/article/geneva-talks-break-down",
                publisher="Associated Press",
                excerpt="Peace negotiations collapsed on Wednesday after delegates walked out without reaching any agreement or ceasefire.",
                stance="CONTRADICTS",
                is_primary=False,
                relevance=0.90
            )
        ]
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "CONFLICTING EVIDENCE"
    assert len(data["supporting_evidence"]) >= 1
    assert len(data["contradicting_evidence"]) >= 1
    assert any("conflicting" in lim.lower() for lim in data["limitations"])

def test_opinion_statement_not_a_factual_claim():
    payload = {
        "claim": "In my opinion, renewable energy subsidies are a complete waste of taxpayer funds.",
        "is_opinion_or_prediction": True,
        "statement_type": "OPINION",
        "evidence": []
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "NOT A FACTUAL CLAIM"
    assert data["evidence_sufficiency"] == "Insufficient"
    assert "subjective viewpoint" in data["explanation"].lower() or "opinion" in data["explanation"].lower()

def test_prediction_statement_not_a_factual_claim():
    payload = {
        "claim": "Artificial intelligence will probably eliminate all software engineering jobs by the year 2040.",
        "is_opinion_or_prediction": True,
        "statement_type": "PREDICTION",
        "evidence": []
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "NOT A FACTUAL CLAIM"
    assert data["evidence_sufficiency"] == "Insufficient"

def test_no_search_results_unverified():
    payload = {
        "claim": "Subterranean geothermal pulse turbines in Lake Michigan generate 10 gigawatts of stealth power.",
        "evidence": []
    }
    response = client.post("/verify/evaluate-claim", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["verdict"] == "UNVERIFIED"
    assert data["evidence_sufficiency"] == "Insufficient"
    assert data["confidence"] <= 35
    assert len(data["supporting_evidence"]) == 0
    assert len(data["contradicting_evidence"]) == 0
    assert any("insufficient" in lim.lower() for lim in data["limitations"])

def test_end_to_end_pipeline():
    payload = {
        "text": "NASA launched the Europa Clipper spacecraft on a 1.8-billion-mile journey to Jupiter's icy moon.",
        "max_results_per_claim": 3
    }
    response = client.post("/verify/pipeline", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "claims_verified" in data
    assert len(data["claims_verified"]) >= 1
    assert data["overall_verdict"] == "SUPPORTED"
    assert data["claims_verified"][0]["verdict"] == "SUPPORTED"

