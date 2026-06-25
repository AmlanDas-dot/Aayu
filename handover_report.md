# AAYU Healthcare Assistant — Technical Handover Report

This document serves as a comprehensive technical handover report for senior developers taking over the AAYU healthcare assistant codebase. AAYU is a privacy-first, local-first multilingual healthcare assistant optimized for running on low-resource hardware (e.g., consumer GPUs with 6GB VRAM) and offline/rural environments.

---

## 1. Project Overview

### Purpose of the Application
AAYU is designed to act as an accessible healthcare assistant for rural populations. It allows users to describe symptoms in their native tongue via voice or text, runs deterministic triage algorithms to assess risk levels, retrieves localized health information, matches queries with relevant government social security schemes, suggests disease-specific nutrition guidelines, and helps locate physical healthcare facilities nearby.

### Core User Workflows
1. **Multilingual Voice/Text Chat**: Users speak or type queries in English, Hindi, Gujarati, or Odia. Audio is transcribed via a local speech-to-text pipeline, translated to English, assessed for clinical emergency markers, routed through a RAG pipeline to retrieve local medical documents, triaged, and answered using a hybrid model approach. Finally, the response is translated back and read out loud.
2. **Healthcare Facility Locator**: Users find nearby hospitals, clinics, primary health centres (PHCs), and pharmacies using their device GPS coordinates.
3. **Government Scheme Discovery**: Users search for local and national health welfare schemes (e.g., Ayushman Bharat, BSKY, Mamata) based on eligibility parameters.
4. **Localized Nutrition Advisory**: Users check appropriate diet recommendations and foods to avoid based on specific conditions or diseases.

```
                  ┌──────────────────────────────────────────────┐
                  │           AAYU Client (React App)            │
                  └───────────────┬──────────────┬───────────────┘
                                  │              │
                   /transcribe &  │              │ /hospitals/nearby,
                   /chat requests │              │ /nutrition, /schemes
                                  ▼              ▼
                  ┌──────────────────────────────────────────────┐
                  │            FastAPI Backend Server            │
                  └───────────────┬──────────────────────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌───────────┐               ┌───────────┐               ┌───────────┐
│  Whisper  │               │IndicTrans2│               │ ChromaDB  │
│  STT GPU  │               │Trans GPU  │               │Vector CPU │
└───────────┘               └───────────┘               └───────────┘
```

### Frontend Framework & Structure
* **Core Stack**: React 19, Vite, TypeScript, and Vanilla CSS variables (arranged under custom stylesheets like `aayu-home.css`, `aayu-pages.css`, and `style.css`).
* **Routing**: Managed client-side via `react-router-dom` (v7).
* **Grid Shell**: Governed by the `AppShell.tsx` component which wraps the sidebar navigation, header, status indicators, and main viewports.

### Backend Framework & Structure
* **Core Stack**: FastAPI, Uvicorn, Python 3.10+.
* **Lifecycle Manager**: The `lifespan` handler (in `main.py`) performs startup self-checks, initializes the persistent ChromaDB client, populates vector and keyword indexes, pre-loads the Whisper model, and checks local Ollama availability.
* **VRAM Strategy**: GPU-heavy neural models (`IndicTrans2` translation) are lazily loaded. They do not allocate GPU resources until the first non-English request is received, protecting system memory.

### Database / Storage Systems
* **ChromaDB**: Holds embedding vectors persisted locally under the `backend/chroma_db` directory.
* **BM25**: An in-memory exact keyword matching indexing system (using `rank-bm25`) populated during server boot from data JSON files.
* **Session Memory**: In-memory session history kept in a dictionary of double-ended queues (`deque`), capped at 5 turns per session.

### AI / LLM Integrations
* **Gemini API**: Primary online LLM provider. Checked via local connectivity checks at runtime.
* **Ollama**: Local offline LLM fallback (configured to query `OLLAMA_BASE_URL` on local networks).
* **Template Generator**: A deterministic Python fall-back service that constructs responses when all generative components are offline or API keys are missing.

### Search / RAG Architecture
* **Embedding Model**: `BAAI/bge-small-en-v1.5` running on CPU via the `sentence-transformers` library (≈130MB VRAM footprint).
* **Hybrid Search**: Combines semantic vector similarity search from ChromaDB and lexical score ranking from BM25.
* **Rank Fusion**: Uses Reciprocal Rank Fusion (RRF) to merge and rerank results before filtering out results below a minimum confidence score threshold (currently set at `0.58`).

### Translation Architecture
* **IndicTrans2**: Uses local weights wrapper `translation_service.py` to translate Indic inputs (hi, gu, or) to English for RAG/triage, and back-translates responses to target languages.
* **Resource Optimization**: Features thread-safe locks and state-machine wrappers to load translation weights safely.

### Speech Architecture
* **Speech-to-Text (STT)**: Powered by `Faster-Whisper` running locally (typically utilizing a medium/small model).
* **Text-to-Speech (TTS)**: Handled entirely on the client-side utilizing the browser's native `SpeechSynthesis` Web API to reduce VRAM requirements on the backend.

### Authentication Architecture
* Currently no authentication layer is implemented. AAYU functions as a local-first standalone deployment suitable for private environments or public community kiosks.

### Current Implementation Status
* **Core backend engine**: 100% complete and fully verified.
* **Local STT and Translation pipelines**: 100% functional with lazy-loading constraints.
* **Hybrid RAG search**: Fully integrated.
* **UI Pages**: Chat, Search, Hospital Finder, Nutrition, Schemes, and Settings are fully operational.
* **Checklist/Screening UI**: Scaffolding is complete; integration with stateful screening APIs represents the primary next feature build.

---

## 2. Directory Structure

Below is the clean directory structure for both the backend and frontend codebases:

```txt
d:\Aayu\
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   ├── healthknowledge/      # Auto-discovered clinical JSON collections
│   │   │   │   ├── child_health.json
│   │   │   │   ├── chronic_diseases.json
│   │   │   │   ├── common_diseases.json
│   │   │   │   ├── emergency_conditions.json
│   │   │   │   └── maternal_health.json
│   │   │   ├── nutrition/            # Nutrition & dietary advice datasets
│   │   │   │   ├── foods.json
│   │   │   │   └── pregnancy_diet.json
│   │   │   └── schemes/              # Government schemes datasets
│   │   │       └── schemes.json
│   │   ├── routers/                  # API routers
│   │   │   ├── chat.py               # Orchestrates full clinical pipeline
│   │   │   ├── hospitals.py          # Coordinates Overpass OSM query
│   │   │   ├── nutrition.py          # Exposes diet lookups
│   │   │   ├── schemes.py            # Serves welfare scheme lists
│   │   │   ├── search.py             # Basic semantic lookup queries
│   │   │   └── transcribe.py         # Handles whisper STT
│   │   ├── services/                 # Singleton business logic
│   │   │   ├── bm25_service.py       # Local keyword indexes
│   │   │   ├── emergency_service.py  # Checks for critical symptoms
│   │   │   ├── indexer.py            # Builds and updates vector indices
│   │   │   ├── llm_service.py        # Connects to Gemini/Ollama
│   │   │   ├── memory_service.py     # In-memory session tracking
│   │   │   ├── nutrition_service.py  # Parses food tables
│   │   │   ├── response_service.py   # Generates formatted text from templates
│   │   │   ├── retrieval_service.py  # Abstract translation interface
│   │   │   ├── rule_based_triage.py  # Deterministic symptom classification
│   │   │   ├── schemes_service.py    # Queries welfare databases
│   │   │   ├── translation_service.py# Loads and executes IndicTrans2
│   │   │   ├── triage_service.py     # Abstract triage interface
│   │   │   ├── vector_db_service.py  # Wraps ChromaDB and embeddings
│   │   │   └── whisper_service.py    # Local speech transcription
│   │   └── main.py                   # FastAPI initialization & Lifespan handler
│   ├── chroma_db/                    # Persistent vector storage
│   ├── tests/                        # Pytest tests
│   │   ├── test_nutrition.py
│   │   ├── test_pipeline.py
│   │   └── test_search.py
│   └── requirements.txt              # Backend dependencies
├── src/                              # Frontend React Source
│   ├── components/                   # Reusable React components
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx        # Scrollable feed
│   │   │   ├── InputArea.tsx         # User input row (mic + text)
│   │   │   └── MessageBubble.tsx     # Message bubbles
│   │   ├── Common/
│   │   │   └── LanguageSelector.tsx  # Global language selection dropdown
│   │   ├── HealthPanel/
│   │   │   └── HealthSummary.tsx     # Symptom profiling panel
│   │   ├── layout/
│   │   │   └── AppShell.tsx          # Master template layout grid
│   │   ├── Sidebar/
│   │   │   └── Sidebar.tsx           # History and panel navigation
│   │   └── EmergencyAlert.tsx        # Highlighted critical warning banner
│   │   └── StatusBar.tsx             # Backend connectivity checks
│   ├── hooks/
│   │   └── useSpeech.ts              # Web Speech TTS / STT hooks
│   ├── pages/                        # Master routes
│   │   ├── ChatPage.tsx              # Interactive medical chat
│   │   ├── HomePage.tsx              # Dashboard
│   │   ├── HospitalPage.tsx          # Local hospital search
│   │   ├── NutritionPage.tsx         # Foods and diets browser
│   │   ├── SchemesPage.tsx           # Welfare programs catalog
│   │   └── SearchPage.tsx            # Knowledge base explorer
│   ├── services/
│   │   └── api.ts                    # HTTP client wrapper
│   ├── types/
│   │   └── search.ts                 # Type definitions
│   ├── App.tsx                       # React application setup
│   └── index.css                     # Root stylesheet loader
```

---

## 3. API Inventory

The FastAPI backend exposes the following endpoints:

| Method | Route | Purpose | Request | Response | Used by Frontend Page |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/transcribe` | Transcribes audio file to text, returning translated English copy | Multipart Form: `file` (WebM blob), `language` (selected language code) | `TranscribeResponse`: original transcript, English translation, processing time | `ChatPage.tsx` (mic recorder) |
| `POST` | `/chat` | Runs full orchestration: translates query, searches RAG, triages, queries LLM or templates, and compiles advice | JSON: `message` (str), `language` (str), `session_id` (str), `top_k` (int), `collection` (str) | `ChatResponse`: response text, risk level, sources, matched rules, emergency info, metrics | `ChatPage.tsx` |
| `DELETE`| `/chat/session/{id}` | Clears active conversation memory for a session ID | Path parameter: `session_id` | JSON confirmation: `{"cleared": true, "session_id": "..."}` | `ChatPage.tsx` |
| `GET`  | `/search` | Queries knowledge base using query parameters | Query: `q` (str), `collection` (str), `top_k` (int), `min_score` (float) | `SearchResponse`: collection metadata, list of search result structures | `SearchPage.tsx` |
| `POST` | `/search` | Same as GET but accepts JSON payload for longer query text | JSON: `query` (str), `collection` (str), `top_k` (int), `min_score` (float) | `SearchResponse` | None (developer tool) |
| `GET`  | `/search/collections`| Returns list of all active collections with document counts | None | JSON: metadata dict of collections | `SearchPage.tsx` |
| `GET`  | `/search/status` | Vector database diagnostic information | None | JSON: database path, document counts, active embedding model | None (admin diagnostic console) |
| `GET`  | `/nutrition` | Returns list of all food items and disease-diet structures | None | `NutritionListResponse`: array of food items & categories | `NutritionPage.tsx` |
| `GET`  | `/nutrition/search` | Search foods or dietary recommendations by query | Query: `q` (str), `limit` (int) | `NutritionListResponse` | `NutritionPage.tsx` |
| `GET`  | `/nutrition/disease/{name}`| Returns diet recommendations for a specific disease | Path parameter: `name` | `NutritionEntry` details | None (available for detail cards) |
| `GET`  | `/schemes` | List government schemes, optionally filtered by state | Query: `state` (str, e.g. "Odisha") | `SchemeListResponse`: array of schemes | `SchemesPage.tsx` |
| `GET`  | `/schemes/search` | Search schemes by keyword | Query: `q` (str) | `SchemeListResponse` | `SchemesPage.tsx` |
| `GET`  | `/schemes/{scheme_name}`| Fetch details of a specific welfare scheme by name | Path: `scheme_name` | `Scheme` schema details | `SchemesPage.tsx` (detail sheets) |
| `GET`  | `/hospitals/nearby` | Look up nearby medical centers via OpenStreetMap API | Query: `lat` (float), `lon` (float), `radius` (int), `facility_type` (str) | `HospitalResponse`: count, array of facilities sorted by proximity | `HospitalPage.tsx` |
| `GET`  | `/health` | In-depth diagnostics of all backend modules | None | Detailed health object: status, model loaded indicators, database info | `StatusBar.tsx` |

---

## 4. Services Inventory

### 1. `SearchService` (`search_service.py`)
* **Purpose**: Coordinates semantic and keyword queries, performing rank fusion to merge results.
* **Dependencies**: `VectorDBService`, `BM25Service`.
* **Inputs**: Query string, collection name, top_k, min_score threshold.
* **Outputs**: Re-ranked, score-fused list of search results.
* **Used by**: `chat.py` (Step 2), `search.py`.

### 2. `VectorDBService` (`vector_db_service.py`)
* **Purpose**: Wraps the local ChromaDB database client, loads the embedding models on CPU, and indexes/queries documents.
* **Dependencies**: `sentence-transformers` library.
* **Inputs**: Document chunks, search vectors, metadata dicts.
* **Outputs**: ID list of near matches, cosine distances, and metadata objects.
* **Used by**: `SearchService`, `indexer.py`.

### 3. `BM25Service` (`bm25_service.py`)
* **Purpose**: Maintains tokenized keyword catalogs in memory for fast lexical match calculations.
* **Dependencies**: `rank-bm25` library.
* **Inputs**: Search term strings.
* **Outputs**: Raw score matches for documents in the collection.
* **Used by**: `SearchService`.

### 4. `RuleBasedTriageEngine` (`rule_based_triage.py`)
* **Purpose**: Evaluates query text against heuristic keyword sets to classify the risk tier.
* **Dependencies**: None.
* **Inputs**: Query string (English).
* **Outputs**: `TriageResult` (risk_level: `emergency`/`urgent`/`routine`, rationale, matched_rules list).
* **Used by**: `chat.py` (Step 3).

### 5. `EmergencyClassifier` (`emergency_service.py`)
* **Purpose**: Performs a quick pre-check for life-threatening conditions (e.g., chest pain, poison, severe bleeding) to generate immediate warning flags.
* **Dependencies**: None.
* **Inputs**: Query text.
* **Outputs**: `EmergencyResult` status object.
* **Used by**: `chat.py` (pre-check).

### 6. `TemplateResponseService` (`response_service.py`)
* **Purpose**: Assembles RAG chunks, triage results, and LLM text into a structured response sheet, falling back to deterministic advice templates if the LLM fails.
* **Dependencies**: None.
* **Inputs**: Query, triage dict, context document list, LLM response text.
* **Outputs**: `HealthResponse` object.
* **Used by**: `chat.py` (Step 4), `VoicePipeline`.

### 7. `TranslationService` (`translation_service.py`)
* **Purpose**: Manages lazy loading of the GPU-heavy `IndicTrans2` model to execute bidirectional translations.
* **Dependencies**: `transformers`, `torch`, `IndicTransToolkit`.
* **Inputs**: Source text, source language code, target language code.
* **Outputs**: Translated string.
* **Used by**: `chat.py` (Step 1 & 3.5), `transcribe.py`.

### 8. `WhisperService` (`whisper_service.py`)
* **Purpose**: Loads and interfaces with local `Faster-Whisper` model weights for speech-to-text.
* **Dependencies**: `faster-whisper` library.
* **Inputs**: Local file path to raw audio, target language BCP code.
* **Outputs**: Generator stream of transcribed segment texts.
* **Used by**: `transcribe.py`.

### 9. `NutritionService` (`nutrition_service.py`)
* **Purpose**: Exposes queries to list and search local JSON diet guides.
* **Dependencies**: None.
* **Inputs**: Search term.
* **Outputs**: Structured diet guides and food lists.
* **Used by**: `nutrition.py`.

### 10. `SchemesService` (`schemes_service.py`)
* **Purpose**: Searches and lists public welfare schemes from local directories.
* **Dependencies**: None.
* **Inputs**: Search keyword, optional state code.
* **Outputs**: List of matching scheme definitions.
* **Used by**: `schemes.py`.

### 11. `MemoryService` (`memory_service.py`)
* **Purpose**: Saves recent chat message pairs per session ID for short-term LLM context.
* **Dependencies**: None.
* **Inputs**: Session ID, user/assistant dialogue turn.
* **Outputs**: List of conversation history tuples.
* **Used by**: `chat.py`.

---

## 5. Core Data Schemes

AAYU utilizes localized JSON databases. The indexes are dynamically built and managed via the `indexer.py` service.

### 1. Disease Intelligence (`healthknowledge/*.json`)
* **Location**: `backend/app/data/healthknowledge/`
* **Schema Types**: Auto-detected by key availability:
  1. *Document Schema*: Used for articles containing raw content blocks.
  2. *Structured Schema*: Preferred for clinical guidelines matching symptom logs to first aid precautions.
* **Example (Structured Schema from `common_diseases.json`)**:
```json
[
  {
    "id": "fever",
    "category": "Fever",
    "symptoms": ["high temperature", "chills", "sweating", "weakness"],
    "guidance": "Monitor temperature. Stay hydrated, rest, and keep room ventilated. Consult a physician if fever goes above 103°F or lasts more than 3 days.",
    "precautions": ["Do not self-prescribe antibiotics", "Seek care if rash or seizures appear"],
    "urgency": "medium"
  }
]
```

### 2. Nutrition Database (`nutrition/*.json`)
* **Location**: `backend/app/data/nutrition/`
* **Example (Food Item details from `foods.json`)**:
```json
[
  {
    "name": "Ragi (Mandia / Finger Millet)",
    "category": "Grains",
    "calories": 125,
    "protein": 3.2,
    "carbs": 25.0,
    "fat": 0.6,
    "fiber": 3.6,
    "serving_size": "100g cooked",
    "rich_in": ["Calcium", "Iron", "Fiber"],
    "good_for": ["Bone health", "Anemia", "Diabetes", "Pregnancy"],
    "avoid_if": ["Kidney stones"]
  }
]
```

### 3. Government Schemes (`schemes/*.json`)
* **Location**: `backend/app/data/schemes/`
* **Example (from `schemes.json`)**:
```json
[
  {
    "name": "Ayushman Bharat (PM-JAY)",
    "state": "National",
    "description": "Provides free secondary and tertiary healthcare coverage to poor families.",
    "eligibility": "Families listed in the Socio-Economic Caste Census (SECC) database.",
    "benefits": "Provides free health cover of up to ₹5,000,000 per family per year for hospitalization.",
    "documents_required": ["Aadhar Card", "Ration Card", "PM-JAY Letter"],
    "official_link": "https://pmjay.gov.in/"
  }
]
```

---

## 6. Chat Execution Pipeline Flow

The chart below outlines how user input is processed sequentially in the backend `/chat` router:

```
                  ┌───────────────────────────────┐
                  │       POST /chat Request      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Emergency Classifier check  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Translates to EN (lazy)     │ (Skip if English)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Lexical (BM25) & Semantic   │
                  │   (ChromaDB) Hybrid Search    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Score Fusion (RRF >= 0.58)  │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Rule-Based Triage Engine    │ (emergency/urgent/routine)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Retrieve Session History    │
                  └───────────────┬───────────────┘
                                  │
                   Is the Internet available?
                   ├── [ Yes ] ──> Query Gemini LLM with context grounding
                   └── [ No ] ───> Query local Ollama or fall back to templates
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Translate response back to  │ (Skip if English)
                  │   target BCP language code    │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │   Format & return structured  │
                  │        JSON response          │
                  └───────────────────────────────┘
```

1. **Emergency Filter**: The `EmergencyClassifier` pre-screens raw input for emergency markers. If triggered, it returns an emergency state flag immediately.
2. **Translation**: If the input is in Hindi, Gujarati, or Odia, the system loads `IndicTrans2` (allocating VRAM if it is the first request) and translates the query to English.
3. **Lexical/Semantic Search**: The English query is sent to `SearchService.hybrid_search()`. Semantic vectors are matched in ChromaDB, and keyword frequencies are matched in BM25.
4. **Rank Fusion**: Cosine similarity and BM25 relevance rankings are combined using Reciprocal Rank Fusion (RRF). Results with scores below `0.58` are excluded to prevent hallucinated prompts.
5. **Deterministic Triage**: The `RuleBasedTriageEngine` assesses the English string, matching clinical symptom keywords to assign a risk tier (emergency, urgent, routine).
6. **LLM Execution**:
   * If online: Passes context chunks and query history to the Gemini API.
   * If offline: Queries the local Ollama instance if available.
   * Fallback: If both fail, it falls back to the deterministic templates configured in `TemplateResponseService`.
7. **Back-translation**: The generated response is translated back to the input language using `IndicTrans2`.
8. **Final Assembly**: `TemplateResponseService` wraps the response text, matched sources, triage indicators, and disclaimer notes into a structured JSON payload returned to the client.

---

## 7. Integration Readiness & Strategy

### Diagnostic Assessment: Does a Dynamic Screening Engine Exist?
> [!IMPORTANT]
> **No dynamic screening engine currently exists in the AAYU codebase.**
> 
> The codebase contains static collections of health knowledge and rule-based keyword matchers, but lacks a stateful system capable of asking follow-up questions to narrow down symptoms.

### Blueprint for Dynamic Screening Engine Integration
To implement a dynamic screening engine, we recommend a state-machine architecture that interacts with the user over multiple turns:

```
                    ┌──────────────────────────┐
                    │    User starts chat /    │
                    │   submits symptoms log   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  Rule-based classification│
                    │  and clinical entity extraction
                    └────────────┬─────────────┘
                                 │
                   Are key symptoms missing?
                   (e.g., duration, fever severity)
                   ├── [ Yes ] ──> Create Screening Session & state machine
                   └── [ No ] ───> Return direct Triage & RAG response
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Ask screening question   │ <───┐
                    └────────────┬─────────────┘     │
                                 │                   │
                                 ▼                   │
                    ┌──────────────────────────┐     │
                    │ User answer (Yes/No/Val) │     │
                    └────────────┬─────────────┘     │
                                 │                   │
                                 ▼                   │
                    ┌──────────────────────────┐     │
                    │  Update Session State    │ ────┘
                    │  and re-evaluate rules   │ (Iterate until path resolved)
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Finalize: return full    │
                    │  assessment & guidance   │
                    └──────────────────────────┘
```

#### 1. Core Stateful Engine (`screening_service.py`)
Create a backend service to manage the screening process:
* **Session Model**: Build a database model (e.g. SQLite or Redis-based memory store) containing:
  ```python
  class ScreeningSession(BaseModel):
      session_id: str
      symptom_key: str              # e.g., "fever", "diarrhea"
      current_question_key: str     # active checkpoint key
      answers: dict[str, Any]       # accumulated answers
      history: list[str]            # list of questions asked
      completed: bool               # completion status
  ```
* **Decision Trees**: Define declarative screening rules in JSON config files (e.g. `data/screening/fever.json`):
  ```json
  {
    "symptom": "fever",
    "questions": {
      "duration": {
        "text": "How many days has the fever lasted?",
        "type": "choice",
        "options": ["1-3 days", "4-7 days", "More than a week"],
        "next": {
          "1-3 days": "rash_present",
          "4-7 days": "severe_headache",
          "More than a week": "escalate_urgent"
        }
      },
      "rash_present": {
        "text": "Is there a rash visible on the skin?",
        "type": "boolean",
        "next": {
          "true": "escalate_urgent",
          "false": "check_hydration"
        }
      }
    }
  }
  ```

#### 2. Coordinate Triage & RAG Pipeline
* The `/chat` router should inspect incoming requests. If the initial query triggers a screening category (e.g., "fever"), it intercepts the response, initializes a `ScreeningSession`, and returns the first question instead of generating a final response.
* In subsequent turns, the client submits answers to `/chat` (including the `session_id`). The server routes these to the screening engine to advance the state machine.
* Once the state machine reaches an exit node, the server calls the `TemplateResponseService` or LLM with the complete history to generate the final assessment.

#### 3. Frontend Connection (3-Column Layout)
* **Column 1 (History Sidebar)**: Displays the list of previous active symptom screening sessions.
* **Column 2 (Main Workspace)**: Shows the current question card with interactive UI selectors (e.g. multi-choice chips or large "Yes"/"No" buttons) instead of a standard text box.
* **Column 3 (Real-time Alerts)**: Dynamically updates to reflect the active risk level (Emergency/Urgent/Routine) based on the accumulated screening answers.

---

### Future Extension Strategy

```
           ┌──────────────────────────────────────────────┐
           │            Client (Web App / Kiosk)          │
           └──────┬──────────────────────┬─────────┬──────┘
                  │                      │         │
       HTTP APIs  │        Local network │         │ SMS / USSD
                  ▼                      ▼         ▼
      ┌───────────────┐          ┌───────────┐ ┌───────────┐
      │  AAYU Cloud   │          │Local Kiosk│ │SMS Gateway│
      │   Instance    │          │  Ollama   │ │  Handler  │
      └───────┬───────┘          └─────┬─────┘ └─────┬─────┘
              │                        │             │
              ▼                        ▼             ▼
      ┌────────────────────────────────────────────────────┐
      │               AAYU Core Engine Service             │
      └────────────────────────────────────────────────────┘
```

1. **Local Ollama Integration**: Integrate a lightweight, quantized local model (e.g., `Llama-3-8B-Instruct-Q4`) running on CPU/GPU as an offline alternative to the Gemini API.
2. **Offline SMS / Voice Fallback**: Integrate an SMS gateway or IVR service (e.g., Twilio or local GSM gateways) to allow users to text symptoms and receive structured SMS recommendations back, bypassing internet requirements.
3. **Ecosystem API Integration**: Export structured clinical screening results using the FHIR (Fast Healthcare Interoperability Resources) data format to allow seamless imports into hospital EHR systems.

---

## 8. Actionable Next Steps (Top 10 Tasks)

The following table outlines the prioritized next steps to take AAYU from its current state to a production-ready system:

| # | Task | Description | Files to Create / Modify | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Stateful Screening Service** | Build the backend screening engine to manage question paths and session states. | Create `app/services/screening_service.py` and `app/data/screening/` configs. | **High** |
| **2** | **Screening Router Integration** | Integrate the screening state machine into the POST `/chat` router. | Modify `app/routers/chat.py` and update request/response types. | **Medium** |
| **3** | **3-Column Frontend Layout** | Implement the 3-column workspace inside `ChatPage.tsx` to display active questions and live alerts. | Modify `src/pages/ChatPage.tsx` and related components. | **Medium** |
| **4** | **Interactive Screening UI Components** | Build specialized React cards (e.g. Yes/No/Unsure button chips) to display active screening questions. | Create `src/components/Chat/ScreeningCard.tsx`. | **Low** |
| **5** | **Offline Ollama Service** | Wire up the local Ollama LLM client to query offline models when internet checks fail. | Modify `app/services/llm_service.py`. | **Medium** |
| **6** | **Search Evaluation Suite** | Build automated tests to evaluate RRF search retrieval quality against test queries. | Create `tests/test_search_quality.py`. | **Low** |
| **7** | **SQLite Session Storage** | Migrate session storage from in-memory dicts to a persistent local SQLite database. | Create `app/services/db_session.py`; modify `chat.py` & `memory_service.py`. | **Medium** |
| **8** | **Offline PWA Support** | Configure Service Workers and manifest files to allow running the frontend without internet connection. | Create `public/sw.js`; modify `index.html` and `vite.config.ts`. | **Medium** |
| **9** | **Error Handling & Retries** | Add retry mechanism and UI warnings for when Overpass OSM queries fail or timeout. | Modify `app/routers/hospitals.py` and `src/pages/HospitalPage.tsx`. | **Low** |
| **10** | **Indic Speech Model Preload** | Enable Whisper model pre-loading configurations to avoid processing lag on initial transcription requests. | Modify `app/services/whisper_service.py` and `app/main.py`. | **Low** |
