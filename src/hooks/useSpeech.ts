import { useState, useRef, useCallback } from "react";
import type { LanguageCode } from "../constants/languages";
import { TTS_LANG_MAP } from "../constants/ttsLanguages";
import { API_BASE_URL } from "../config/api";

/**
 * Shape of the /transcribe response from the FastAPI backend.
 *
 * This interface is intentionally shared so any future service that calls
 * /transcribe can import it from here.
 */
export interface TranscriptionResponse {
  selected_language: string;
  detected_language: string;

  original_text: string;
  english_text: string;

  processing_time_ms: number;
}

/**
 * useSpeech — server-side transcription hook using MediaRecorder + Whisper.
 *
 * Pipeline:
 *   User Voice
 *     → MediaRecorder (webm blob)
 *     → POST /transcribe  { file, language }
 *     → TranscriptionResponse
 *     → transcript state
 *
 * TODO (IndicTrans2 — Phase 2):
 *   After receiving transcript, insert a translation step before passing text
 *   to the medical LLM:
 *
 *   Voice → Whisper (language) → IndicTrans2 (→ English)
 *         → Medical LLM
 *         → IndicTrans2 (← user language) → TTS (TTS_LANG_MAP[language])
 *
 *   The recommended extension point is right after the `onTranscribed` callback
 *   below, before the text is written to `transcript`.
 */
export function useSpeech(
  language: LanguageCode = "en",
  onTranscribed?: (result: TranscriptionResponse) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // -------------------------------------------------------------------------
  // startListening — request microphone access and start recording
  // -------------------------------------------------------------------------
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Fire-and-forget; errors handled inside
        void _sendToWhisper();
      };

      recorder.onerror = () => {
        _handleError("Recording failed unexpectedly. Please try again.");
      };

      recorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("[useSpeech] Failed to start recording:", err);
      _handleError(
        "Microphone access denied or not available. Please check your browser settings."
      );
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // stopListening — stop the recorder (triggers onstop → _sendToWhisper)
  // -------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      // Stop all microphone tracks to release the browser indicator
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.error("[useSpeech] Failed to stop recording:", err);
    } finally {
      setIsListening(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // _sendToWhisper — POST audio blob to /transcribe
  // -------------------------------------------------------------------------
  const _sendToWhisper = async () => {
    if (chunksRef.current.length === 0) {
      _handleError("No audio captured. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("language", language);

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data: TranscriptionResponse = await response.json();

      console.log(
        `[useSpeech] Transcription complete in ${data.processing_time_ms}ms`,
        data
      );

      setTranscript(data.english_text);

      // Backend already returns translated English text.
      // transcript now contains english_text.
      onTranscribed?.(data);
    } catch (err) {
      console.error("[useSpeech] Transcription request failed:", err);
      _handleError("Voice transcription failed. Please try again.");
    } finally {
      setIsLoading(false);
      chunksRef.current = [];
    }
  };

  // -------------------------------------------------------------------------
  // _handleError — stop everything and surface a user-friendly message
  // -------------------------------------------------------------------------
  const _handleError = (message: string) => {
    setError(message);
    setIsListening(false);
    setIsLoading(false);
    // Stop tracks so the browser mic indicator goes away
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  // -------------------------------------------------------------------------
  // speak — synthesise text in the active user language
  //
  // TODO (IndicTrans2): if IndicTrans2 is integrated, the `text` argument
  // will already be in the user's language and no change is needed here.
  // -------------------------------------------------------------------------
  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      console.warn("[useSpeech] Speech Synthesis not supported.");
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTS_LANG_MAP[language] ?? "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  return {
    startListening,
    stopListening,
    speak,
    isListening,
    isLoading,
    transcript,
    error,
    /** Always true — MediaRecorder is available in all modern browsers */
    isSupported: typeof MediaRecorder !== "undefined",
  };
}
