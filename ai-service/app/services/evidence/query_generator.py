import re
from typing import List
from app.utils.entity_extractor import extract_entities
from app.utils.temporal_extractor import extract_temporal

class QueryGenerator:
    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "by", 
        "with", "is", "are", "was", "were", "it", "that", "this", "be", "has", "have",
        "but", "after", "before", "during", "when", "where", "why", "how", "what",
        "two", "over", "into", "from", "than", "more", "some", "all", "its", "their"
    }

    @classmethod
    def generate_queries(cls, claim: str) -> List[str]:
        if not claim or not claim.strip():
            return []

        # 0. Normalize numbers with commas: 1,600 -> 1600
        num_clean_claim = re.sub(r"(\d+),(\d+)", r"\1\2", claim)
        clean_claim = re.sub(r"[^\w\s\$\%\-\.]", " ", num_clean_claim).strip()

        # 1. Extract entities and dates
        entities, location = extract_entities(clean_claim)
        dates, numbers = extract_temporal(clean_claim)

        # Detect capitalized proper nouns (e.g. Nvidia, Dow Jones, Robert Pattinson)
        proper_nouns = re.findall(r"\b[A-Z][a-zA-Z0-9\-\.]*(?:\s+[A-Z][a-zA-Z0-9\-\.]*)*\b", num_clean_claim)
        entity_parts = list(dict.fromkeys(
            entities + [pn for pn in proper_nouns if pn.lower() not in cls.STOPWORDS and len(pn) > 2]
        ))

        # 2. Extract salient keywords (excluding stopwords)
        words = [w for w in clean_claim.split() if w.lower() not in cls.STOPWORDS and len(w) > 2]
        keyword_summary = " ".join(words[:8])

        queries = []

        # Query 1: Primary entity + key action & number (e.g. Dow Jones falls 1600 points)
        entity_words_lower = set(" ".join(entity_parts).lower().split())
        non_entity_words = [w for w in words if w.lower() not in entity_words_lower]
        
        q1_terms = list(dict.fromkeys(entity_parts[:1] + non_entity_words[:3]))
        if q1_terms:
            queries.append(" ".join(q1_terms))

        # Query 2: All entities + market/event key verbs (e.g. Dow Jones Nvidia futures rebound)
        action_keys = [w for w in non_entity_words if w.lower() in (
            "futures", "rebound", "results", "earnings", "falls", "drops", "sinks", "rallies", "confirmed", "launch", "tax"
        )]
        q2_terms = list(dict.fromkeys(entity_parts + (action_keys[:3] if action_keys else non_entity_words[:3])))
        if q2_terms:
            queries.append(" ".join(q2_terms))

        # Query 3: Entities + Numbers (e.g. Dow Jones 1600)
        if numbers:
            q3_terms = list(dict.fromkeys(entity_parts[:2] + numbers[:2]))
            queries.append(" ".join(q3_terms))

        # Query 4: Fact-Check targeted query
        primary_entity = entity_parts[0] if entity_parts else words[0] if words else "claim"
        queries.append(f"{primary_entity} {' '.join(non_entity_words[:3])} fact check".strip())

        # Query 5: Multi-stance contradicting inquiry (debunk / false / denial)
        queries.append(f"{primary_entity} false inaccurate debunk {' '.join(non_entity_words[:3])}".strip())

        # Query 6: Supporting verification inquiry (official records / confirmation)
        queries.append(f"{primary_entity} official statement confirmed".strip())

        # Deduplicate while preserving order
        unique_queries = []
        for q in queries:
            q_clean = re.sub(r"\s+", " ", q).strip()
            if q_clean and q_clean not in unique_queries:
                unique_queries.append(q_clean)

        return unique_queries[:2]

generate_search_queries = QueryGenerator.generate_queries

