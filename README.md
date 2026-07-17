<div align="center">

# AAYU

### AI-Powered Personal & Family Health Companion

*Intelligent healthcare management for individuals and families*

---

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.0.0--mvp-8b5cf6?style=flat-square)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)

</div>

---

> **Source Availability** — AAYU is publicly available to demonstrate software engineering, system architecture, and AI integration. The source code is shared for transparency and evaluation purposes only. Public availability does not grant permission to reuse, redistribute, or commercially exploit the project.

## Overview

AAYU is a full-stack, AI-powered healthcare platform designed to help individuals and families take control of their health. It combines a clinical-reasoning AI backend, real-time health data, and a family-aware data model to deliver a personal health companion that goes beyond simple symptom lookup.

The platform is built for real-world use cases: a parent managing medications for elderly parents and young children, someone tracking chronic conditions over time, or a user in a rural area who needs instant, multilingual health guidance without visiting a clinic.

---

## Key Features

| Feature | Description |
|---|---|
| **AI Health Chat** | Clinically-reasoned conversational AI powered by Gemini with RAG over a structured medical knowledge base |
| **Symptom Screening** | Structured, multi-step symptom questionnaire with deterministic triage routing |
| **Emergency Detection** | Real-time detection of life-threatening keywords and emergency escalation |
| **Medication Management** | Track prescriptions, dosages, schedules, and medication logs across family members |
| **Family Health Management** | Role-based family model supporting owners, admins, members, and local (unlinked) profiles |
| **Health Records** | Upload, manage, and view medical documents and reports with AI-powered analysis |
| **PDF Report Generation** | Generate downloadable health summaries and reports from stored records |
| **Nearby Healthcare** | Find hospitals, clinics, and pharmacies using the Google Places API with map view |
| **Environmental Health** | Live air quality and environmental health alerts based on location |
| **Government Health Schemes** | Browse and search relevant government healthcare schemes and welfare programs |
| **Nutrition Assistant** | AI-powered nutritional guidance and dietary recommendations |
| **Multilingual Support** | Translation pipeline using IndicTrans2 for Indian language support |
| **Voice Transcription** | Audio input with speech-to-text transcription for accessible chat |
| **Secure Authentication** | Firebase Auth with route protection and role-based access control |
| **Audit Logging** | Immutable audit trail for all family membership and administrative actions |

---

## Screenshots

> Screenshots can be added to the `/screenshots` directory and embedded here.

| Home | AI Chat | Family Dashboard |
|---|---|---|
| ![Home](screenshots/home.png) | ![Chat](screenshots/chat.png) | ![Family](screenshots/family.png) |

| Medications | Health Records | Nearby Hospitals |
|---|---|---|
| ![Medications](screenshots/medications.png) | ![Records](screenshots/records.png) | ![Hospitals](screenshots/hospitals.png) |

---

## Architecture

AAYU follows a clean client-server architecture with a React frontend communicating with a FastAPI backend through REST APIs. Firebase handles authentication, real-time data, and storage independently of the backend.

```
┌─────────────────────────────────────────────┐
│               React Frontend                │
│         TypeScript  ·  Vite  ·  CSS         │
└────────────┬───────────────────┬────────────┘
             │ REST API          │ Firebase SDK
             ▼                   ▼
┌────────────────────┐  ┌────────────────────┐
│   FastAPI Backend  │  │      Firebase       │
│                    │  │                     │
│  • Chat Router     │  │  • Authentication   │
│  • Triage Engine   │  │  • Firestore DB     │
│  • Emergency Svc   │  │  • Cloud Storage    │
│  • Screening Svc   │  │  • Security Rules   │
│  • Nutrition Svc   │  └────────────────────┘
│  • Schemes Svc     │
│  • Hospitals Svc   │
│  • Translation Svc │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              AI Services Layer              │
│                                             │
│  • Gemini API  (LLM reasoning)              │
│  • ChromaDB    (vector store / RAG)         │
│  • all-MiniLM-L6-v2  (embeddings)           │
│  • IndicTrans2  (multilingual translation)  │
│  • Google Places API  (hospital search)     │
└─────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Deterministic Chat Routing**: The backend uses a strict rule-based triage engine before invoking the LLM, preventing hallucination on emergency and safety-critical queries.
- **Retrieval-Augmented Generation (RAG)**: ChromaDB stores a curated medical knowledge base. Queries are matched using hybrid BM25 + semantic search before being sent to Gemini.
- **Family Member Architecture**: Every family member is the primary entity. An AAYU account is an optional, linkable identity — supporting children, elderly relatives, and users without smartphones.
- **Deterministic Firestore IDs**: Family member documents use the pattern `familyId_userId` to enable single-document security rule lookups without expensive queries.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type-safe application code |
| Vite 7 | Build tool and dev server |
| Firebase Authentication | User sign-in and session management |
| Cloud Firestore | Real-time database |
| Firebase Storage | Medical document and image storage |
| Google Maps / Places API | Hospital and clinic discovery |
| Lucide React | Icon library |
| QRCode React | Family invite QR code generation |
| jsPDF + html2canvas | PDF report generation |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3 | Backend language |
| Gemini API | Large language model for medical reasoning |
| ChromaDB | Persistent vector store for RAG |
| sentence-transformers | Embedding model (all-MiniLM-L6-v2) |
| IndicTrans2 | Indian language translation (lazy-loaded) |
| rank-bm25 | Hybrid lexical search |
| Uvicorn | ASGI server |

---

## Project Structure

```
aayu/
├── src/
│   ├── app/                   # App root, routing, error boundary
│   ├── components/
│   │   ├── Chat/              # Chat UI and message components
│   │   ├── family/            # Family dashboard, member modals, danger zone
│   │   ├── Records/           # Health record viewer and uploader
│   │   ├── Map/               # Hospital map component
│   │   ├── Nutrition/         # Nutrition assistant UI
│   │   ├── Schemes/           # Government schemes browser
│   │   └── ui/                # Shared UI primitives
│   ├── contexts/              # React context providers
│   ├── features/              # Feature-specific hooks and utilities
│   ├── firebase/
│   │   ├── collections.ts     # Typed Firestore interfaces
│   │   └── firebase.ts        # Firebase initialisation
│   ├── hooks/                 # Shared custom hooks
│   ├── pages/                 # Page-level components
│   ├── services/
│   │   ├── familyService.ts   # Family CRUD, membership logic
│   │   ├── migrationService.ts# Idempotent database migration
│   │   └── ...
│   ├── utils/
│   │   └── familyUtils.ts     # Shared ID generation utilities
│   └── main.tsx
│
├── backend/
│   └── app/
│       ├── routers/
│       │   ├── chat.py        # AI chat, screening, emergency detection
│       │   ├── hospitals.py   # Nearby healthcare lookup
│       │   ├── nutrition.py   # Nutritional guidance
│       │   ├── records.py     # Health record analysis
│       │   ├── schemes.py     # Government scheme search
│       │   ├── search.py      # Medical knowledge search
│       │   └── transcribe.py  # Voice transcription
│       ├── services/
│       │   ├── llm_service.py         # Gemini API integration
│       │   ├── search_service.py      # ChromaDB RAG pipeline
│       │   ├── rule_based_triage.py   # Deterministic triage engine
│       │   ├── emergency_service.py   # Emergency classification
│       │   ├── screening_service.py   # Symptom screening state machine
│       │   ├── translation_service.py # IndicTrans2 wrapper
│       │   └── ...
│       └── data/                      # Medical knowledge base (JSON)
│
├── firebase.rules             # Hardened Firestore security rules
├── storage.rules              # Firebase Storage rules
├── index.html
├── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **Python** 3.10 or later
- A **Firebase** project with Firestore, Authentication, and Storage enabled
- A **Gemini API** key
- A **Google Places API** key
- A **Google Maps API** key (for the browser)

### 1. Clone the Repository

```bash
git clone https://github.com/AmlanDas-dot/Aayu.git
cd Aayu
```

### 2. Frontend Setup

```bash
npm install
```

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
# Fill in your keys
```

Start the development server:

```bash
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory and populate it with the required API keys.

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

---

## Environment Variables

### Frontend (`/.env`)

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key (browser) |

### Backend (`/backend/.env`)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_PLACES_API_KEY` | Google Places API key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key (optional, used for specific features) |
| `OPENAI_MODEL` | OpenAI model name (e.g. `gpt-4.1-mini`) |
| `SARVAM_API_KEY` | Sarvam AI API key (voice transcription) |
| `WHISPER_MODEL` | Whisper model size (`tiny`, `base`, etc.) |

> **Never commit your `.env` files.** They are already listed in `.gitignore`.

---

## Deploying Firestore Rules

After any changes to `firebase.rules` or `storage.rules`:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## Roadmap

- [x] Firebase Authentication (email/password)
- [x] AI Health Chat with Gemini RAG pipeline
- [x] Deterministic symptom screening questionnaire
- [x] Real-time emergency detection and escalation
- [x] Family health management with role-based access
- [x] Manual (local) family member profiles for dependants
- [x] Family invite system with join tokens and QR codes
- [x] Medication tracking and log history
- [x] Health record upload and AI analysis
- [x] PDF health report generation
- [x] Nearby hospitals and clinics via Google Places
- [x] Environmental health and air quality monitoring
- [x] Government health schemes browser
- [x] Nutrition AI assistant
- [x] Multilingual support via IndicTrans2
- [x] Voice-to-text input
- [x] Hardened Firestore security rules (role-derived, no duplicate permission arrays)
- [x] Immutable audit logging for family actions
- [ ] Push notifications for medication reminders
- [ ] Wearable device data integration
- [ ] Account claiming (linking a local profile to a new AAYU account)
- [ ] Telemedicine / provider booking
- [ ] Offline mode with service workers

---

## Contributing

This project is not accepting general open-source contributions at this time. Collaboration is welcome by invitation or prior discussion.

- If you have found a bug or have a suggestion, please open a GitHub Issue.
- If you are interested in contributing code, please open an issue describing the change before submitting a Pull Request.
- Commercial use or deployment of any part of this project requires explicit written permission from the author.

---

## Medical Disclaimer & Security

> **AAYU is not a substitute for professional medical advice, diagnosis, or treatment.**

All AI responses are generated by a language model and are advisory in nature only. They should never be used as the sole basis for a medical decision. Always consult a qualified and licensed healthcare provider for diagnosis and treatment.

**Security Notes:**
- Firestore security rules are fully hardened. All data access is restricted to authenticated, authorized family members.
- No global authenticated reads are permitted. Every sensitive collection requires verified family membership, derived from the `familyMembers` collection — not duplicate permission arrays.
- API keys should always be kept in `.env` files and never committed to version control.

---

## Acknowledgements

AAYU is built on the shoulders of the following technologies and their communities:

- [Google Gemini](https://deepmind.google/technologies/gemini/) — Large language model for AI reasoning
- [Firebase](https://firebase.google.com/) — Authentication, Firestore, and Storage
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python API framework
- [ChromaDB](https://www.trychroma.com/) — Open-source vector database
- [React](https://react.dev/) — UI framework
- [IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) — Open-source Indian language translation
- [Google Maps Platform](https://developers.google.com/maps) — Maps and Places API
- [sentence-transformers](https://www.sbert.net/) — Semantic embedding models

---

## License

Copyright &copy; 2026 Amlan Das. All Rights Reserved.

This repository is publicly available for **viewing, evaluation, and educational reference**.

Unless explicitly authorized in writing by the copyright holder, you may **not**:

- Copy substantial portions of the source code.
- Modify or create derivative works.
- Redistribute the project or any part of it.
- Deploy the software for personal or organizational use.
- Use any part of this project for commercial purposes.

If you are interested in collaborating, licensing the software, or using parts of this project, please contact the author directly via GitHub.

---

<div align="center">

Copyright &copy; 2026 Amlan Das. All Rights Reserved.

</div>
