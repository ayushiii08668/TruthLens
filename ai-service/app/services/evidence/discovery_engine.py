import time
import asyncio
import logging
from typing import List, Tuple

from app.models.evidence_schemas import (
    ProcessedEvidenceItem,
    EvidenceSearchResponse,
    RawEvidenceSnippet
)
from app.services.evidence.query_generator import generate_search_queries
from app.services.evidence.google_fact_check import GoogleFactCheckProvider
from app.services.evidence.web_search import GeneralWebSearchProvider
from app.services.evidence.mock_provider import MockEvidenceProvider
from app.services.evidence.deduplicator import EvidenceDeduplicator
from app.services.evidence.stance_classifier import classify_stance
from app.services.evidence.page_fetcher import fetch_article_text

logger = logging.getLogger("truthlens.evidence.engine")

class EvidenceDiscoveryEngine:
    def __init__(self):
        self.google_provider = GoogleFactCheckProvider()
        self.web_provider = GeneralWebSearchProvider()
        self.mock_provider = MockEvidenceProvider()

    async def search_evidence(
        self, claim: str, max_results: int = 10, include_full_text: bool = False
    ) -> EvidenceSearchResponse:
        start_time = time.time()
        limitations: List[str] = []

        if not claim or not claim.strip():
            return EvidenceSearchResponse(
                claim=claim,
                evidence=[],
                search_status="no_results",
                queries_used=[],
                limitations=["Empty claim provided."],
                retrieval_time_ms=0
            )

        # 1. Generate focused and multi-stance queries
        queries = generate_search_queries(claim)

        # 2. Determine active providers
        active_providers = []
        if self.google_provider.is_available:
            active_providers.append(self.google_provider)
        else:
            limitations.append("Google Fact Check Tools API not configured; search used local/web indices.")

        if self.web_provider.is_available:
            active_providers.append(self.web_provider)

        # Always include mock provider for local development/testing or fallback
        if not active_providers or self.mock_provider.is_available:
            active_providers.append(self.mock_provider)

        # 3. Execute searches concurrently
        raw_snippets: List[RawEvidenceSnippet] = []

        async def run_query(provider, q):
            try:
                return await provider.search(q, max_results=max_results)
            except Exception as e:
                logger.warning("Provider %s failed for query %s: %s", provider.provider_name, q, type(e).__name__)
                return []

        tasks = [run_query(provider, q) for provider in active_providers for q in queries]
        results_lists = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results_lists:
            if isinstance(res, list):
                raw_snippets.extend(res)

        if not raw_snippets:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return EvidenceSearchResponse(
                claim=claim,
                evidence=[],
                search_status="no_results",
                queries_used=queries,
                limitations=limitations + ["No authoritative source documents found matching claim criteria."],
                retrieval_time_ms=elapsed_ms
            )

        # 4. Deduplicate URLs and group syndications
        grouped_results = EvidenceDeduplicator.deduplicate_and_group(raw_snippets)

        # 5. Process evidence items (stance and relevance)
        processed_items: List[ProcessedEvidenceItem] = []
        syndication_seen = False

        for entry in grouped_results[:max_results]:
            item: RawEvidenceSnippet = entry["item"]
            syndication_group = entry["syndication_group"]
            is_syndicated_duplicate = entry["is_syndicated_duplicate"]

            if is_syndicated_duplicate:
                syndication_seen = True

            doc_status = item.document_status
            orig_doc_availability = item.original_document_availability
            full_text = item.full_text
            item_limitations = list(item.access_limitations)

            # Retrieve full text where permitted if requested
            if include_full_text and not full_text:
                fetched_text, fetch_status, fetch_limits = await fetch_article_text(item.url)
                if fetched_text:
                    full_text = fetched_text
                    doc_status = "full_text"
                    orig_doc_availability = "full_text"
                else:
                    doc_status = fetch_status
                    item_limitations.extend(fetch_limits)

            # Evaluate provisional stance and relevance (using full text if available)
            eval_text = f"{item.excerpt} {full_text[:500]}" if full_text else item.excerpt
            stance, relevance = classify_stance(claim, item.title, eval_text)

            processed = ProcessedEvidenceItem(
                title=item.title,
                url=item.url,
                publisher=item.publisher,
                publisher_identity=item.publisher_identity,
                domain=item.domain,
                publication_date=item.publication_date,
                event_date=item.event_date or item.publication_date,
                retrieval_date=item.retrieval_date,
                excerpt=item.excerpt,
                full_text=full_text,
                source_type=item.source_type,
                provisional_stance=stance,
                relevance_score=relevance,
                is_primary_source=item.is_primary_source,
                document_status=doc_status,
                original_document_availability=orig_doc_availability,
                syndication_group=syndication_group,
                is_syndicated_duplicate=is_syndicated_duplicate,
                access_limitations=item_limitations
            )
            processed_items.append(processed)

        if syndication_seen:
            limitations.append("Wire syndication detected: identical wire articles grouped to avoid duplicate weight.")

        elapsed_ms = int((time.time() - start_time) * 1000)
        return EvidenceSearchResponse(
            claim=claim,
            evidence=processed_items,
            search_status="completed" if processed_items else "no_results",
            queries_used=queries,
            limitations=limitations,
            retrieval_time_ms=elapsed_ms
        )

discovery_engine = EvidenceDiscoveryEngine()
search_evidence = discovery_engine.search_evidence

