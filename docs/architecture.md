# CityLearn – Fingerprint Engine Architecture

> **Project:** CityLearn — Traffic Institutional Memory System  
> **Tagline:** Cities Forget. CityLearn Remembers.  
> **Philosophy:** Learn → Predict → Recommend → Simulate → Improve

---

## 1. System Overview

```
New Event Input
      │
      ▼
┌─────────────────────────┐
│  CityLearn Fingerprint  │  ← fingerprint_engine.py
│       Engine            │
│  • Clean & validate     │
│  • Build fingerprint    │
│  • Generate embedding   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Similarity Service    │  ← similarity_service.py
│  • Vector index (FAISS) │
│  • Cosine search        │
│  • Top-5 retrieval      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   FastAPI Backend       │  ← main.py  (Member 2)
│  POST /api/fingerprint  │
│  POST /api/similar-events│
│  POST /api/predictions  │
│  POST /api/recommendations│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Next.js Dashboard     │  ← Frontend (Member 3)
└─────────────────────────┘
```

---

## 2. Data Dictionary

All columns come from the traffic events dataset. Importance & weights sourced from feature analysis.

| # | Column | Type | Description | Weight | Missing Strategy | Use |
|---|--------|------|-------------|--------|-----------------|-----|
| 1 | `id` | INT | Unique event identifier | 0.5% | None — primary key | Tracking |
| 2 | `event_type` | STR | Type of event (Accident, Rally, Construction…) | 15% | Mode imputation | Fingerprint, Similarity, Prediction |
| 3 | `latitude` | FLOAT | Start location latitude | 12% | Drop row if null | Fingerprint, Similarity, Prediction |
| 4 | `longitude` | FLOAT | Start location longitude | 12% | Drop row if null | Fingerprint, Similarity, Prediction |
| 5 | `endlatitude` | FLOAT | End location latitude | 5% | Fill with `latitude` | Fingerprint |
| 6 | `endlongitude` | FLOAT | End location longitude | 5% | Fill with `longitude` | Fingerprint |
| 7 | `address` | STR | Human-readable start address | 2% | Fill "Unknown" | Visualization |
| 8 | `end_address` | STR | Human-readable end address | 2% | Fill "Unknown" | Visualization |
| 9 | `event_cause` | STR | Root cause of the event | 5% | Fill "Unknown" | Fingerprint, Recommendation |
| 10 | `requires_road_closure` | BOOL | Whether road closure needed | 10% | Fill False | Fingerprint, Prediction, Recommendation |
| 11 | `start_datetime` | DATETIME | Event start time | 10% | Drop if null | Fingerprint, Prediction |
| 12 | `end_datetime` | DATETIME | Event end time | 5% | Estimate via median duration | Prediction |
| 13 | `status` | STR | Current event status (active/resolved) | 2% | Fill "Unknown" | Dashboard |
| 14 | `authenticated` | BOOL | Whether event is verified | 2% | Fill False | Confidence score |
| 15 | `modified_datetime` | DATETIME | Last modified timestamp | 1% | Not used in ML | Audit |
| 16 | `map_file` | STR | Path to map file | 1% | Fill None | Visualization |
| 17 | `direction` | STR | Traffic direction affected | 4% | Fill "Both" | Fingerprint, Recommendation |
| 18 | `description` | STR | Free-text event description | 2% | Fill "" | NLP embedding |
| 19 | `veh_type` | STR | Vehicle type involved | 4% | Fill "Unknown" | Fingerprint, Prediction |
| 20 | `veh_no` | STR | Vehicle registration number | 0.5% | Not used in ML | Operational |
| 21 | `corridor` | STR | Road corridor name | 7% | Fill "Unknown" | Fingerprint, Similarity, Prediction |
| 22 | `priority` | INT/STR | Event priority level | 6% | Fill median | Fingerprint, Prediction |
| 23 | `cargo_material` | STR | Cargo type if truck involved | 3% | Fill "None" | Recommendation |
| 24 | `reason_breakdown` | STR | Reason for vehicle breakdown | 3% | Fill "Unknown" | Recommendation |
| 25 | `age_of_truck` | FLOAT | Age of truck in years | 1% | Fill median | Prediction |
| 26 | `created_date` | DATETIME | Record creation date | 1% | Not used in ML | Audit |
| 27 | `route_path` | JSON/STR | Road network path (polyline/coords) | 10% | Fill None | Diversion, Recommendation |
| 28 | `client_id` | INT | Source client identifier | 0.5% | Not used in ML | Analytics |
| 29 | `created_by_id` | INT | User who created the record | 0.5% | Not used in ML | Audit |
| 30 | `last_modified_by_id` | INT | User who last modified | 0.5% | Not used in ML | Audit |
| 31 | `assigned_to_police_id` | INT | Officer/unit assigned | 3% | Fill None | Recommendation |
| 32 | `citizen_accident_id` | INT | Linked citizen-reported accident | 1% | Fill None | Tracking |
| 33 | `comment` | STR | Operational comments | 1% | Fill "" | NLP |
| 34 | `police_station` | STR | Nearest police station | 5% | Fill "Unknown" | Fingerprint, Recommendation |
| 35 | `meta_data` | JSON | Additional operational metadata | 2% | Fill {} | Supplemental |
| 36 | `kgid` | STR | Internal geo-identifier | 0.5% | Not used in ML | Internal |
| 37 | `resolved_at_address` | STR | Address where event was cleared | 2% | Fill None | Post-event learning |
| 38 | `resolved_at_latitude` | FLOAT | Latitude of resolution point | 2% | Fill None | Post-event learning |
| 39 | `resolved_at_longitude` | FLOAT | Longitude of resolution point | 2% | Fill None | Post-event learning |
| 40 | `closed_by_id` | INT | User who closed the event | 0.5% | Not used in ML | Audit |
| 41 | `closed_datetime` | DATETIME | When event was closed | 3% | Fill None | Prediction |
| 42 | `resolved_by_id` | INT | User who resolved the event | 0.5% | Not used in ML | Audit |
| 43 | `resolved_datetime` | DATETIME | When event was resolved | 4% | Fill None | Prediction, Learning loop |
| 44 | `gba_identifier` | STR | Geographic/system identifier | 0.5% | Not used in ML | Internal |
| 45 | `zone` | STR | Administrative zone | 3% | Fill "Unknown" | Fingerprint, Similarity |
| 46 | `junction` | STR/BOOL | Whether event is near a junction | 6% | Fill False | Fingerprint, Prediction |

---

## 3. CityLearn Fingerprint Schema

```json
{
  "event_id":            "<int>   — source id",
  "event_type":          "<str>   — e.g. Accident / Concert / Construction",
  "zone":                "<str>   — administrative zone",
  "corridor":            "<str>   — road corridor name",
  "latitude":            "<float> — start lat",
  "longitude":           "<float> — start lon",
  "endlatitude":         "<float> — end lat (defaults to start)",
  "endlongitude":        "<float> — end lon (defaults to start)",
  "requires_road_closure": "<bool>",
  "direction":           "<str>   — e.g. Northbound / Both",
  "event_cause":         "<str>",
  "veh_type":            "<str>",
  "priority":            "<int>   — normalised 1-5",
  "junction":            "<bool>",
  "police_station":      "<str>",
  "start_hour":          "<int>   — 0-23 extracted from start_datetime",
  "day_of_week":         "<int>   — 0=Mon … 6=Sun",
  "is_peak_hour":        "<bool>  — 7-10am or 4-8pm",
  "duration_minutes":    "<float> — end - start",
  "description_text":    "<str>   — combined text for NLP embedding",
  "fingerprint_text":    "<str>   — canonical string for embedding model",
  "embedding":           "[float] — 384-dim sentence-transformer vector"
}
```

---

## 4. Similarity Retrieval Strategy

### Recommended: **Hybrid Approach**

| Strategy | Pros | Cons | Role |
|----------|------|------|------|
| Sentence Transformers (`all-MiniLM-L6-v2`) | Semantic understanding; fast 384-dim | Needs model download | **Primary** — generates fingerprint embeddings |
| FAISS (IVFFlat) | Sub-millisecond ANN search at scale | Approximate | **Primary** — vector index for retrieval |
| TF-IDF | Exact keyword match; zero-dependency | No semantic understanding | **Fallback** — used if ST model unavailable |
| Rule-based boosting | Domain logic (event_type must match) | Hand-crafted | **Post-filter** — re-ranks results |

### Why Hybrid?

Pure embedding search can return "Concert in Zone 1" as similar to "Accident in Zone 1" because location embeddings match. The rule-based post-filter ensures `event_type` similarity is boosted, keeping results operationally meaningful.

---

## 5. Feature Groups

### Fingerprinting Features
`event_type`, `zone`, `corridor`, `latitude`, `longitude`, `requires_road_closure`,
`direction`, `event_cause`, `veh_type`, `priority`, `junction`, `police_station`,
`start_hour`, `day_of_week`, `is_peak_hour`

### Similarity Search Features  
`fingerprint_text` → embedding → FAISS cosine search

### Impact Prediction Features
`event_type`, `latitude`, `longitude`, `requires_road_closure`, `start_datetime` (hour/day),
`corridor`, `junction`, `priority`, `veh_type`, `event_cause`, `direction`

### Recommendation Generation
`requires_road_closure`, `route_path`, `event_type`, `corridor`, `junction`,
`direction`, `police_station`, `assigned_to_police_id`, `priority`

---

## 6. FastAPI Integration Points

```
POST /api/fingerprint          → fingerprint_engine.py :: build_fingerprint()
POST /api/similar-events       → similarity_service.py :: find_similar_events()
POST /api/predictions          → prediction_service.py (Member 1 ML)
POST /api/recommendations      → recommendation_service.py (Member 2 rule engine)
POST /api/learning             → learning_loop.py (post-event update)
```

---

## 7. File Structure

```
citylearn/
├── core/
│   ├── fingerprint_engine.py   ← This file: cleaning + fingerprint
│   ├── similarity_service.py   ← This file: embedding + FAISS search
│   ├── prediction_service.py   ← Member 1 (ML models)
│   └── embedding_service.py    ← Member 1 (model loading)
├── api/
│   ├── main.py                 ← Member 2 (FastAPI app)
│   ├── routes/
│   └── models/
├── db/
│   ├── database.py             ← Member 2 (PostgreSQL)
│   └── schemas.py
├── shared/
│   └── types.py                ← Shared Pydantic models
├── docs/
│   ├── architecture.md         ← This file
│   └── API_CONTRACT.md
└── data/
    └── raw/
```
