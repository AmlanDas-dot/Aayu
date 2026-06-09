/**
 * Supported UI/transcription languages.
 *
 * These codes must match the SUPPORTED_LANGUAGES set on the backend
 * (backend/app/routers/transcribe.py).
 *
 * To add a language:
 *   1. Add an entry here.
 *   2. Add the BCP-47 TTS tag in ttsLanguages.ts.
 *   3. Add the code to SUPPORTED_LANGUAGES in transcribe.py.
 *   4. Verify that faster-whisper "small" supports the language.
 */
export const LANGUAGES = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  or: "Odia",
} as const;

export type LanguageCode = keyof typeof LANGUAGES;
