import { useState, useRef } from "react";
import { transcribeAudio } from "@/services/api";

interface UseVoiceInputProps {
  language: string;
  onTranscriptReady: (transcript: string, wasVoice: boolean) => void;
  setProcessingStage: (stage: { icon: string; text: string } | null) => void;
}

export function useVoiceInput({
  language,
  onTranscriptReady,
  setProcessingStage,
}: UseVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  async function startRecording() {
    // English -> Browser Speech Recognition API
    if (language === "en") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Browser speech recognition not supported in this browser. Please type your message.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscriptReady(transcript, true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "aborted") {
          onTranscriptReady("⚠️ Voice unavailable — type your message instead.", false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setProcessingStage(null);
      };

      try {
        setProcessingStage({ icon: "🎤", text: "Listening..." });
        recognition.start();
      } catch (e: any) {
        alert("Microphone permission denied or not available.");
      }
      return;
    }

    // Other languages -> MediaRecorder -> Sarvam backend
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop()); // release mic

        setTranscribing(true);
        setProcessingStage({ icon: "📝", text: "Converting speech to text..." });
        const transcribeTimeout = setTimeout(() => {
          setTranscribing(false);
          setProcessingStage(null);
          console.warn("[Transcribe] Timed out after 30s");
        }, 30000);

        try {
          const res = await transcribeAudio(audioBlob, language);
          setProcessingStage({ icon: "✓", text: "Speech recognized" });
          setTimeout(() => onTranscriptReady(res.transcript, true), 300);
        } catch (e: any) {
          alert("Speech recognition failed");
          setProcessingStage(null);
        } finally {
          clearTimeout(transcribeTimeout);
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setProcessingStage({ icon: "🎤", text: "Listening..." });
    } catch (e: any) {
      alert("Microphone permission denied or not available.");
    }
  }

  function stopRecording() {
    if (language === "en") {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } else {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  }

  return {
    isRecording,
    transcribing,
    startRecording,
    stopRecording,
  };
}
