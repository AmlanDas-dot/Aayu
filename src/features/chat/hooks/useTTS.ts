import { useState, useEffect } from "react";
import { speak, stopSpeaking } from "@/services/tts";

export function useTTS(language: string) {
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Generate mapping to pick voice synthesis language code
  const getTTSLangCode = (lang: string) => {
    switch (lang) {
      case "hi":
        return "hi-IN";
      case "gu":
        return "gu-IN";
      case "or":
        return "or-IN";
      default:
        return "en-IN";
    }
  };

  function handleToggleSpeak(msgId: string, text: string) {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      stopSpeaking();
      setSpeakingMsgId(msgId);
      speak(text, getTTSLangCode(language));
    }
  }

  // --- Stop Speech Synthesizer on Unmount ---
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  return {
    speakingMsgId,
    setSpeakingMsgId,
    autoSpeak,
    setAutoSpeak,
    handleToggleSpeak,
    getTTSLangCode,
  };
}
export default useTTS;
