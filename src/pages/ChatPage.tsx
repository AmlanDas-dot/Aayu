import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  sendChatMessage,
  transcribeAudio,
  submitScreeningAnswer,
  clearChatSession,
  generateChatTitle,
} from "../services/api";
import { speak, stopSpeaking } from "../services/tts";
import { EmergencyAlert } from "../components/EmergencyAlert";
import type { RiskLevel, RetrievedDocument, ChatApiResponse } from "../types/search";
import { ChatSidebar } from "../components/Chat/ChatSidebar";
import { ChatMessageItem } from "../components/Chat/ChatMessageItem";

import logoHeart from "../assets/logo-heart.png";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  risk_level?: RiskLevel;
  retrieved_documents?: RetrievedDocument[];
  matched_rules?: string[];
  disclaimer?: string;
  processing_time_ms?: number;
  mode?: "online" | "offline";
  llm_provider?: "openai" | "gemini" | "ollama" | "template" | "none";
}

interface Conversation {
  sessionId: string;
  title: string;
  timestamp: string;
  lastMessageSnippet: string;
  messages: ChatMessage[];
  icon?: string;
}

function determineIcon(title: string, messages: ChatMessage[]): string {
   const text = (title + " " + messages.map(m=>m.text).join(" ")).toLowerCase();
   if (/\b(food|diet|nutrition|eat|protein|vitamin)\b/.test(text)) return "fa-seedling";
   if (/\b(fever|temperature|headache|ache|symptom|disease|dengue|malaria|flu)\b/.test(text)) return "fa-heart-pulse";
   if (/\b(scheme|ayushman|pmjay|government|insurance)\b/.test(text)) return "fa-file-medical";
   if (/\b(hospital|clinic|phc|chc|doctor|ambulance)\b/.test(text)) return "fa-hospital";
   if (/\b(scared|anxious|lonely|sad|failed|lost|die|stress)\b/.test(text)) return "fa-face-smile";
   if (/\b(record|report)\b/.test(text)) return "fa-folder";
   if (/\b(medicine|pill|tablet)\b/.test(text)) return "fa-pills";
   return "fa-comments";
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

function generateSessionId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
}



const LABELS: Record<string, {
  healthScreening: string;
  questionOf: (curr: number, total: number) => string;
  currentAssessment: string;
}> = {
  en: {
    healthScreening: "Health Screening",
    questionOf: (curr, total) => `Question ${curr} of ${total}`,
    currentAssessment: "Current Assessment Summary",
  },
  hi: {
    healthScreening: "स्वास्थ्य जांच",
    questionOf: (curr, total) => `प्रश्न ${curr} का ${total}`,
    currentAssessment: "वर्तमान मूल्यांकन सारांश",
  },
  gu: {
    healthScreening: "આરોગ્ય સ્ક્રીનીંગ",
    questionOf: (curr, total) => `પ્રશ્ન ${curr} માંથી ${total}`,
    currentAssessment: "વર્તમાન મૂલ્યાંકન સારાંશ",
  },
  or: {
    healthScreening: "ସ୍ୱାସ୍ଥ୍ୟ ସ୍କ୍ରିନିଂ",
    questionOf: (curr, total) => `ପ୍ରଶ୍ନ ${curr} ର ${total}`,
    currentAssessment: "ସାମ୍ପ୍ରତିକ ଆକଳନ ସାରାଂଶ",
  }
};

function getLabels(lang: string) {
  return LABELS[lang] || LABELS.en;
}

const DEFAULT_WELCOME_SESSION_ID = "welcome-session";
const getDefaultWelcomeSession = (): Conversation => ({
  sessionId: DEFAULT_WELCOME_SESSION_ID,
  title: "Fever & Headache Guidance",
  timestamp: "Today",
  lastMessageSnippet: "Namaste! 🙏 Describe how you are feeling.",
  messages: [
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I'm AAYU.\n\nI can help you with:\n🩺 Symptom guidance\n🥗 Nutrition advice\n🏥 Nearby healthcare facilities\n📋 Government schemes\n\nDescribe how you're feeling or ask me a health-related question.",
      timestamp: new Date(),
    },
  ],
});


export function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // --- History State ---
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("aayu_chat_conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved conversations", e);
      }
    }
    return [getDefaultWelcomeSession()];
  });

  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = localStorage.getItem("aayu_chat_conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].sessionId;
      } catch (e) { }
    }
    return DEFAULT_WELCOME_SESSION_ID;
  });

  const [searchTerm, setSearchTerm] = useState("");

  const handleExport = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleString()}\n${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AAYU_Chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Initial Message Effect ---
  useEffect(() => {
    if (location.state?.initialMessage) {
      const msg = location.state.initialMessage;
      // Clear the state so it doesn't trigger again on reload
      navigate(location.pathname, { replace: true, state: {} });
      // Small timeout to allow state to settle before triggering send
      setTimeout(() => handleSend(msg), 100);
    }
  }, [location.state, navigate, location.pathname]);

  // --- Active Chat States ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(() => localStorage.getItem("aayu_language") || "en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<{icon: string, text: string} | null>(null);

  // --- Voice Input (Whisper) State ---
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, processingStage]);

  // --- Text-To-Speech State ---
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // --- Emergency Triage State ---
  const [emergencyAlert, setEmergencyAlert] = useState<any | null>(null);

  // --- Health Screening State ---
  const [screeningActive, setScreeningActive] = useState(false);
  const [screeningComplete, setScreeningComplete] = useState(false);
  const [screeningQuestion, setScreeningQuestion] = useState<any | null>(null);
  const [screeningQIndex, setScreeningQIndex] = useState(0);
  const [screeningQTotal, setScreeningQTotal] = useState(0);
  const [runningScores, setRunningScores] = useState<any[]>([]);
  const [confidenceLabel, setConfidenceLabel] = useState("");

  // --- Right Panel Interactive Mock States ---
  const [notificationsOn, setNotificationsOn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // --- Sync Messages with Active Session ---
  useEffect(() => {
    const active = conversations.find((c) => c.sessionId === sessionId);
    if (active) {
      setMessages(active.messages);
    }
  }, [sessionId]);

  // --- Auto-scroll ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Stop Speech Synthesizer on Unmount ---
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // --- Persistent Storage Helpers ---
  const updateConversations = (updatedMsgs: ChatMessage[]) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.sessionId === sessionId);
      let currentConv = prev[index];
      if (!currentConv) {
        currentConv = {
          sessionId,
          title: "New Chat",
          timestamp: "Today",
          lastMessageSnippet: "",
          messages: [],
        };
      }

      const lastMsg = updatedMsgs[updatedMsgs.length - 1];
      const snippet = lastMsg
        ? lastMsg.text.length > 50
          ? lastMsg.text.slice(0, 50) + "..."
          : lastMsg.text
        : "";

      let title = currentConv.title;
      if (title === "New Chat" || title === "Fever & Headache Guidance") {
        const firstUserMsg = updatedMsgs.find((m) => m.role === "user");
        if (firstUserMsg) {
          title =
            firstUserMsg.text.length > 22
              ? firstUserMsg.text.slice(0, 22) + "..."
              : firstUserMsg.text;
        }
      }

      const newConv = {
        ...currentConv,
        title,
        lastMessageSnippet: snippet,
        messages: updatedMsgs,
      };

      const updated = [...prev];
      if (index >= 0) {
        updated[index] = newConv;
      } else {
        updated.unshift(newConv);
      }
      localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
      return updated;
    });
  };

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

  // --- Send Message Handler ---
  async function handleSend(text?: string, wasVoice?: boolean) {
    const msg = (text ?? input).trim();
    if (!msg || isProcessing) return;

    const lowerMsg = msg.toLowerCase();
    const isEmergency = /\b(emergency|heart attack|suicide|bleeding|stroke|poison|accident|unconscious|not breathing)\b/i.test(lowerMsg);
    const isNutrition = /\b(food|diet|nutrition|eat|protein|vitamin)\b/i.test(lowerMsg);
    const isSchemes = /\b(scheme|ayushman|pmjay|government|insurance)\b/i.test(lowerMsg);
    const isDisease = /\b(fever|temperature|headache|ache|symptom|disease|dengue|malaria|flu|vomiting|diarrhea|cough)\b/i.test(lowerMsg);

    if (wasVoice) {
       setProcessingStage({ icon: "🧠", text: "Thinking..." });
    } else {
       if (isEmergency) setProcessingStage({ icon: "🚨", text: "Emergency detected" });
       else if (isNutrition) setProcessingStage({ icon: "🍎", text: "Finding nutrition guidance..." });
       else if (isSchemes) setProcessingStage({ icon: "📑", text: "Searching government schemes..." });
       else if (isDisease) setProcessingStage({ icon: "🔍", text: "Searching verified medical knowledge..." });
       else setProcessingStage({ icon: "📝", text: "Understanding your message..." });
    }

    // Stop speaking currently reading message
    stopSpeaking();
    setSpeakingMsgId(null);

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: msg, timestamp: new Date() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    updateConversations(nextMsgs);

    setInput("");
    setIsProcessing(true);

    const typingId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true },
    ]);

    const llmHistory = messages
      .filter((m) => m.role === "user" || ["openai", "gemini", "ollama"].includes(m.llm_provider || ""))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const apiResp: ChatApiResponse = await sendChatMessage({
        message: msg,
        language,
        session_id: sessionId,
        history: llmHistory,
      }, (event) => {
          if (event === "HEADERS_RECEIVED") {
             if (isEmergency) setProcessingStage({ icon: "☎️", text: "Preparing emergency guidance..." });
             else if (isDisease) setProcessingStage({ icon: "🧠", text: "Preparing evidence-based response..." });
             else if (!isNutrition && !isSchemes) setProcessingStage({ icon: "🧠", text: "Thinking..." });
          } else if (event === "JSON_PARSED") {
             if (isNutrition) setProcessingStage({ icon: "💬", text: "Preparing recommendations..." });
             else if (isSchemes) setProcessingStage({ icon: "💬", text: "Preparing explanation..." });
             else if (!isEmergency) setProcessingStage({ icon: "💬", text: "Preparing response..." });
          }
      });



      const assistantId = makeId();
      setMessages((prev) => {
        const afterMsgs = prev.map((m) =>
          m.id === typingId
            ? {
              ...m,
              id: assistantId,
              text: apiResp.response,
              isTyping: false,
              risk_level: apiResp.risk_level,
              retrieved_documents: apiResp.retrieved_documents,
              matched_rules: apiResp.matched_rules,
              disclaimer: apiResp.disclaimer,
              processing_time_ms: apiResp.processing_time_ms,
              mode: apiResp.mode,
              llm_provider: apiResp.llm_provider,
            }
            : m
        );
        updateConversations(afterMsgs);

        // Title Generation Hook
        const activeConv = JSON.parse(localStorage.getItem("aayu_chat_conversations") || "[]").find((c: any) => c.sessionId === sessionId);
        if (activeConv && (activeConv.title === "New Chat" || activeConv.title === "Fever & Headache Guidance" || activeConv.title.includes("..."))) {
           const userMsgs = afterMsgs.filter((m) => m.role === "user");
           if (userMsgs.length >= 2 || (userMsgs.length === 1 && userMsgs[0].text.length > 15)) {
              const lastUserMsg = userMsgs[userMsgs.length - 1].text;
              const promptMsg = `User: ${lastUserMsg}\nAssistant: ${apiResp.response}`;
              generateChatTitle(promptMsg).then((t) => {
                 setConversations(prev => {
                    const updated = [...prev];
                    const idx = updated.findIndex((c) => c.sessionId === sessionId);
                    if (idx >= 0) {
                       updated[idx].title = t;
                       updated[idx].icon = determineIcon(t, updated[idx].messages);
                       localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
                    }
                    return updated;
                 });
              }).catch(() => {});
           }
        }

        return afterMsgs;
      });

      // Handle emergency alert top banner
      if (apiResp.emergency?.is_emergency) {
        setEmergencyAlert(apiResp.emergency);
      } else {
        setEmergencyAlert(null);
      }

      // Check for screening mode
      if (apiResp.screening_mode) {
        setScreeningActive(true);
        setScreeningComplete(false);
        setScreeningQuestion(apiResp.question || null);
        setScreeningQIndex(apiResp.question_index ?? 0);
        setScreeningQTotal(apiResp.total_questions ?? 0);
        setRunningScores(apiResp.running_scores || []);
        setConfidenceLabel(apiResp.confidence_label || "");
      } else {
        setScreeningActive(false);
        setScreeningComplete(false);
        setScreeningQuestion(null);
        setRunningScores([]);
        setConfidenceLabel("");
      }

      // Auto TTS if checked
      if (autoSpeak) {
        setSpeakingMsgId(assistantId);
        speak(apiResp.response, getTTSLangCode(language));
      }
    } catch (err: any) {
      const isOffline = !navigator.onLine || err.message?.includes("fetch");
      const errMsg = isOffline
        ? "⚠️ Cannot reach the AAYU server. Make sure the backend is running (`python -m uvicorn app.main:app --reload` in the backend folder), then try again."
        : `Error: ${err.message || "Something went wrong. Please try again."}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m
        )
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }

  // --- Screening Answer Option Selected ---
  async function handleScreeningAnswer(answer: string) {
    if (!screeningQuestion || isProcessing) return;

    // Stop speaking currently reading message
    stopSpeaking();
    setSpeakingMsgId(null);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text: answer,
      timestamp: new Date()
    };

    // Set processing and typing state
    setIsProcessing(true);
    setProcessingStage({ icon: "📋", text: "Preparing health screening..." });
    const typingId = makeId();

    let updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    updateConversations(updatedMsgs);

    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true },
    ]);

    try {
      const apiResp: ChatApiResponse = await submitScreeningAnswer(
        sessionId,
        screeningQuestion.id,
        answer,
        (event) => {
           if (event === "JSON_PARSED") {
              setProcessingStage({ icon: "❓", text: "Preparing next question..." });
           }
        }
      );

      const assistantId = makeId();
      setMessages((prev) => {
        const nextMsgs = prev.map((m) =>
          m.id === typingId
            ? {
              ...m,
              id: assistantId,
              text: apiResp.response,
              isTyping: false,
              risk_level: apiResp.risk_level,
              retrieved_documents: apiResp.retrieved_documents,
              matched_rules: apiResp.matched_rules,
              disclaimer: apiResp.disclaimer,
              processing_time_ms: apiResp.processing_time_ms,
              mode: apiResp.mode,
              llm_provider: apiResp.llm_provider,
            }
            : m
        );
        updateConversations(nextMsgs);
        return nextMsgs;
      });

      // Update screening states
      if (apiResp.screening_mode) {
        setScreeningActive(true);
        setScreeningComplete(false);
        setScreeningQuestion(apiResp.question || null);
        setScreeningQIndex(apiResp.question_index ?? 0);
        setScreeningQTotal(apiResp.total_questions ?? 0);
        setRunningScores(apiResp.running_scores || []);
        setConfidenceLabel(apiResp.confidence_label || "");
      } else {
        setScreeningActive(false);
        setScreeningComplete(apiResp.screening_complete || false);
        setScreeningQuestion(null);
        setRunningScores(apiResp.running_scores || []);
        setConfidenceLabel(apiResp.confidence_label || "");
      }

      // Auto TTS if checked
      if (autoSpeak) {
        setSpeakingMsgId(assistantId);
        speak(apiResp.response, getTTSLangCode(language));
      }
    } catch (err: any) {
      const isOffline = !navigator.onLine || err.message?.includes("fetch");
      const errMsg = isOffline
        ? "⚠️ Cannot reach the AAYU server. Make sure the backend is running."
        : `Error: ${err.message || "Something went wrong."}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m
        )
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }

  // --- Reset/Start New Chat Session ---
  async function handleStartNewSession() {
    stopSpeaking();
    setSpeakingMsgId(null);
    setEmergencyAlert(null);
    setScreeningActive(false);
    setScreeningComplete(false);
    setScreeningQuestion(null);
    setRunningScores([]);
    setConfidenceLabel("");

    const newId = generateSessionId();

    setSessionId(newId);

    const welcomeMsg: ChatMessage = {
      id: makeId(),
      role: "assistant",
      text: "Welcome back! A new chat session has started. Describe how you are feeling.",
      timestamp: new Date(),
    };

    const newConv: Conversation = {
      sessionId: newId,
      title: "New Chat",
      timestamp: "Today",
      lastMessageSnippet: "Welcome back!...",
      messages: [welcomeMsg],
    };

    setConversations((prev) => {
      // Create a brand new conversation without removing or overwriting previous ones
      const updated = [newConv, ...prev];
      localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
      return updated;
    });
  }

  // --- Delete Conversation Handler ---
  function handleDeleteConversation(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;

    setConversations((prev) => {
      const updated = prev.filter(c => c.sessionId !== id);
      
      if (updated.length === 0) {
        const newId = generateSessionId();
        const welcomeMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          text: "Welcome back! A new chat session has started. Describe how you are feeling.",
          timestamp: new Date(),
        };
        const newConv: Conversation = {
          sessionId: newId,
          title: "New Chat",
          timestamp: "Today",
          lastMessageSnippet: "Welcome back!...",
          messages: [welcomeMsg],
        };
        localStorage.setItem("aayu_chat_conversations", JSON.stringify([newConv]));
        setSessionId(newId);
        return [newConv];
      }

      if (sessionId === id) {
        setSessionId(updated[0].sessionId);
      }

      localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
      return updated;
    });
  }

  // --- Text-To-Speech Action Clicked ---
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

  // --- Audio recording functions (Hybrid STT integration) ---
  async function startRecording() {
    // English -> Browser API
    if (language === "en") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "aborted") {
          setInput("⚠️ Voice unavailable — type your message instead.");
          setTimeout(() => setInput(""), 3000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setProcessingStage(null);
      };

      try {
        setProcessingStage({ icon: "🎤", text: "Listening..." });
        recognition.start();
      } catch (err) {
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
          setTimeout(() => handleSend(res.transcript, true), 300);
        } catch (e: any) {
          alert("Speech recognition failed");
          setInput("");
          setProcessingStage(null);
        } finally {
          clearTimeout(transcribeTimeout);
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setProcessingStage({ icon: "🎤", text: "Listening..." });
    } catch (err) {
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

  // --- Language Change Handler ---
  function handleLanguageSelect(lang: string) {
    setLanguage(lang);
    localStorage.setItem("aayu_language", lang);
  }

  // Filter and sort conversations for better search ranking
  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    if (!searchTerm) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    const aTitleMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const bTitleMatch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Group conversations by date
  const groupedConversations: Record<string, typeof conversations> = {
    "Today": [],
    "Yesterday": [],
    "Last 7 Days": [],
    "Earlier This Month": [],
    "Older": [],
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  filteredConversations.forEach(conv => {
    const d = new Date(conv.timestamp);
    d.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) groupedConversations["Today"].push(conv);
    else if (diffDays === 1) groupedConversations["Yesterday"].push(conv);
    else if (diffDays <= 7) groupedConversations["Last 7 Days"].push(conv);
    else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) groupedConversations["Earlier This Month"].push(conv);
    else groupedConversations["Older"].push(conv);
  });

  return (
    <div className="content-layout">
      {/* LEFT COLUMN: CHAT WORKSPACE */}
      <div className="main-content chat-workspace">
        <div className="chat-layout">

          {/* 1. HISTORY PANEL */}
          <ChatSidebar
            groupedConversations={groupedConversations}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onStartNewSession={handleStartNewSession}
            onSelectSession={setSessionId}
            currentSessionId={sessionId}
            onDeleteSession={handleDeleteConversation}
            getIcon={determineIcon}
          />

          {/* 2. CHAT CONTAINER */}
          <div className="chat-container">
            {/* Header info */}
            <div className="chat-header">
              <div className="assistant-info">
                <img src={logoHeart} alt="AAYU Avatar" className="assistant-avatar" />
                <div>
                  <h2>AI Screening & Guidance</h2>
                  <div className="assistant-status">
                    <span className="status-dot"></span> Online
                    <span className="status-sep">•</span>
                    Powered by Trusted Health Knowledge
                  </div>
                </div>
              </div>
              <button 
                onClick={handleExport}
                style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-download"></i> Export Chat
              </button>
            </div>

            {/* Scrollable messages feed */}
            <div className="chat-messages">
              {emergencyAlert && <EmergencyAlert emergency={emergencyAlert} />}

              {messages.map((msg) => (
                <ChatMessageItem 
                  key={msg.id}
                  msg={msg}
                  processingStage={processingStage}
                  speakingMsgId={speakingMsgId}
                  handleToggleSpeak={handleToggleSpeak}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* SCREENING OPTIONS PANEL */}
            {screeningActive && screeningQuestion && (
              <div style={{
                margin: "0 20px 10px",
                borderRadius: "18px",
                border: "1px solid rgba(15, 118, 110, 0.3)",
                background: "linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(6,182,212,0.02) 100%)",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(15, 118, 110, 0.05)"
              }}>
                <div style={{
                  padding: "10px 16px",
                  background: "rgba(15, 118, 110, 0.08)",
                  borderBottom: "1px solid rgba(15, 118, 110, 0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {getLabels(language).healthScreening}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                    {getLabels(language).questionOf(screeningQIndex + 1, screeningQTotal)}
                  </span>
                </div>

                <div style={{ height: "3px", background: "rgba(15, 118, 110, 0.05)" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #0f766e 0%, #06b6d4 100%)",
                      width: `${(screeningQIndex / screeningQTotal) * 100}%`,
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>

                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", margin: 0, lineHeight: 1.5 }}>
                      {screeningQuestion.text}
                    </p>
                    {screeningQuestion.hint && (
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0", fontStyle: "italic" }}>
                        💡 {screeningQuestion.hint}
                      </p>
                    )}
                  </div>

                  {/* Interactive chips */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {screeningQuestion.options.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => handleScreeningAnswer(opt)}
                        disabled={isProcessing}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "999px",
                          border: "1.5px solid #0f766e",
                          background: "#ffffff",
                          color: "#0f766e",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => {
                          if (!isProcessing) {
                            e.currentTarget.style.background = "#0f766e";
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isProcessing) {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.color = "#0f766e";
                          }
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Live condition narrowing display */}
                  {runningScores.length > 0 && (
                    <div style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      background: "rgba(15, 118, 110, 0.03)",
                      border: "1px solid rgba(15, 118, 110, 0.1)",
                      marginTop: 4
                    }}>
                      <div style={{ display: "flex", justifycontent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {getLabels(language).currentAssessment}
                        </span>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          background: confidenceLabel === "High" ? "#dcfce7" : confidenceLabel === "Medium" ? "#fef3c7" : "#f1f5f9",
                          color: confidenceLabel === "High" ? "#15803d" : confidenceLabel === "Medium" ? "#b45309" : "#475569"
                        }}>
                          {confidenceLabel} Confidence
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {runningScores.filter((c: any) => c.score >= 0.35).slice(0, 3).map((c: any, i: number) => (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: "0.85rem" }}>{c.icon || "🤒"}</span>
                            <span style={{
                              fontSize: "0.78rem",
                              flex: 1,
                              color: i === 0 ? "#0f766e" : "#475569",
                              fontWeight: i === 0 ? 600 : 500
                            }}>
                              {c.name}
                            </span>
                            <div style={{ width: "60px", height: "4px", background: "#e2e8f0", borderRadius: 999 }}>
                              <div style={{
                                height: "100%",
                                borderRadius: 999,
                                background: i === 0 ? "#0f766e" : "#94a3b8",
                                width: `${Math.round(c.score * 100)}%`,
                                transition: "width 0.4s ease"
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            
            {/* SCREENING COMPLETE & CTA */}
            {screeningComplete && (() => {
              const lastMsg = messages.slice().reverse().find(m => m.role === "assistant");
              const showCTA = lastMsg && (lastMsg.risk_level === "emergency" || lastMsg.risk_level === "urgent" || lastMsg.risk_level === "high");
              if (!showCTA) return null;
              
              return (
                <div style={{ margin: "0 20px 20px", textAlign: "center" }}>
                  <button 
                    onClick={() => navigate("/hospitals?autoSearch=true")}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      padding: "14px 24px",
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    📍 Find Nearby Hospitals
                  </button>
                </div>
              );
            })()}

            {/* Bottom input area */}
            <div className="chat-input-area">
              {/* Quick Prompt Chips (hidden if screening is active) */}
              {!screeningActive && (
                <div className="quick-chips">
                  <button className="chip" disabled={isProcessing} onClick={() => handleSend("Fever and headache")}>Fever and headache</button>
                  <button className="chip" disabled={isProcessing} onClick={() => handleSend("Stomach pain")}>Stomach pain</button>
                  <button className="chip" disabled={isProcessing} onClick={() => handleSend("Skin rash")}>Skin rash</button>
                  <button className="chip" disabled={isProcessing} onClick={() => handleSend("Nutrition advice")}>Nutrition advice</button>
                  <button className="chip" disabled={isProcessing} onClick={() => handleSend("Nearby hospital")}>Nearby hospital</button>
                </div>
              )}

              {/* Text input, mic and attachments */}
              <div className="input-box">
                <button className="input-action-btn" title="Take photo"><i className="fa-solid fa-camera"></i></button>
                <button className="input-action-btn" title="Attach file"><i className="fa-solid fa-paperclip"></i></button>

                <input
                  type="text"
                  placeholder={transcribing ? "Transcribing voice..." : "Describe your symptoms or ask AAYU..."}
                  value={transcribing ? "⏳ Transcribing voice..." : input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isProcessing || transcribing}
                />

                <button
                  className="input-action-btn mic-btn"
                  title={isRecording ? "Stop Recording" : "Voice message"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  style={{
                    color: isRecording ? "#ef4444" : "#0f766e",
                    animation: isRecording ? "pulse-red 1.5s infinite" : "none",
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  <i className={isRecording ? "fa-solid fa-circle-stop" : "fa-solid fa-microphone"}></i>
                </button>
                <button
                  className="send-msg-btn"
                  onClick={() => handleSend()}
                  disabled={isProcessing || transcribing || !input.trim()}
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>

              {/* Language Selection & Auto-read response preferences */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }} htmlFor="chat-lang-select">Language:</label>
                  <select
                    id="chat-lang-select"
                    style={{
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.78rem",
                      background: "white",
                      color: "#334155",
                      outline: "none",
                    }}
                    value={language}
                    onChange={(e) => handleLanguageSelect(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  </select>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", cursor: "pointer", color: "#64748b", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => {
                      setAutoSpeak(e.target.checked);
                      if (!e.target.checked) stopSpeaking();
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  📢 Auto-read responses
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Embedded visual styles for self-containment */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        .content-layout {
          display: flex;
          align-items: stretch;
          gap: 24px;
          padding: 24px 30px 30px;
          width: 100%;
          height: calc(100vh - 120px);
          box-sizing: border-box;
          background: #f5f8fa;
          overflow: hidden;
        }
        .chat-workspace {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(15,118,110,.08);
          border: 1px solid #eef2f7;
          overflow: hidden;
          height: 100%;
        }
        .chat-layout {
          display: flex;
          flex: 1;
          min-height: 0;
          height: 100%;
        }
        
        /* Sidebar styles */
        .history-panel {
          width: 280px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          flex-shrink: 0;
        }
        .history-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        .new-chat-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #0f766e;
          color: white;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .new-chat-btn:hover {
          background: #115e59;
        }
        .history-search {
          margin: 0 20px 20px;
          position: relative;
        }
        .history-search i {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px;
        }
        .history-search input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px 8px 32px;
          font-size: 13px;
          outline: none;
          background: white;
        }
        .history-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 20px;
        }
        .history-card {
          padding: 12px;
          border-radius: 12px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: 0.2s;
          text-align: left;
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
        }
        .history-card:hover {
          background: #f1f5f9;
        }
        .history-card.active {
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .history-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #f0fdfa;
          color: #0f766e;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .history-card-content {
          flex: 1;
          min-width: 0;
        }
        .history-card-content h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-card-content span {
          font-size: 10px;
          color: #94a3b8;
          display: block;
          margin-bottom: 4px;
        }
        .history-card-content p {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Chat feed container styling */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          min-width: 0;
          height: 100%;
        }
        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .assistant-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .assistant-avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #f0fdfa;
          object-fit: contain;
          padding: 4px;
          border: 1px solid #cceee8;
        }
        .assistant-info h2 {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 2px 0;
        }
        .assistant-status {
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          display: inline-block;
        }
        .status-sep {
          color: #cbd5e1;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #f8fafc;
        }
        
        /* Message elements styling */
        .message-wrapper {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }
        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #0f766e;
          object-fit: contain;
          padding: 2px;
          flex-shrink: 0;
        }
        .message-card {
          background: white;
          padding: 14px 18px;
          border-radius: 0 16px 16px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          border: 1px solid #eef2f7;
          font-size: 14px;
          line-height: 1.55;
          color: #334155;
          text-align: left;
        }
        .message-wrapper.user .message-card {
          background: #0f766e;
          color: white;
          border-radius: 16px 16px 0 16px;
          border: none;
          box-shadow: 0 4px 12px rgba(15,118,110,0.15);
        }
        .message-card p {
          margin: 0 0 8px 0;
        }
        .message-card p:last-child {
          margin-bottom: 0;
        }
        .message-card ul {
          margin: 6px 0 6px 18px;
          padding: 0;
        }
        .message-card li {
          margin-bottom: 4px;
        }
        .message-time {
          font-size: 10px;
          color: #94a3b8;
          display: block;
          margin-top: 6px;
          text-align: right;
        }
        .message-wrapper.user .message-time {
          color: #99f6e4;
        }
        
        /* Risk labels */
        .risk-level {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          margin-bottom: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .risk-level.routine {
          background: #dcfce7;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .risk-level.urgent {
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fdba74;
        }
        .risk-level.emergency {
          background: #fff1f1;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .response-disclaimer {
          display: flex;
          gap: 8px;
          padding: 10px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 11px;
          color: #475569;
          margin-top: 12px;
          align-items: flex-start;
        }
        .response-disclaimer i {
          color: #0f766e;
          margin-top: 2px;
        }
        
        /* Typing animations */
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 6px;
          align-items: center;
        }
        .typing-indicator span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0f766e;
          display: inline-block;
          animation: pulse-typing 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes pulse-typing {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Input field container styling */
        .chat-input-area {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          background: white;
          flex-shrink: 0;
        }
        .quick-chips {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .quick-chips::-webkit-scrollbar {
          display: none;
        }
        .chip {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
          background: transparent;
        }
        .chip:hover {
          border-color: #0f766e;
          color: #0f766e;
          background: #f0fdfa;
        }
        .input-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 6px 10px;
        }
        .input-box input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 8px;
          font-size: 14px;
          color: #334155;
        }
        .input-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 16px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .input-action-btn:hover {
          background: #e2e8f0;
          color: #1f2937;
        }
        .mic-btn {
          color: #0f766e;
        }
        .send-msg-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #0f766e;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .send-msg-btn:hover {
          background: #115e59;
        }
        .send-msg-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Right panel grid elements */
        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 340px;
          flex: 0 0 340px;
          overflow-y: auto;
          height: 100%;
          scrollbar-width: none;
        }
        .right-panel::-webkit-scrollbar {
          display: none;
        }
        .alerts-panel {
          background: white;
          border-radius: 22px;
          border: 1px solid #eceff3;
          box-shadow: 0 8px 22px rgba(15,23,42,.05);
          overflow: hidden;
        }
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px 12px;
        }
        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .02em;
          color: #7f1d1d;
          text-transform: uppercase;
        }
        .panel-title i {
          color: #d32f2f;
          font-size: 15px;
        }
        .panel-link {
          color: #0f766e;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }
        .featured-alert {
          margin: 0 10px 10px;
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(180deg,#fff8f7 0%,#fff3f1 100%);
          border: 1px solid #fde3df;
          text-align: left;
        }
        .featured-alert h4 {
          font-size: 15px;
          line-height: 1.4;
          margin: 0;
          color: #991b1b;
          font-weight: 700;
        }
        .featured-alert p {
          margin: 10px 0 0;
          color: #475569;
          line-height: 1.6;
          font-size: 12px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .04em;
        }
        .pill.high { color: #b91c1c; background: #fde7e4; }
        .pill.seasonal { color: #a16207; background: #fef3c7; }
        .pill.heat { color: #15803d; background: #dcfce7; }
        
        .featured-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .featured-action {
          margin-top: 12px;
          background: white;
          border: 1px solid #f1c8c0;
          color: #9a3412;
          padding: 8px 12px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 11px;
        }
        .stack-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid #eef2f7;
          text-align: left;
        }
        .stack-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 32px;
          font-size: 15px;
        }
        .stack-icon.blue { background: #e0f2fe; color: #0369a1; }
        .stack-icon.yellow { background: #fef3c7; color: #ca8a04; }
        .stack-icon.teal { background: #dcfce7; color: #0f766e; }
        
        .stack-copy { flex: 1; min-width: 0; }
        .stack-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .stack-row h5 { margin: 0; font-size: 13px; color: #1f2937; font-weight: 700; }
        .stack-copy p { margin: 2px 0 0; color: #475569; line-height: 1.45; font-size: 11px; }
        
        .notify-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          border-top: 1px solid #eef2f7;
          text-align: left;
        }
        .notify-copy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .notify-copy i { color: #0f766e; font-size: 16px; margin-top: 2px; }
        .notify-copy h5 { margin: 0; font-size: 13px; color: #1f2937; font-weight: 700; }
        .notify-copy p { margin: 2px 0 0; color: #475569; line-height: 1.45; font-size: 11px; }

        /* Notification Switch Switcher */
        .toggle {
          width: 44px;
          height: 26px;
          border-radius: 999px;
          background: #cbd5e1;
          position: relative;
          flex: 0 0 44px;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          padding: 0;
        }
        .toggle.on {
          background: #0f766e;
        }
        .toggle::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,.15);
          transition: left 0.2s;
        }
        .toggle.on::after {
          left: 21px;
        }

        /* Banner updates styling */
        .health-banner {
          background: linear-gradient(rgba(15,118,110,0.85), rgba(15,118,110,0.85)), url("/stay_alert.jpeg") center/cover no-repeat;
          color: white;
          padding: 20px;
          border-radius: 20px;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          text-align: left;
        }
        .health-banner h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 6px 0;
          color: white;
          line-height: 1.3;
        }
        .health-banner p {
          font-size: 12px;
          opacity: 0.9;
          margin: 0;
          line-height: 1.4;
        }
        .health-banner button {
          margin-top: 12px;
          background: white;
          color: #0f766e;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          align-self: flex-start;
          transition: transform 0.2s;
          font-size: 11px;
        }
        .health-banner button:hover {
          transform: scale(1.03);
        }

        /* Benefit summary details */
        .why-panel {
          background: white;
          border-radius: 22px;
          border: 1px solid #eceff3;
          box-shadow: 0 8px 22px rgba(15,23,42,.05);
          padding: 16px;
          text-align: left;
        }
        .why-panel h3 {
          margin: 0 0 12px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 700;
        }
        .why-panel ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .why-panel li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #475569;
          line-height: 1.5;
          margin-top: 10px;
          font-size: 12px;
        }
        .why-panel li::before {
          content: "✓";
          color: #0f766e;
          font-weight: 800;
        }
        
        /* Mic Recording Pulsing animation */
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}
      </style>
    </div>
  );
}
