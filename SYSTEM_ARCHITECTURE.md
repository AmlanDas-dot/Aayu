# AAYU Public Health Intelligence Engine

## Purpose

The Public Health Intelligence Engine is the central backend layer for alerts, environmental signals, community risk, predictions, notifications, analytics, and chatbot context. External APIs and AI providers write into Firestore-backed read models. Frontend dashboards, chatbot flows, and future mobile apps consume those Firestore collections instead of duplicating API calls or local scoring logic.

## Data Flow

```text
Weather / AQI / News / Outbreak / WHO / IDSP
  -> Resilient API Layer
  -> Firestore Cache Collections
  -> AI Alert Normalization
  -> Alerts
  -> Risk Engine
  -> Community Health
  -> Prediction Engine
  -> Predictions
  -> Notification Engine
  -> Notifications
  -> Dashboards / Chatbot / Mobile
```

## Scheduler

`backend/app/services/alert_scheduler.py` registers independent APScheduler jobs. Each job calls one engine method through `PublicHealthIntelligenceEngine.run_job()`, so one failed source records analytics and does not stop other jobs.

| Job | Frequency | Engine Method |
| --- | --- | --- |
| Weather | 30 minutes | `refresh_weather()` |
| AQI | 30 minutes | `refresh_aqi()` |
| News | 15 minutes | `refresh_news()` |
| Outbreak | 1 hour | `refresh_outbreak()` |
| WHO | 6 hours | `refresh_who()` |
| IDSP | 24 hours | `refresh_idsp()` |
| Predictions | 1 hour | `refresh_predictions()` |
| Cleanup expired alerts | 1 hour | `cleanup_expired()` |

## Resilient API Layer

`ResilientApiService` wraps external fetches with:

- Firestore TTL cache lookup before network/API work
- Retry with exponential backoff
- Circuit breaker after repeated failures
- Expired cache fallback
- Mock fallback
- API latency analytics

Dedicated cache collections:

- `weather_cache`
- `aqi_cache`
- `news_cache`
- `api_cache`

## Public Health Intelligence Engine

`PublicHealthIntelligenceEngine` is the central orchestrator. It owns source refresh methods, community health refresh, predictions, cleanup, and manual full refresh. It ensures each module writes once to Firestore and all consumers read from Firestore.

## Alert Pipeline

Raw source signals are passed to `AlertService.process_raw_alerts()`. The service:

1. Adds source metadata.
2. Calls `AIAlertService` for deduplication and normalized action generation.
3. Writes normalized alerts to `alerts`.
4. Publishes role-specific notifications to `notifications`.

## Risk Engine

`RiskEngine` calculates village risk with weighted inputs:

- Weather
- AQI
- Disease prevalence
- Vaccination coverage
- Maternal health
- Nutrition proxy signals
- Hospital accessibility
- Medicine availability proxy
- Water quality
- Population density proxy
- Recent outbreaks
- ASHA visit/workforce coverage
- Doctor/infrastructure availability proxy

Outputs per village:

- `disease_risk`
- `environmental_risk`
- `infrastructure_risk`
- `maternal_risk`
- `nutrition_risk`
- `emergency_risk`
- `overall_risk`
- `health_score`
- `health_grade`
- `trend`
- `confidence`
- `prediction`
- `last_updated`

These are stored in `community_health`.

## Prediction Engine

`PredictionEngine` consumes alerts, weather, AQI, and community health to generate documents in `predictions`:

- Predicted disease outbreaks
- Heatwave/environmental risk
- Flood health impact
- Hospital overload prediction
- Vaccination and nutrition recommendations
- Maternal risk prediction

Each prediction contains `risk_score`, `severity`, `trend`, `confidence`, `recommendation`, `created_at`, and `expires_at`.

## Notification Engine

`NotificationEngine` writes role-specific notification records:

- `citizen`
- `doctor`
- `asha_worker`
- `admin`

Future mobile apps should read the same `notifications` collection.

## Analytics Engine

`AnalyticsEngine` writes operational telemetry into `analytics`, including:

- Scheduler execution time
- API latency
- AI latency
- Dashboard and alert events when frontend tracking is added
- Prediction accuracy when outcomes are available

## AI Audit Logging

`AIAuditService` writes every AI call into `ai_logs` with:

- timestamp
- model
- provider
- prompt
- sources used
- response
- latency
- token estimate
- processing time
- confidence
- status

This is wired into chat LLM calls, Gemini document analysis, and Gemini image analysis.

## Chatbot Context Builder

`ChatbotContextBuilder` avoids sending raw alert rows to LLMs. It gathers:

- Nearby active alerts
- Weather cache summary
- AQI cache summary
- Community health scores
- Village risk and grade
- Predictions
- Recent outbreak context

It returns one compact JSON context block for LLM prompts.

## Firestore Collections

- `alerts`
- `weather_cache`
- `aqi_cache`
- `news_cache`
- `api_cache`
- `community_health`
- `community_health_inputs`
- `predictions`
- `notifications`
- `analytics`
- `ai_logs`

## Firestore Indexes

`firestore.indexes.json` defines composite indexes for:

- `alerts`: district, severity, category, status, created_at, expires_at
- `community_health`: district, overall_risk, health_grade, trend, last_updated
- `predictions`: district, category, risk_score, trend, created_at, expires_at
- `notifications`: role, user, read, created_at, expires_at
- `api_cache`: source, expires_at, updated_at

Deploy with:

```bash
firebase deploy --only firestore:indexes
```

## Manual Setup

1. Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

2. Configure Firebase Admin credentials with `GOOGLE_APPLICATION_CREDENTIALS` or deployment-default credentials.

3. Configure AI/API keys in `backend/.env` as needed:

```text
GEMINI_API_KEY=...
OPENAI_API_KEY=...
WEATHER_API_KEY=...
NEWSDATA_API_KEY=...
```

4. Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

5. Start FastAPI. Scheduler jobs start during app lifespan startup.

## Verification

Run:

```bash
python -m compileall backend/app
$env:PYTHONPATH='backend'; python -c "import app.main; print('fastapi-import-ok')"
npm run build
```
