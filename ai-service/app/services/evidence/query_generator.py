import re
from typing import List
from app.utils.entity_extractor import extract_entities
from app.utils.temporal_extractor import extract_temporal

class QueryGenerator:
    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "by", 
        "with", "is", "are", "was", "were", "it", "that", "this", "be", "has", "have"
    }

    @classmethod
    def generate_queries(cls, claim: str) -> List[str]:
        if not claim or not claim.strip():
            return []

        clean_claim = re.sub(r"[^\w\s\$\%\-\.]", " ", claim).strip()

        # 1. Extract entities and dates
        entities, location = extract_entities(clean_claim)
        dates, numbers = extract_temporal(clean_claim)

        # 2. Extract salient keywords (excluding stopwords)
        words = [w for w in clean_claim.split() if w.lower() not in cls.STOPWORDS and len(w) > 2]
        keyword_summary = " ".join(words[:8])

        queries = []

        # Query 1: Focused Entity & Temporal query
        entity_parts = list(entities[:2])
        if location and location not in entity_parts:
            entity_parts.append(location)
        if dates:
            entity_parts.append(dates[0])
        elif numbers:
            entity_parts.append(numbers[0])

        focused_terms = list(dict.fromkeys(entity_parts + words[:4]))
        focused_query = " ".join(focused_terms) if focused_terms else keyword_summary
        queries.append(focused_query.strip())

        # Query 2: Fact-Check targeted query
        primary_entity = entities[0] if entities else words[0] if words else "claim"
        queries.append(f"{primary_entity} {keyword_summary[:40]} fact check".strip())

        # Query 3: Supporting verification inquiry (official records / confirmation)
        queries.append(f"{primary_entity} official statement confirmed {dates[0] if dates else ''}".strip())

        # Query 4: Contradicting inquiry (debunk / false / denial)
        queries.append(f"{primary_entity} false inaccurate debunk {keyword_summary[:30]}".strip())

        # Deduplicate while preserving order
        unique_queries = []
        for q in queries:
            q_clean = re.sub(r"\s+", " ", q).strip()
            if q_clean and q_clean not in unique_queries:
                unique_queries.append(q_clean)

        return unique_queries[:4]

generate_search_queries = QueryGenerator.generate_queries

