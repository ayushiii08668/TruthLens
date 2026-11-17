import re
from typing import List, Tuple, Optional, Set

class EntityExtractor:
    # Common global locations / countries / major cities
    KNOWN_LOCATIONS = {
        "united states", "usa", "us", "u.s.", "uk", "u.k.", "united kingdom",
        "china", "russia", "ukraine", "france", "germany", "india", "japan",
        "canada", "australia", "brazil", "mexico", "israel", "iran", "taiwan",
        "washington", "london", "paris", "beijing", "tokyo", "berlin", "moscow",
        "kyiv", "brussels", "new york", "california", "texas", "florida",
        "europe", "asia", "africa", "middle east", "latin america"
    }

    # Major organizations
    KNOWN_ORGS = {
        "who", "world health organization", "cdc", "fda", "un", "united nations",
        "nato", "eu", "european union", "imf", "world bank", "federal reserve",
        "sec", "nasa", "esa", "ipcc", "epa", "pentagon", "white house",
        "kremlin", "parliament", "congress", "senate", "supreme court",
        "openai", "google", "apple", "microsoft", "amazon", "meta", "tesla",
        "pfizer", "moderna", "astrazeneca"
    }

    # Titles that precede person names
    PERSON_TITLES = (
        r"\b(?:President|Prime Minister|Premier|Governor|Senator|Congressman|Congresswoman|"
        r"Chancellor|Minister|Secretary|Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|CEO|Director|Judge|Justice)\s+"
    )

    @classmethod
    def extract(cls, text: str) -> Tuple[List[str], Optional[str]]:
        if not text:
            return [], None

        entities: Set[str] = set()
        primary_location: Optional[str] = None

        # 1. Look for known organizations (case-insensitive)
        text_lower = text.lower()
        for org in cls.KNOWN_ORGS:
            pattern = r"\b" + re.escape(org) + r"\b"
            if re.search(pattern, text_lower):
                # Preserve original casing from text if possible
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    entities.add(match.group(0))

        # 2. Look for known locations
        for loc in cls.KNOWN_LOCATIONS:
            pattern = r"\b" + re.escape(loc) + r"\b"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                matched_loc = match.group(0)
                entities.add(matched_loc)
                if not primary_location:
                    primary_location = matched_loc.title()

        # 3. Look for Persons preceded by titles (e.g. President Joe Biden, Dr. Anthony Fauci)
        title_matches = re.finditer(cls.PERSON_TITLES + r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", text)
        for m in title_matches:
            name_part = m.group(1).strip()
            if name_part and len(name_part) > 2:
                entities.add(m.group(0).strip())

        # 4. Look for capitalized multi-word phrases (Potential Names / Organizations)
        # Excluding sentence beginnings
        words = text.split()
        for i in range(1, len(words) - 1):
            w1 = re.sub(r"[^\w]", "", words[i])
            w2 = re.sub(r"[^\w]", "", words[i + 1])
            if (
                w1 and w2 
                and w1[0].isupper() 
                and w2[0].isupper()
                and w1.lower() not in {"the", "a", "an", "this", "that", "in", "on", "at", "to", "for"}
            ):
                candidate = f"{w1} {w2}"
                if len(candidate) > 4:
                    entities.add(candidate)

        # 5. Look for uppercase acronyms (e.g. NASA, CDC, WHO, AI, GDP, OECD)
        acronyms = re.findall(r"\b[A-Z]{2,6}\b", text)
        for acr in acronyms:
            if acr not in {"A", "I", "AT", "IN", "ON", "TO", "IS", "IT", "OF", "AND", "OR", "IF"}:
                entities.add(acr)

        sorted_entities = sorted(list(entities), key=lambda x: (len(x), x), reverse=True)
        return sorted_entities[:10], primary_location

extract_entities = EntityExtractor.extract

