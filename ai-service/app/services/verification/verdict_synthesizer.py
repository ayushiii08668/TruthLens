import re
from typing import Dict, Any, Tuple, List
from app.models.verification_schemas import VerdictCategory, EvidenceSufficiencyLevel

class VerdictSynthesizer:
    @classmethod
    def calculate_sufficiency(
        cls, independent_supporting: int, independent_contradicting: int, 
        neutral_count: int, primary_count: int, total_items: int
    ) -> EvidenceSufficiencyLevel:
        total_independent = independent_supporting + independent_contradicting

        if total_items == 0 or (total_independent == 0 and neutral_count == 0):
            return "Insufficient"

        if primary_count >= 2 or total_independent >= 3:
            return "Strong"

        if primary_count >= 1 or total_independent >= 2 or (total_independent >= 1 and neutral_count >= 2):
            return "Moderate"

        if total_independent == 1 or neutral_count >= 1:
            return "Limited"

        return "Insufficient"

    @classmethod
    def calculate_confidence(
        cls, sufficiency: EvidenceSufficiencyLevel, primary_count: int, 
        stance_consensus: float, total_independent: int
    ) -> int:
        base_scores = {
            "Insufficient": 25,
            "Limited": 55,
            "Moderate": 75,
            "Strong": 90
        }
        score = base_scores.get(sufficiency, 30)

        # Quality adjustments
        if primary_count > 0:
            score += min(6, primary_count * 3)

        if stance_consensus > 0.85 and total_independent >= 2:
            score += 4
        elif stance_consensus < 0.60:
            score -= 10

        # Cap between 15 and 96 (never claim 100% certainty)
        return max(15, min(96, score))

    @classmethod
    def synthesize_verdict(
        cls,
        claim: str,
        evaluation: Dict[str, Any],
        is_opinion_or_prediction: bool = False,
        statement_type: str = "FACTUAL_CLAIM"
    ) -> Tuple[VerdictCategory, EvidenceSufficiencyLevel, int, List[str]]:
        limitations: List[str] = []

        # 1. Non-Factual Claim Check
        if is_opinion_or_prediction or statement_type in ("OPINION", "PREDICTION", "QUESTION", "SUBJECTIVE_STATEMENT"):
            limitations.append("The input expresses a subjective viewpoint, prediction, or opinion rather than a testable factual claim.")
            return "NOT A FACTUAL CLAIM", "Insufficient", 92, limitations

        ind_sup = evaluation["independent_supporting_count"]
        ind_con = evaluation["independent_contradicting_count"]
        neutral_count = len(evaluation["neutral_evidence"])
        primary_count = evaluation["primary_sources_count"]
        total_relevant = evaluation["total_relevant_items"]
        outdated_findings = evaluation["outdated_findings"]

        # Calculate evidence sufficiency
        sufficiency = cls.calculate_sufficiency(
            independent_supporting=ind_sup,
            independent_contradicting=ind_con,
            neutral_count=neutral_count,
            primary_count=primary_count,
            total_items=total_relevant
        )

        # 2. Insufficient Evidence -> UNVERIFIED
        if sufficiency == "Insufficient" or (ind_sup == 0 and ind_con == 0 and neutral_count == 0):
            limitations.append("Current evidence is insufficient to confirm or refute the assertion.")
            limitations.append("Absence of evidence does not constitute evidence of falsity.")
            return "UNVERIFIED", "Insufficient", 28, limitations

        # 3. Check for Outdated Information presented as current
        if outdated_findings:
            limitations.extend(outdated_findings)
            limitations.append("The factual status appears to rely on historical reporting that has been superseded or requires temporal qualification.")
            confidence = cls.calculate_confidence(sufficiency, primary_count, 0.70, ind_sup + ind_con)
            return "MISLEADING", sufficiency, confidence, limitations

        # 4. Check for Conflicting Evidence between credible sources
        if ind_sup >= 1 and ind_con >= 1:
            limitations.append("Independent credible reporting presents conflicting accounts of the event.")
            confidence = cls.calculate_confidence(sufficiency, primary_count, 0.50, ind_sup + ind_con)
            return "CONFLICTING EVIDENCE", sufficiency, confidence, limitations

        # Stance consensus ratio
        total_decisive = ind_sup + ind_con
        stance_consensus = max(ind_sup, ind_con) / total_decisive if total_decisive > 0 else 0.5
        confidence = cls.calculate_confidence(sufficiency, primary_count, stance_consensus, total_decisive)

        # 5. Contradicted claims (False vs. Mostly False vs. Misleading)
        if ind_con > 0 and ind_sup == 0:
            # Check if there is selective context that makes it misleading rather than completely false
            # E.g. headline says "Gas tax raised by 40%" when only a 4% diesel surcharge was discussed
            claim_lower = claim.lower()
            excerpts_text = " ".join(e.excerpt.lower() for e in evaluation["contradicting_evidence"])

            if any(term in claim_lower for term in ("secretly", "banned everywhere", "abolished")) and any(term in excerpts_text for term in ("clarified", "distorted", "misrepresented")):
                limitations.append("The statement exaggerates or misrepresents factual regulatory decisions.")
                return "MISLEADING", sufficiency, confidence, limitations

            # If fact-check or primary documentation explicitly debunks central assertion
            if primary_count >= 1 or any(e.relevance_score >= 0.75 for e in evaluation["contradicting_evidence"]):
                return "FALSE", sufficiency, confidence, limitations

            return "MOSTLY FALSE", sufficiency, confidence, limitations

        # 6. Supported claims (Supported vs. Mostly Supported vs. Misleading)
        if ind_sup > 0 and ind_con == 0:
            # Check for partial support / nuance requirements
            # If the claim contains broad absolute quantifiers ("completely", "all", "unanimous")
            # but evidence shows qualified adoption
            claim_words = claim.lower().split()
            excerpts_text = " ".join(e.excerpt.lower() for e in evaluation["supporting_evidence"])

            needs_qualification = False
            if any(q in claim_words for q in ("all", "everyone", "unanimously", "everywhere")):
                needs_qualification = True
                limitations.append("The main assertion is supported, but universal or absolute qualifiers in the claim exceed documented evidence.")

            # Check for misleading framing (truth used out of context)
            if any(term in claim.lower() for term in ("shocking", "crisis", "disaster")) and not any(term in excerpts_text for term in ("crisis", "disaster")):
                limitations.append("The factual premise is accurate, but the headline or framing introduces sensationalized context.")
                return "MISLEADING", sufficiency, confidence, limitations

            if needs_qualification or sufficiency == "Limited":
                return "MOSTLY SUPPORTED", sufficiency, confidence, limitations

            return "SUPPORTED", sufficiency, confidence, limitations

        # 7. Only neutral / contextual evidence found
        if ind_sup == 0 and ind_con == 0 and neutral_count > 0:
            limitations.append("Available documentation provides contextual background without directly confirming or refuting the core claim.")
            return "UNVERIFIED", sufficiency, 35, limitations

        # Fallback
        return "UNVERIFIED", sufficiency, 30, limitations

synthesize_verdict = VerdictSynthesizer.synthesize_verdict

