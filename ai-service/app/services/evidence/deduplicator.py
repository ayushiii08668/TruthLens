import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from typing import List, Dict, Set, Any
from app.models.evidence_schemas import RawEvidenceSnippet, ProcessedEvidenceItem

class EvidenceDeduplicator:
    TRACKING_PARAMS = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "ref", "source", "ocid"
    }

    @classmethod
    def normalize_url(cls, raw_url: str) -> str:
        if not raw_url:
            return ""

        try:
            parsed = urlparse(raw_url.strip())
            clean_host = parsed.netloc.lower().replace("www.", "")

            # Filter out tracking query params
            filtered_query = [
                (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=False)
                if k.lower() not in cls.TRACKING_PARAMS
            ]
            clean_query = urlencode(sorted(filtered_query))

            # Strip trailing slash from path
            clean_path = parsed.path.rstrip("/")

            normalized = urlunparse((
                parsed.scheme.lower() or "https",
                clean_host,
                clean_path,
                "", # params
                clean_query,
                ""  # fragment
            ))
            return normalized
        except Exception:
            return raw_url.strip()

    @classmethod
    def compute_fingerprint(cls, text: str) -> Set[str]:
        words = re.findall(r"\b[a-z]{3,}\b", text.lower())
        return set(words)

    @classmethod
    def deduplicate_and_group(
        cls, raw_items: List[RawEvidenceSnippet]
    ) -> List[Dict[str, Any]]:
        unique_urls: Set[str] = set()
        deduped_raw: List[RawEvidenceSnippet] = []

        # 1. URL Deduplication
        for item in raw_items:
            canonical_url = cls.normalize_url(item.url)
            if canonical_url in unique_urls:
                continue
            unique_urls.add(canonical_url)
            item.url = canonical_url
            deduped_raw.append(item)

        # 2. Syndication Grouping (Detect reprints across publishers)
        processed: List[Dict[str, Any]] = []
        syndication_groups: Dict[int, Set[str]] = {}
        group_counter = 1

        for i, item in enumerate(deduped_raw):
            item_fp = cls.compute_fingerprint(f"{item.title} {item.excerpt}")
            assigned_group = None
            is_duplicate = False

            # Check overlap against previous items
            for prev_idx, prev_dict in enumerate(processed):
                prev_fp = prev_dict["_fingerprint"]
                if not item_fp or not prev_fp:
                    continue

                intersection = len(item_fp.intersection(prev_fp))
                smaller_set = min(len(item_fp), len(prev_fp))
                similarity = intersection / smaller_set if smaller_set > 0 else 0

                # High overlap indicates wire syndication (e.g. AP/Reuters wire reprint)
                if similarity >= 0.70:
                    if prev_dict["syndication_group"] is None:
                        group_name = f"wire_group_{group_counter}"
                        prev_dict["syndication_group"] = group_name
                        group_counter += 1

                    assigned_group = prev_dict["syndication_group"]
                    is_duplicate = True
                    break

            processed.append({
                "item": item,
                "syndication_group": assigned_group,
                "is_syndicated_duplicate": is_duplicate,
                "_fingerprint": item_fp
            })

        return processed
