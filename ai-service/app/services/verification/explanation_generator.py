from typing import List, Dict, Any
from app.models.verification_schemas import VerdictCategory, EvidenceSufficiencyLevel, EvidenceCitation

class ExplanationGenerator:
    @classmethod
    def generate_explanation(
        cls,
        claim: str,
        verdict: VerdictCategory,
        sufficiency: EvidenceSufficiencyLevel,
        confidence: int,
        supporting: List[EvidenceCitation],
        contradicting: List[EvidenceCitation],
        neutral: List[EvidenceCitation],
        limitations: List[str]
    ) -> str:
        paragraphs = []

        # 1. What was claimed
        paragraphs.append(f"**What was claimed:** The submission asserts that \"{claim}\".")

        # 2. What evidence was found & Source overview
        total_sources = len(supporting) + len(contradicting) + len(neutral)
        if total_sources == 0 or verdict == "NOT A FACTUAL CLAIM":
            if verdict == "NOT A FACTUAL CLAIM":
                paragraphs.append(
                    "**Nature of statement:** The statement expresses a subjective value judgment, personal opinion, or speculative prediction rather than an empirical proposition of fact."
                )
                paragraphs.append(
                    "**Why this assessment was selected:** TruthLens strictly avoids evaluating opinions or philosophical stances as 'true' or 'false', classifying them as non-verifiable assertions."
                )
                return "\n\n".join(paragraphs)
            else:
                paragraphs.append(
                    "**Evidence discovered:** A comprehensive query across official registries and news archives yielded no corroborating or contradicting primary records."
                )
                paragraphs.append(
                    "**Why this assessment was selected:** Because evidence is currently insufficient to verify or refute this assertion, the platform assigns a rating of UNVERIFIED in accordance with strict epistemic standards."
                )
                paragraphs.append(
                    "**What cannot currently be established:** Lack of archived documentation prevents establishing whether the stated event occurred as described."
                )
                return "\n\n".join(paragraphs)

        source_names = list(dict.fromkeys([e.publisher for e in (supporting + contradicting + neutral)]))
        source_summary = ", ".join(source_names[:4])
        paragraphs.append(
            f"**Evidence discovered:** Cross-referenced {total_sources} relevant record(s) across authoritative sources including {source_summary}."
        )

        # 3. What supports the claim
        if supporting:
            quotes = [f"\"{e.excerpt.strip()}\" ({e.publisher})" for e in supporting[:2]]
            support_desc = " ".join(quotes)
            paragraphs.append(f"**Supporting Evidence:** Documented records corroborate key elements of the assertion: {support_desc}")
        else:
            paragraphs.append("**Supporting Evidence:** No credible records were discovered supporting this assertion.")

        # 4. What contradicts it
        if contradicting:
            quotes = [f"\"{e.excerpt.strip()}\" ({e.publisher})" for e in contradicting[:2]]
            con_desc = " ".join(quotes)
            paragraphs.append(f"**Contradicting Evidence:** Investigative and official findings directly refute the assertion: {con_desc}")
        elif verdict != "SUPPORTED" and verdict != "MOSTLY SUPPORTED":
            paragraphs.append("**Contradicting Evidence:** No direct counter-evidence was found; however, absence of official corroboration precludes verification.")

        # 5. Missing context or Outdated factors
        if limitations:
            context_notes = " ".join(limitations)
            paragraphs.append(f"**Context and Nuance:** {context_notes}")

        # 6. Why this assessment was selected
        verdict_rationales = {
            "SUPPORTED": f"Direct corroboration from reliable sources ({source_names[0] if source_names else 'primary records'}) confirms the central factual proposition.",
            "MOSTLY SUPPORTED": "The core factual elements are corroborated, though minor caveats or specific qualifications apply to the claim's scope.",
            "MISLEADING": "While the claim may reference real data or events, it strips essential context, exaggerates regulatory scope, or presents outdated statistics as current.",
            "MOSTLY FALSE": "While tangential details may be accurate, the primary assertion is contradicted by verified records.",
            "FALSE": "Authoritative documentation and fact-checking investigations directly disprove the central claim.",
            "UNVERIFIED": "The available evidence is of insufficient volume or certainty to reach a definitive conclusion.",
            "CONFLICTING EVIDENCE": "Reputable, independent sources provide conflicting accounts that cannot currently be reconciled.",
            "NOT A FACTUAL CLAIM": "The statement represents a value judgment or forecast rather than an empirical claim."
        }
        rationale = verdict_rationales.get(verdict, "Evaluated based on available evidence consensus.")
        paragraphs.append(f"**Why '{verdict}' was selected:** {rationale}")

        # 7. What cannot currently be established
        if verdict in ("UNVERIFIED", "CONFLICTING EVIDENCE", "MISLEADING"):
            paragraphs.append("**What cannot currently be established:** Conclusive independent confirmation remains pending further primary documentation or archival release.")

        return "\n\n".join(paragraphs)

generate_explanation = ExplanationGenerator.generate_explanation

