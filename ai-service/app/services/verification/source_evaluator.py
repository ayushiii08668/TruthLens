import re
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.evidence_schemas import ProcessedEvidenceItem
from app.models.verification_schemas import EvidenceCitation, SourceSummary

class SourceEvaluator:
    @classmethod
    def evaluate_sources(
        cls, claim: str, evidence: List[ProcessedEvidenceItem]
    ) -> Dict[str, Any]:
        supporting: List[EvidenceCitation] = []
        contradicting: List[EvidenceCitation] = []
        neutral: List[EvidenceCitation] = []

        seen_sources: Dict[str, SourceSummary] = {}
        independent_supporting_domains = set()
        independent_contradicting_domains = set()
        outdated_findings = []
        primary_sources_count = 0

        # Current year heuristic for temporal currency checks
        current_year = datetime.now().year

        for item in evidence:
            # Skip completely irrelevant noise
            if item.relevance_score < 0.20:
                continue

            citation = EvidenceCitation(
                title=item.title,
                url=item.url,
                publisher=item.publisher,
                domain=item.domain,
                publication_date=item.publication_date,
                excerpt=item.excerpt,
                stance=item.provisional_stance,
                is_primary_source=item.is_primary_source,
                relevance_score=item.relevance_score,
                syndication_group=item.syndication_group,
                is_syndicated_duplicate=item.is_syndicated_duplicate
            )

            # Check for outdated evidence: if publication date is > 3 years old
            # but claim asserts a current or recent reality
            if item.publication_date:
                year_match = re.search(r"\b(19\d\d|20\d\d)\b", str(item.publication_date))
                if year_match:
                    pub_year = int(year_match.group(1))
                    if current_year - pub_year >= 3 and any(recent_term in claim.lower() for recent_term in ("now", "today", "currently", "latest", "recent", "this year", str(current_year))):
                        outdated_findings.append(
                            f"Source from {item.publisher} was published in {pub_year}, which may not reflect current policy or status."
                        )

            if item.is_primary_source:
                primary_sources_count += 1

            # Track unique source domains and stances
            if item.domain not in seen_sources:
                seen_sources[item.domain] = SourceSummary(
                    name=item.publisher,
                    url=item.url,
                    domain=item.domain,
                    publisher_identity=item.publisher_identity,
                    is_primary_source=item.is_primary_source,
                    document_availability=item.original_document_availability,
                    stance_observed=item.provisional_stance
                )

            # Assign to stance lists and track independent confirmation
            if item.provisional_stance == "SUPPORTS":
                supporting.append(citation)
                if not item.is_syndicated_duplicate:
                    independent_supporting_domains.add(item.domain)
            elif item.provisional_stance == "CONTRADICTS":
                contradicting.append(citation)
                if not item.is_syndicated_duplicate:
                    independent_contradicting_domains.add(item.domain)
            else:
                neutral.append(citation)

        return {
            "supporting_evidence": supporting,
            "contradicting_evidence": contradicting,
            "neutral_evidence": neutral,
            "sources": list(seen_sources.values()),
            "independent_supporting_count": len(independent_supporting_domains),
            "independent_contradicting_count": len(independent_contradicting_domains),
            "primary_sources_count": primary_sources_count,
            "outdated_findings": outdated_findings,
            "total_relevant_items": len(supporting) + len(contradicting) + len(neutral)
        }

evaluate_sources = SourceEvaluator.evaluate_sources

