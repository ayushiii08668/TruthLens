import re
from typing import List
from app.utils.entity_extractor import extract_entities

class QueryGenerator:
    STOPWORDS = {
        "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "by", 
        "with", "is", "are", "was", "were", "it", "that", "this", "be", "has", "have",
        "but", "after", "before", "during", "when", "where", "why", "how", "what",
        "two", "over", "into", "from", "than", "more", "some", "all", "its", "their"
    }

    OCR_NOISE_RE = re.compile(
        r"\b(?:\d+o|mar|yo|asl|fns|xi|ns|em|f's|4o)\b|[^\w\s\-\.\']", 
        re.IGNORECASE
    )

    @classmethod
    def generate_queries(cls, claim: str) -> List[str]:
        if not claim or not claim.strip():
            return []

        # 0. Clean quotes and excessive whitespace
        raw = re.sub(r'[\"\']', '', claim).strip()

        # 1. Detect shared context suffix like "| IPL 2025" or "(2025)"
        context_suffix = ""
        pipe_parts = [p.strip() for p in raw.split("|") if p.strip()]
        if len(pipe_parts) > 1:
            last = pipe_parts[-1]
            last_clean = cls.OCR_NOISE_RE.sub(" ", last).strip()
            if 0 < len(last_clean.split()) <= 3:
                context_suffix = last_clean
                raw = " | ".join(pipe_parts[:-1])

        # 2. Check for compound headline delimiters: comma, &, ;, pipe, or newline
        delimiters = r'[,;&\n\r|]'
        raw_clauses = re.split(delimiters, raw)
        clauses = []
        for rc in raw_clauses:
            cleaned = cls.OCR_NOISE_RE.sub(" ", rc)
            words = [w for w in cleaned.split() if len(w) > 1 and w.lower() not in cls.STOPWORDS]
            if len(words) >= 2:
                clauses.append(" ".join(words))

        queries: List[str] = []

        # If compound clauses were found, generate focused query for each clause
        if len(clauses) >= 2:
            for clause in clauses:
                if context_suffix and context_suffix.lower() not in clause.lower():
                    q = f"{clause} {context_suffix}".strip()
                else:
                    q = clause.strip()
                if q and q not in queries:
                    queries.append(q)

        # 3. Extract proper nouns / entities
        num_clean_claim = re.sub(r"(\d+),(\d+)", r"\1\2", raw)
        clean_claim = re.sub(r"[^\w\s\$\%\-\.]", " ", num_clean_claim).strip()
        entities, _ = extract_entities(clean_claim)
        proper_nouns = re.findall(r"\b[A-Z][a-zA-Z0-9\-\.]*(?:\s+[A-Z][a-zA-Z0-9\-\.]*)*\b", num_clean_claim)
        
        valid_nouns = list(dict.fromkeys([
            pn for pn in (proper_nouns + entities) 
            if pn.lower() not in cls.STOPWORDS and len(pn) > 2 and not cls.OCR_NOISE_RE.match(pn)
        ]))

        all_clean_words = [
            w for w in cls.OCR_NOISE_RE.sub(" ", raw).split() 
            if w.lower() not in cls.STOPWORDS and len(w) > 2
        ]

        if valid_nouns:
            noun_words = []
            for n in valid_nouns:
                for w in n.split():
                    w_clean = re.sub(r"[^\w]", "", w)
                    if w_clean and w_clean.lower() not in cls.STOPWORDS and w_clean.lower() not in [nw.lower() for nw in noun_words]:
                        noun_words.append(w_clean)
            entity_q = " ".join(noun_words[:4])
            if context_suffix and context_suffix.lower() not in entity_q.lower():
                entity_q = f"{entity_q} {context_suffix}"
            if entity_q and entity_q not in queries:
                queries.append(entity_q)

        # Simplified core query (max 5 keywords)
        if all_clean_words:
            core_words = []
            for w in all_clean_words:
                w_clean = re.sub(r"[^\w]", "", w)
                if w_clean and w_clean.lower() not in cls.STOPWORDS and w_clean.lower() not in [cw.lower() for cw in core_words]:
                    core_words.append(w_clean)
            core_q = " ".join(core_words[:5])
            if context_suffix and context_suffix.lower() not in core_q.lower():
                core_q = f"{core_q} {context_suffix}"
            if core_q and core_q not in queries:
                queries.append(core_q)

        # Deduplicate while preserving order and limit to 4 highest-quality queries
        final_queries = []
        for q in queries:
            clean_q = re.sub(r"\s+", " ", q).strip()
            if clean_q and clean_q not in final_queries:
                final_queries.append(clean_q)

        return final_queries[:4]

generate_search_queries = QueryGenerator.generate_queries
