import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, base_url="http://localhost")

def test_extract_factual_headline():
    payload = {
        "text": "NASA launched the Europa Clipper spacecraft on a 1.8-billion-mile journey to Jupiter's icy moon."
    }
    response = client.post("/analyze/extract-claims", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "claims" in data
    assert len(data["claims"]) == 1

    claim = data["claims"][0]
    assert "Europa Clipper" in claim["original_text"]
    assert claim["category"] == "science"
    assert claim["verifiable"] is True
    assert any("NASA" in e for e in claim["entities"])
    assert any("1.8" in e or "billion" in e for e in claim["entities"])

def test_ignore_opinions_and_subjective_statements():
    payload = {
        "text": "In my opinion, space exploration is the greatest achievement of humanity. I think it is wonderful."
    }
    response = client.post("/analyze/extract-claims", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["claims"]) == 0

def test_ignore_questions():
    payload = {
        "text": "Why did the government allocate $5 billion to highway construction? Will anyone audit this spending?"
    }
    response = client.post("/analyze/extract-claims", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["claims"]) == 0

def test_ignore_predictions():
    payload = {
        "text": "Quantum computers will probably replace conventional supercomputers by the year 2045."
    }
    response = client.post("/analyze/extract-claims", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["claims"]) == 0

def test_ignore_unsupported_allegations():
    payload = {
        "text": "Rumor has it that central bankers held a secret meeting to abolish physical cash."
    }
    response = client.post("/analyze/extract-claims", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["claims"]) == 0

def test_mixed_input_extracts_only_factual_claims():
    text = (
        "The Federal Reserve lowered benchmark interest rates by 50 basis points on Wednesday. "
        "I believe this was a terrible monetary mistake by the chairman. "
        "What will happen to mortgage rates now? "
        "U.S. inflation cooled to 2.5 percent in August 2024 according to Labor Department statistics."
    )
    response = client.post("/analyze/extract-claims", json={"text": text})
    assert response.status_code == 200
    data = response.json()
    assert len(data["claims"]) == 2

    c1 = data["claims"][0]
    assert "Federal Reserve" in c1["original_text"]
    assert c1["category"] == "finance"

    c2 = data["claims"][1]
    assert "inflation cooled" in c2["original_text"].lower()
    assert c2["category"] == "finance"

def test_category_classification_domains():
    samples = [
        ("The FDA approved a new pediatric mRNA vaccine for respiratory syncytial virus.", "health"),
        ("Senator Smith introduced a bipartisan bill to reform political campaign financing in Washington.", "politics"),
        ("Global greenhouse gas emissions from fossil fuels reached a record 37.4 billion metric tons in 2023.", "environment"),
        ("Google unveiled a 105-qubit quantum processor with reduced error rates.", "technology"),
        ("Over 4.5 million students enrolled in public universities across the state of Texas.", "education")
    ]
    for statement, expected_cat in samples:
        res = client.post("/analyze/extract-claims", json={"text": statement})
        assert res.status_code == 200
        claims = res.json()["claims"]
        assert len(claims) == 1
        assert claims[0]["category"] == expected_cat

def test_deduplication_of_sentences():
    text = (
        "The European Union adopted the landmark Artificial Intelligence Act on March 13, 2024. "
        "The European Union adopted the landmark Artificial Intelligence Act on March 13, 2024! "
        "European officials voted overwhelmingly to approve the regulations."
    )
    res = client.post("/analyze/extract-claims", json={"text": text})
    assert res.status_code == 200
    claims = res.json()["claims"]
    assert len(claims) == 2

def test_social_media_cleaning():
    text = "RT @BreakingNews: The White House confirmed a $3.2B infrastructure grant for California rail #transit https://t.co/xyz123"
    res = client.post("/analyze/extract-claims", json={"text": text})
    assert res.status_code == 200
    claims = res.json()["claims"]
    assert len(claims) == 1
    assert "RT @" not in claims[0]["normalized_claim"]
    assert "California" in claims[0]["entities"] or claims[0]["location"] == "California"

def test_abbreviations_do_not_split_sentences():
    text = "Dr. Jane Doe presented the clinical trial findings in Washington D.C. on Nov. 12, 2025."
    res = client.post("/analyze/extract-claims", json={"text": text})
    assert res.status_code == 200
    claims = res.json()["claims"]
    assert len(claims) == 1
    assert "Dr. Jane Doe" in claims[0]["original_text"] or "Jane Doe" in claims[0]["entities"]
    assert len(claims[0]["dates"]) >= 1

def test_long_article_paragraphs():
    long_text = "\n\n".join([
        "The World Health Organization confirmed an outbreak of avian influenza across three poultry facilities in France.",
        "Local agricultural authorities quarantined over 120,000 birds to prevent regional spread.",
        "I feel this situation could be handled much better by the farming community.",
        "Could wild migratory waterfowl be the primary vector of transmission?",
        "European veterinary laboratories sequenced the viral genome on Monday morning."
    ])
    res = client.post("/analyze/extract-claims", json={"text": long_text})
    assert res.status_code == 200
    data = res.json()
    # 3 factual statements, 1 opinion, 1 question
    assert len(data["claims"]) == 3
    assert data["total_sentences"] == 5

def test_empty_and_whitespace_input():
    res = client.post("/analyze/extract-claims", json={"text": "    "})
    assert res.status_code == 200
    assert len(res.json()["claims"]) == 0

def test_invalid_body_validation_error():
    res = client.post("/analyze/extract-claims", json={})
    assert res.status_code == 422
