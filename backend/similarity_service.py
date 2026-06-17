"""
CityLearn – Similarity Service
================================
Responsible for:
  1. Loading the Sentence Transformer model (all-MiniLM-L6-v2)
  2. Generating 384-dim embeddings from fingerprint_text
  3. Building and persisting a FAISS index over historical fingerprints
  4. Retrieving the Top-5 most similar historical events for any new event
  5. Rule-based re-ranking (boosts same event_type matches)
  6. TF-IDF fallback if the ST model is unavailable

FastAPI integration:
  from core.similarity_service import SimilarityService
  svc = SimilarityService()
  svc.build_index(fingerprints)
  results = svc.find_similar_events(new_fingerprint, top_k=5)

Author : CityLearn – Data & Intelligence Module (Member 1)
"""

from __future__ import annotations

import json
import logging
import os
import pickle
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

# ── Optional heavy deps — graceful degradation if not installed ───────────
try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False

try:
    import faiss
    _FAISS_AVAILABLE = True
except ImportError:
    _FAISS_AVAILABLE = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity as sk_cosine
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False

logger = logging.getLogger("citylearn.similarity_service")

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_MODEL_NAME   = "all-MiniLM-L6-v2"   # 384-dim, fast, good quality
EMBEDDING_DIM        = 384
DEFAULT_TOP_K        = 5
DEFAULT_INDEX_PATH   = "data/faiss_index.bin"
DEFAULT_STORE_PATH   = "data/fingerprint_store.pkl"

# Re-ranking boost: applied when event_type matches between query and candidate
SAME_EVENT_TYPE_BOOST = 0.08   # adds 8 points to similarity score (0–100 scale)
SAME_ZONE_BOOST       = 0.03
SAME_CORRIDOR_BOOST   = 0.03
ROAD_CLOSURE_BOOST    = 0.04   # both require closure or both don't


# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimilarEventResult:
    """
    Output structure for a single similar-event match.
    Matches the API_CONTRACT.md spec exactly so Member 2 / Member 3 can
    wire in without any field-name surprises.
    """
    historical_event_id: int
    similarity_score:    float           # 0.0 – 100.0
    event_type:          str
    zone:                str
    corridor:            str
    requires_road_closure: bool
    resolution_time:     Optional[float] # minutes; None if unknown
    is_peak_hour:        bool
    day_of_week:         int
    priority:            int
    police_station:      str
    fingerprint_text:    str             # for display / debugging


@dataclass
class SimilarEventsResponse:
    """
    Top-level API response for the /api/similar-events endpoint.
    """
    event_id:      int
    similar_events: List[SimilarEventResult]
    retrieval_strategy: str              # "sentence_transformer" | "tfidf" | "hybrid"
    retrieval_time_ms:  float


# ─────────────────────────────────────────────────────────────────────────────
# Similarity Service
# ─────────────────────────────────────────────────────────────────────────────

class SimilarityService:
    """
    CityLearn Similarity Service.

    Lifecycle
    ─────────
    1.  Instantiate once at app startup.
    2.  Call `build_index(fingerprints)` with all historical fingerprints.
        (Or `load_index()` to restore a previously saved index.)
    3.  Call `find_similar_events(fingerprint)` per incoming event.

    Thread safety
    ─────────────
    FAISS is thread-safe for reads.  Writes (add_fingerprint) should be
    serialised externally (e.g. via an asyncio.Lock in the FastAPI app).
    """

    def __init__(
        self,
        model_name:  str = DEFAULT_MODEL_NAME,
        index_path:  str = DEFAULT_INDEX_PATH,
        store_path:  str = DEFAULT_STORE_PATH,
    ) -> None:
        self.model_name  = model_name
        self.index_path  = index_path
        self.store_path  = store_path

        # Loaded lazily
        self._model:   Optional[Any]  = None   # SentenceTransformer
        self._index:   Optional[Any]  = None   # faiss.Index
        self._tfidf:   Optional[Any]  = None   # TfidfVectorizer
        self._tfidf_matrix: Optional[Any] = None

        # Master store: list of fingerprint dicts (parallel to FAISS index)
        self._fingerprints: List[Dict[str, Any]] = []

        # Determine retrieval strategy at init time
        self._strategy = self._resolve_strategy()
        logger.info("SimilarityService initialised — strategy: %s", self._strategy)

    # ── Strategy resolution ───────────────────────────────────────────────

    def _resolve_strategy(self) -> str:
        if _ST_AVAILABLE and _FAISS_AVAILABLE:
            return "hybrid"          # ST embeddings + FAISS + rule re-rank
        if _ST_AVAILABLE:
            return "sentence_transformer"   # ST embeddings + numpy cosine
        if _SKLEARN_AVAILABLE:
            return "tfidf"
        raise EnvironmentError(
            "No similarity backend available. "
            "Install: sentence-transformers faiss-cpu  (or scikit-learn as fallback)"
        )

    # ── Model loading ─────────────────────────────────────────────────────

    def _load_model(self) -> None:
        """Lazy-load the Sentence Transformer model."""
        if self._model is not None:
            return
        if not _ST_AVAILABLE:
            logger.warning("sentence-transformers not installed; using TF-IDF fallback")
            return
        logger.info("Loading Sentence Transformer: %s", self.model_name)
        self._model = SentenceTransformer(self.model_name)
        logger.info("Model loaded ✓")

    # ── Embedding generation ──────────────────────────────────────────────

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of fingerprint_text strings.

        Returns
        -------
        np.ndarray  shape (N, EMBEDDING_DIM)  dtype float32
        """
        self._load_model()

        if self._model is not None:
            embeddings = self._model.encode(
                texts,
                batch_size=64,
                show_progress_bar=(len(texts) > 200),
                normalize_embeddings=True,   # L2-norm → cosine = dot product
                convert_to_numpy=True,
            )
            return embeddings.astype(np.float32)

        # TF-IDF fallback: return dense matrix
        logger.warning("Falling back to TF-IDF embeddings")
        if self._tfidf is None:
            self._tfidf = TfidfVectorizer(max_features=2048, ngram_range=(1, 2))
            mat = self._tfidf.fit_transform(texts)
        else:
            mat = self._tfidf.transform(texts)
        # Convert sparse → dense float32
        return np.asarray(mat.todense(), dtype=np.float32)

    def embed_single(self, text: str) -> np.ndarray:
        """Embed one text string. Returns shape (1, dim)."""
        return self.embed_texts([text])

    # ── Index construction ────────────────────────────────────────────────

    def build_index(self, fingerprints: List[Dict[str, Any]]) -> None:
        """
        Build (or rebuild) the FAISS index from a list of fingerprints.

        Embeddings are generated if missing (fingerprint["embedding"] is None).
        The index and fingerprint store are saved to disk for persistence.

        Parameters
        ----------
        fingerprints : list[dict]
            Output of fingerprint_engine.build_fingerprints_from_df().
        """
        if not fingerprints:
            raise ValueError("fingerprints list is empty — nothing to index")

        logger.info("Building index for %d events …", len(fingerprints))
        t0 = time.perf_counter()

        # ── Generate / extract embeddings ─────────────────────────────
        texts = [fp["fingerprint_text"] for fp in fingerprints]
        embeddings = self.embed_texts(texts)   # (N, dim)

        # Write embeddings back into fingerprint dicts
        for fp, emb in zip(fingerprints, embeddings):
            fp["embedding"] = emb.tolist()

        self._fingerprints = fingerprints
        dim = embeddings.shape[1]

        # ── Build FAISS index ─────────────────────────────────────────
        if _FAISS_AVAILABLE:
            # IndexFlatIP: inner product on L2-normalised vectors = cosine sim
            # Use IVFFlat for larger datasets (>50k events)
            if len(fingerprints) > 50_000:
                n_lists = min(int(len(fingerprints) ** 0.5), 4096)
                quantiser = faiss.IndexFlatIP(dim)
                self._index = faiss.IndexIVFFlat(quantiser, dim, n_lists, faiss.METRIC_INNER_PRODUCT)
                self._index.train(embeddings)
                logger.info("Trained IVFFlat index with %d lists", n_lists)
            else:
                self._index = faiss.IndexFlatIP(dim)

            self._index.add(embeddings)
            logger.info("FAISS index built — %d vectors", self._index.ntotal)
        else:
            # Fallback: keep raw embeddings as numpy array for brute-force cosine
            self._raw_embeddings = embeddings
            logger.warning("FAISS not installed — brute-force cosine will be used")

        # ── TF-IDF side-index (always built for hybrid mode) ──────────
        if _SKLEARN_AVAILABLE:
            self._tfidf = TfidfVectorizer(max_features=2048, ngram_range=(1, 2))
            self._tfidf_matrix = self._tfidf.fit_transform(texts)
            logger.info("TF-IDF index built")

        elapsed = (time.perf_counter() - t0) * 1000
        logger.info("Index build complete in %.1f ms", elapsed)

        # ── Persist to disk ───────────────────────────────────────────
        self._save_index()

    def _save_index(self) -> None:
        """Persist FAISS index + fingerprint store to disk."""
        os.makedirs(os.path.dirname(self.index_path) or ".", exist_ok=True)
        if _FAISS_AVAILABLE and self._index is not None:
            faiss.write_index(self._index, self.index_path)
            logger.info("FAISS index saved → %s", self.index_path)
        with open(self.store_path, "wb") as f:
            pickle.dump(self._fingerprints, f)
        logger.info("Fingerprint store saved → %s", self.store_path)

    def load_index(self) -> None:
        """Restore a previously saved FAISS index and fingerprint store."""
        if not Path(self.store_path).exists():
            raise FileNotFoundError(f"No fingerprint store at {self.store_path}")
        with open(self.store_path, "rb") as f:
            self._fingerprints = pickle.load(f)
        logger.info("Loaded %d fingerprints from store", len(self._fingerprints))

        if _FAISS_AVAILABLE and Path(self.index_path).exists():
            self._index = faiss.read_index(self.index_path)
            logger.info("FAISS index loaded — %d vectors", self._index.ntotal)
        else:
            # Rebuild numpy matrix for brute-force
            embs = [fp["embedding"] for fp in self._fingerprints if fp.get("embedding")]
            self._raw_embeddings = np.array(embs, dtype=np.float32)

        # Rebuild TF-IDF
        if _SKLEARN_AVAILABLE:
            texts = [fp["fingerprint_text"] for fp in self._fingerprints]
            self._tfidf = TfidfVectorizer(max_features=2048, ngram_range=(1, 2))
            self._tfidf_matrix = self._tfidf.fit_transform(texts)

    # ── Retrieval ─────────────────────────────────────────────────────────

    def find_similar_events(
        self,
        query_fingerprint: Dict[str, Any],
        top_k: int = DEFAULT_TOP_K,
    ) -> SimilarEventsResponse:
        """
        Retrieve the Top-K most similar historical events.

        Algorithm
        ─────────
        1.  Embed the query fingerprint_text.
        2.  Search the FAISS index (or brute-force cosine).
        3.  Optionally fuse with TF-IDF scores (hybrid).
        4.  Apply rule-based re-ranking (event_type / zone / closure boosts).
        5.  Return top_k results as SimilarEventsResponse.

        Parameters
        ----------
        query_fingerprint : dict
            Output of fingerprint_engine.build_fingerprint() or
            fingerprint_engine.fingerprint_from_api_payload().

        top_k : int
            Number of results to return (default 5).

        Returns
        -------
        SimilarEventsResponse
        """
        if not self._fingerprints:
            raise RuntimeError("Index not built — call build_index() or load_index() first")

        t0 = time.perf_counter()

        query_text = query_fingerprint["fingerprint_text"]
        query_emb  = self.embed_single(query_text)   # (1, dim)

        # ── Step 1: Vector search ─────────────────────────────────────
        # Fetch more candidates than top_k to allow re-ranking
        fetch_k = min(top_k * 4, len(self._fingerprints))

        vector_scores, candidate_indices = self._vector_search(query_emb, fetch_k)

        # ── Step 2: TF-IDF fusion (hybrid only) ───────────────────────
        if self._strategy == "hybrid" and self._tfidf is not None:
            tfidf_scores = self._tfidf_search(query_text, candidate_indices)
            # Weighted combination: 80% vector + 20% TF-IDF
            fused_scores = 0.80 * vector_scores + 0.20 * tfidf_scores
        else:
            fused_scores = vector_scores

        # ── Step 3: Rule-based re-ranking ─────────────────────────────
        final_scores = self._rerank(
            query_fingerprint,
            candidate_indices,
            fused_scores,
        )

        # ── Step 4: Sort and slice ────────────────────────────────────
        ranked = sorted(zip(candidate_indices, final_scores), key=lambda x: -x[1])
        top_candidates = ranked[:top_k]

        # ── Step 5: Build response objects ───────────────────────────
        results: List[SimilarEventResult] = []
        for idx, score in top_candidates:
            fp = self._fingerprints[idx]
            result = SimilarEventResult(
                historical_event_id   = fp.get("event_id", -1),
                similarity_score      = round(float(score) * 100, 2),   # 0–100
                event_type            = fp.get("event_type", "Unknown"),
                zone                  = fp.get("zone", "Unknown"),
                corridor              = fp.get("corridor", "Unknown"),
                requires_road_closure = bool(fp.get("requires_road_closure", False)),
                resolution_time       = fp.get("duration_minutes"),
                is_peak_hour          = bool(fp.get("is_peak_hour", False)),
                day_of_week           = int(fp.get("day_of_week", -1)),
                priority              = int(fp.get("priority", 2)),
                police_station        = fp.get("police_station", "Unknown"),
                fingerprint_text      = fp.get("fingerprint_text", ""),
            )
            results.append(result)

        elapsed_ms = (time.perf_counter() - t0) * 1000

        return SimilarEventsResponse(
            event_id            = int(query_fingerprint.get("event_id", -1)),
            similar_events      = results,
            retrieval_strategy  = self._strategy,
            retrieval_time_ms   = round(elapsed_ms, 2),
        )

    def _vector_search(
        self,
        query_emb: np.ndarray,   # shape (1, dim)
        fetch_k: int,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Run vector search.  Returns (scores, indices) arrays of length fetch_k.
        """
        if _FAISS_AVAILABLE and self._index is not None:
            scores, indices = self._index.search(query_emb, fetch_k)
            # FAISS returns shape (1, k) — flatten
            return scores[0].astype(np.float32), indices[0]

        # Brute-force cosine (numpy)
        raw = getattr(self, "_raw_embeddings", None)
        if raw is None:
            raw = np.array(
                [fp["embedding"] for fp in self._fingerprints],
                dtype=np.float32,
            )
            self._raw_embeddings = raw

        # Cosine similarity: query already L2-normalised
        sims = (raw @ query_emb.T).flatten()   # (N,)
        top_indices = np.argpartition(sims, -fetch_k)[-fetch_k:]
        top_indices = top_indices[np.argsort(-sims[top_indices])]
        return sims[top_indices], top_indices

    def _tfidf_search(
        self,
        query_text: str,
        candidate_indices: np.ndarray,
    ) -> np.ndarray:
        """
        Compute TF-IDF cosine similarity for the candidate indices only.
        Returns array of shape (len(candidate_indices),).
        """
        if self._tfidf is None or self._tfidf_matrix is None:
            return np.zeros(len(candidate_indices), dtype=np.float32)

        q_vec = self._tfidf.transform([query_text])
        candidate_matrix = self._tfidf_matrix[candidate_indices]
        sims = sk_cosine(q_vec, candidate_matrix).flatten()
        return sims.astype(np.float32)

    def _rerank(
        self,
        query: Dict[str, Any],
        indices: np.ndarray,
        scores: np.ndarray,
    ) -> np.ndarray:
        """
        Apply domain-aware boosts to raw similarity scores.

        Boosts (additive, applied before final sort):
          +0.08  same event_type
          +0.03  same zone
          +0.03  same corridor
          +0.04  road closure status matches
        """
        boosted = scores.copy()
        q_event_type = query.get("event_type", "")
        q_zone       = query.get("zone", "")
        q_corridor   = query.get("corridor", "")
        q_closure    = bool(query.get("requires_road_closure", False))

        for i, idx in enumerate(indices):
            fp = self._fingerprints[idx]
            if fp.get("event_type", "") == q_event_type:
                boosted[i] += SAME_EVENT_TYPE_BOOST
            if fp.get("zone", "") == q_zone:
                boosted[i] += SAME_ZONE_BOOST
            if fp.get("corridor", "") == q_corridor:
                boosted[i] += SAME_CORRIDOR_BOOST
            if bool(fp.get("requires_road_closure", False)) == q_closure:
                boosted[i] += ROAD_CLOSURE_BOOST

        # Clip to max 1.0 (100%)
        return np.clip(boosted, 0.0, 1.0)

    # ── Online learning: add a single new event ───────────────────────────

    def add_fingerprint(self, fingerprint: Dict[str, Any]) -> None:
        """
        Add one new event to the index (post-event learning loop).

        Parameters
        ----------
        fingerprint : dict
            Must contain fingerprint_text.
            embedding is generated if missing.
        """
        text = fingerprint["fingerprint_text"]
        emb  = self.embed_single(text)   # (1, dim)
        fingerprint["embedding"] = emb[0].tolist()

        self._fingerprints.append(fingerprint)

        if _FAISS_AVAILABLE and self._index is not None:
            self._index.add(emb)
        else:
            existing = getattr(self, "_raw_embeddings", np.empty((0, emb.shape[1]), dtype=np.float32))
            self._raw_embeddings = np.vstack([existing, emb])

        # Update TF-IDF (full retrain — acceptable for incremental adds)
        if _SKLEARN_AVAILABLE and self._tfidf is not None:
            all_texts = [fp["fingerprint_text"] for fp in self._fingerprints]
            self._tfidf_matrix = self._tfidf.fit_transform(all_texts)

        logger.info(
            "Added event_id=%s to index — total: %d",
            fingerprint.get("event_id"), len(self._fingerprints),
        )

    # ── Utility ───────────────────────────────────────────────────────────

    def index_size(self) -> int:
        """Return number of events currently indexed."""
        return len(self._fingerprints)

    def get_strategy(self) -> str:
        return self._strategy

    def response_to_dict(self, response: SimilarEventsResponse) -> Dict[str, Any]:
        """
        Serialise a SimilarEventsResponse to a plain dict for JSON output.
        Matches the API_CONTRACT.md format exactly.
        """
        return {
            "event_id": response.event_id,
            "retrieval_strategy": response.retrieval_strategy,
            "retrieval_time_ms": response.retrieval_time_ms,
            "similar_events": [
                {
                    "historical_event_id":   r.historical_event_id,
                    "similarity_score":      r.similarity_score,
                    "event_type":            r.event_type,
                    "zone":                  r.zone,
                    "corridor":              r.corridor,
                    "requires_road_closure": r.requires_road_closure,
                    "resolution_time":       r.resolution_time,
                    "is_peak_hour":          r.is_peak_hour,
                    "day_of_week":           r.day_of_week,
                    "priority":              r.priority,
                    "police_station":        r.police_station,
                    "fingerprint_text":      r.fingerprint_text,
                }
                for r in response.similar_events
            ],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Module-level singleton (imported by FastAPI app)
# ─────────────────────────────────────────────────────────────────────────────

_service_singleton: Optional[SimilarityService] = None


def get_similarity_service() -> SimilarityService:
    """
    Return the module-level SimilarityService singleton.

    Usage in FastAPI:
        from core.similarity_service import get_similarity_service
        svc = get_similarity_service()

    Call `svc.build_index(fingerprints)` once at startup (in main.py lifespan).
    """
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = SimilarityService()
    return _service_singleton


# ─────────────────────────────────────────────────────────────────────────────
# CLI smoke-test
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from fingerprint_engine import load_and_prepare_dataset

    if len(sys.argv) < 2:
        print("Usage: python similarity_service.py <dataset_path>")
        sys.exit(1)

    _path = sys.argv[1]
    print(f"\n[1/4] Loading and preparing dataset from {_path} …")
    _df, _fps = load_and_prepare_dataset(_path)
    print(f"      {len(_fps)} fingerprints ready")

    print("\n[2/4] Building similarity index …")
    svc = SimilarityService()
    svc.build_index(_fps)
    print(f"      Index size: {svc.index_size()}  strategy: {svc.get_strategy()}")

    print("\n[3/4] Running sample query (first event) …")
    query_fp = _fps[0]
    response  = svc.find_similar_events(query_fp, top_k=5)

    print(f"\n[4/4] Top-5 Similar Events for event_id={query_fp['event_id']}")
    print(f"      Strategy : {response.retrieval_strategy}")
    print(f"      Time     : {response.retrieval_time_ms:.1f} ms\n")
    for i, r in enumerate(response.similar_events, 1):
        print(
            f"  #{i}  id={r.historical_event_id:<6}  "
            f"score={r.similarity_score:5.1f}%  "
            f"type={r.event_type:<20}  "
            f"zone={r.zone:<12}  "
            f"res_time={r.resolution_time}"
        )
