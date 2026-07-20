# AAYU Setup Guide

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)

## 1. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore**, **Authentication**, and **Storage**.
3. Generate a Service Account Key (Project Settings -> Service Accounts -> Generate new private key).
4. Save the downloaded JSON file as `backend/credentials/firebase-admin.json`.

## 2. Environment Variables

### Backend
1. Navigate to the `backend/` directory.
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Populate the variables in `.env` (Gemini API, Weather API, etc.).

### Frontend
1. Navigate to the project root directory.
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Populate the variables in `.env` (Firebase client config, Google Maps).

## 3. Backend Setup
1. Navigate to `backend/`.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

## 4. Frontend Setup
1. Navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 5. Troubleshooting & Common Errors
- **Missing Firebase Credentials:** The backend will gracefully degrade and APIs that write to Firestore will skip the write.
- **Port Conflicts:** Ensure `8000` (backend) and `5173` (frontend) are free.
