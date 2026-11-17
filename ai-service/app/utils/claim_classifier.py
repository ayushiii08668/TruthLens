import re
from typing import Tuple

class ClaimClassifier:
    # 1. Question Patterns
    QUESTION_PATTERN = re.compile(
        r"^(?:who|what|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should)\b.*\?$",
        re.IGNORECASE
    )

    # 2. Opinion Markers
    OPINION_MARKERS = [
        r"\bi\s+(?:think|believe|feel|reckon|suppose|guess)\b",
        r"\bin\s+my\s+(?:opinion|view|perspective|judgment)\b",
        r"\bto\s+my\s+mind\b",
        r"\bpersonally\b",
        r"\bit\s+seems\s+to\s+me\b",
        r"\b(?:worst|best|greatest|ugliest|most\s+beautiful|finest|terrible|horrible|wonderful|magnificent)\b",
        r"\b(?:should|ought\s+to|must)\s+(?:be\s+banned|learn|appreciate|admit|repent)\b",
        r"\bso-called\b"
    ]

    # 3. Prediction Markers
    PREDICTION_MARKERS = [
        r"\b(?:will\s+likely|will\s+probably|might\s+well|could\s+possibly)\b",
        r"\b(?:is\s+predicted\s+to|is\s+projected\s+to|is\s+expected\s+to\s+occur\s+by)\b",
        r"\b(?:by\s+the\s+year\s+20[3-9]\d|by\s+20[3-9]\d)\b",
        r"\b(?:futuristic|hypothetically\s+speaking|in\s+the\s+distant\s+future)\b"
    ]

    # 4. Unsupported Allegation / Rumor Markers
    ALLEGATION_MARKERS = [
        r"\brumor\s+has\s+it\b",
        r"\bpeople\s+are\s+saying\b",
        r"\bsome\s+(?:people|folks)\s+say\b",
        r"\bword\s+on\s+the\s+street\s+is\b",
        r"\bunconfirmed\s+chatter\b",
        r"\bit\s+is\s+whispered\s+that\b"
    ]

    # 5. Subjective Personal State
    SUBJECTIVE_MARKERS = [
        r"\bi\s+(?:am|feel)\s+(?:so\s+)?(?:tired|happy|sad|excited|bored|hungry|exhausted)\b",
        r"\bi\s+(?:love|hate|enjoy|adore)\s+(?:eating|watching|this|that)\b"
    ]

    # Category Keywords
    CATEGORY_KEYWORDS = {
        "politics": [
            "election", "vote", "voter", "ballot", "campaign", "parliament", "congress", "senate",
            "republican", "democrat", "conservative", "liberal", "political", "prime minister",
            "president", "diplomat", "treaty", "sanction", "bipartisan", "caucus", "geopolitics"
        ],
        "government": [
            "government", "regulation", "regulatory", "agency", "federal", "municipal", "white house",
            "supreme court", "court", "judge", "justice", "pentagon", "constitution", "executive order",
            "lawmaker", "legislation", "audit", "bureau", "state department", "ministry"
        ],
        "health": [
            "health", "vaccine", "vaccination", "disease", "virus", "infection", "cancer", "hospital",
            "clinical", "doctor", "medicine", "drug", "fda", "who", "cdc", "treatment", "therapy",
            "pandemic", "outbreak", "patient", "medical", "surgery", "mortality", "nutrition"
        ],
        "science": [
            "science", "scientific", "study", "research", "astronomy", "space", "nasa", "telescope",
            "quantum", "physics", "chemistry", "biology", "dinosaur", "genetic", "dna",
            "asteroid", "galaxy", "laboratory", "discovery", "particle", "planet", "experiment"
        ],
        "technology": [
            "technology", "ai", "artificial intelligence", "tech", "software", "algorithm", "chip",
            "semiconductor", "cybersecurity", "hardware", "computer", "app", "google", "apple",
            "microsoft", "nvidia", "meta", "robot", "robotics", "smartphone", "cloud", "internet",
            "processor", "processors", "qubit", "qubits", "computing"
        ],
        "business": [
            "company", "corporate", "corporation", "ceo", "business", "merger", "acquisition",
            "retail", "firm", "startup", "industry", "partnership", "board of directors",
            "supply chain", "bankruptcy", "enterprise", "commercial", "sales"
        ],
        "finance": [
            "finance", "financial", "inflation", "interest rate", "federal reserve", "central bank",
            "stock", "market", "nasdaq", "dow jones", "gdp", "economy", "economic", "wall street",
            "cryptocurrency", "bitcoin", "deficit", "tax", "banking", "treasury", "revenue", "profit"
        ],
        "education": [
            "education", "school", "university", "college", "student", "teacher", "professor",
            "tuition", "curriculum", "graduation", "degree", "academic", "literacy", "classroom", "campus"
        ],
        "environment": [
            "environment", "environmental", "climate", "climate change", "global warming", "carbon",
            "emission", "emissions", "greenhouse", "fossil", "fossil fuels", "renewable", "solar",
            "wind energy", "deforestation", "pollution", "drought", "flood", "hurricane", "biodiversity",
            "wildfire", "conservation", "ecosystem", "oceans", "metric tons"
        ]
    }

    @classmethod
    def classify_sentence(cls, sentence: str) -> Tuple[str, bool]:
        """
        Classifies sentence into one of:
        - FACTUAL_CLAIM (verifiable: True)
        - OPINION (verifiable: False)
        - PREDICTION (verifiable: False)
        - QUESTION (verifiable: False)
        - UNSUPPORTED_ALLEGATION (verifiable: False)
        - SUBJECTIVE_STATEMENT (verifiable: False)
        """
        text = sentence.strip()
        text_lower = text.lower()

        # Check for Question
        if text.endswith("?") or cls.QUESTION_PATTERN.match(text):
            return "QUESTION", False

        # Check for Unsupported Allegations
        for pattern in cls.ALLEGATION_MARKERS:
            if re.search(pattern, text_lower):
                return "UNSUPPORTED_ALLEGATION", False

        # Check for Opinions
        for pattern in cls.OPINION_MARKERS:
            if re.search(pattern, text_lower):
                return "OPINION", False

        # Check for Predictions
        for pattern in cls.PREDICTION_MARKERS:
            if re.search(pattern, text_lower):
                return "PREDICTION", False

        # Check for Subjective Personal State
        for pattern in cls.SUBJECTIVE_MARKERS:
            if re.search(pattern, text_lower):
                return "SUBJECTIVE_STATEMENT", False

        # If it contains verifiable markers (numbers, past/present declarative verbs, specific entities)
        # and doesn't match subjective patterns, it qualifies as a factual claim
        return "FACTUAL_CLAIM", True

    @classmethod
    def categorize(cls, text: str) -> str:
        text_lower = text.lower()
        words = set(re.findall(r"\b[a-z]+\b", text_lower))

        category_scores = {}
        for cat, keywords in cls.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower or kw in words)
            category_scores[cat] = score

        best_category = max(category_scores, key=category_scores.get)
        if category_scores[best_category] > 0:
            return best_category

        return "general news"

classify_claim = ClaimClassifier.classify_sentence
categorize_claim = ClaimClassifier.categorize
