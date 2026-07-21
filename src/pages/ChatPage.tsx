import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText } from "lucide-react";
import {
  sendChatMessage,
  submitScreeningAnswer,
  generateChatTitle,
  sendImageChatMessage,
  logMedicalImageHistory,
} from "@/services/api";
import { stopSpeaking } from "@/services/tts";
import { EmergencyAlert } from "@/components/EmergencyAlert";
import { CameraComponent } from "@/features/chat/components/CameraComponent";
import logoHeart from "@/assets/logo-heart.png";

// Split Imports
import type { ChatMessage } from "@/features/chat/types/chat";
import { determineIcon, makeId } from "@/features/chat/utils/chatUtils";
import { useChatSession } from "@/features/chat/hooks/useChatSession";
import { useVoiceInput } from "@/features/chat/hooks/useVoiceInput";
import { useTTS } from "@/features/chat/hooks/useTTS";
import { useImageCapture } from "@/features/chat/hooks/useImageCapture";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthContext } from "@/contexts/HealthContext";
import { useToast } from "@/contexts/ToastContext";

import { ChatHistoryPanel } from "@/features/chat/components/ChatHistoryPanel";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { ScreeningPanel } from "@/features/chat/components/ScreeningPanel";
import { ChatInputBar } from "@/features/chat/components/ChatInputBar";
import type { RiskLevel, RetrievedDocument } from "@/types/search";

export function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { selectedMember } = useHealthContext();
  const { addToast } = useToast();

  // Custom Hooks
  const {
    conversations,
    sessionId,
    setSessionId,
    searchTerm,
    setSearchTerm,
    //filteredConversations,
    groupedConversations,
    updateConversations,
    handleStartNewSession: sessionStartNew,
    handleDeleteConversation: sessionDeleteConv,
    setConversations,
  } = useChatSession();

  const [language, setLanguage] = useState(() => localStorage.getItem("aayu_language") || "en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<{ icon: string; text: string } | null>(null);
  const [promptSaveRecordFile, setPromptSaveRecordFile] = useState<File | null>(null);
  const [patientRecordsContext, setPatientRecordsContext] = useState<string>("");

  // Sync Messages with Active Session
  useEffect(() => {
    const active = conversations.find((c) => c.sessionId === sessionId);
    if (active) {
      setMessages(active.messages || []);
    }
  }, [sessionId, conversations]);

  // Load Medical Records context for RAG
  useEffect(() => {
    async function loadRecords() {
      if (currentUser) {
        try {
          const { getMedicalRecords } = await import("@/services/recordService");
          // Fetch records for the selected family. If a specific member is selected, fetch only theirs.
          if (!selectedMember || !selectedMember.familyId) return;
          
          const records = await getMedicalRecords(selectedMember.familyId, selectedMember.id);
          
          let contextStr = "";
          
          contextStr += `[SYSTEM NOTE: The user is currently talking on behalf of their family member: ${selectedMember.name} (Role: ${selectedMember.role}). Please address health concerns in relation to this family member and use the provided medical records if applicable.]\n\n`;

          if (records.length > 0) {
            contextStr += "PATIENT MEDICAL RECORDS:\n";
            contextStr += records.map(r => {
              let recStr = `Record: ${r.title}\nDate: ${r.recordDate || r.uploadedAt}\nType: ${r.category}\n`;
              if (r.hospital) recStr += `Hospital: ${r.hospital}\n`;
              if (r.doctor) recStr += `Doctor: ${r.doctor}\n`;
              if (r.geminiSummary) recStr += `Summary: ${r.geminiSummary}\n`;
              if (r.importantValues && Object.keys(r.importantValues).length > 0) {
                recStr += `Metrics: ${Object.entries(r.importantValues).map(([k,v]) => `${k}: ${v}`).join(', ')}\n`;
              }
              return recStr;
            }).join("\n---\n");
          } else {
            contextStr += "No specific medical records found for this patient.\n";
          }
          
          try {
            const { buildMedicationContextForChat } = await import("@/services/chatMedicationBridge");
            const medContext = await buildMedicationContextForChat(selectedMember.familyId, selectedMember.id!);
            contextStr += `\n\n${medContext}\n`;
          } catch (err) {
            console.error("Failed to load medication context", err);
          }
          
          setPatientRecordsContext(contextStr);
        } catch (e) {
          console.error("Failed to load records context", e);
        }
      }
    }
    loadRecords();
  }, [currentUser, selectedMember]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, processingStage]);

  // --- Initial Message from Navigation State (from Incoming/main) ---
  useEffect(() => {
    if (location.state?.initialMessage) {
      const msg = location.state.initialMessage;
      // Clear the state so it doesn't trigger again on reload
      navigate(location.pathname, { replace: true, state: {} });
      // Small timeout to allow state to settle before triggering send
      setTimeout(() => handleSend(msg), 100);
    }
  }, [location.state, navigate, location.pathname]);

  // TTS Hook
  const {
    speakingMsgId,
    setSpeakingMsgId,
    autoSpeak,
    setAutoSpeak,
    handleToggleSpeak,
    getTTSLangCode,
  } = useTTS(language);

  // Voice STT Hook
  const {
    isRecording,
    transcribing,
    startRecording,
    stopRecording,
  } = useVoiceInput({
    language,
    onTranscriptReady: (transcript, wasVoice) => {
      if (wasVoice) {
        handleSend(transcript, true);
      } else {
        setInput(transcript);
      }
    },
    setProcessingStage,
  });

  // Image capture hook
  const {
    selectedImage,
    //setSelectedImage,
    imagePreviewUrl,
    //setImagePreviewUrl,
    imageThumbnail,
    //setImageThumbnail,
    uploadProgress,
    setUploadProgress,
    fileInputRef,
    isCameraOpen,
    isDragging,
    setIsCameraOpen,
    handleImageSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    findCachedImageDescription,
    clearImage,
  } = useImageCapture();

  // Screening States
  const [screeningActive, setScreeningActive] = useState(false);
  const [screeningComplete, setScreeningComplete] = useState(false);
  const [screeningQuestion, setScreeningQuestion] = useState<any | null>(null);
  const [screeningQIndex, setScreeningQIndex] = useState(0);
  const [screeningQTotal, setScreeningQTotal] = useState(0);
  const [runningScores, setRunningScores] = useState<any[]>([]);
  const [confidenceLabel, setConfidenceLabel] = useState("");

  // Emergency Alert
  const [emergencyAlert, setEmergencyAlert] = useState<any | null>(null);

  // --- Export Chat to Text (from Incoming/main) ---
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

  // Start New Chat Session
  function handleStartNewSession() {
    stopSpeaking();
    setSpeakingMsgId(null);
    setEmergencyAlert(null);
    setScreeningActive(false);
    setScreeningComplete(false);
    setScreeningQuestion(null);
    setRunningScores([]);
    setConfidenceLabel("");
    sessionStartNew();
  }

  // Delete Conversation
  function handleDeleteConversation(_e: React.MouseEvent, id: string) {
    sessionDeleteConv(id, () => {
      stopSpeaking();
      setSpeakingMsgId(null);
      setEmergencyAlert(null);
      setScreeningActive(false);
      setScreeningComplete(false);
      setScreeningQuestion(null);
      setRunningScores([]);
      setConfidenceLabel("");
    });
  }

  // Language selection
  function handleLanguageSelect(lang: string) {
    setLanguage(lang);
    localStorage.setItem("aayu_language", lang);
  }

  // Send Message Handler
  async function handleSend(text?: string, wasVoice?: boolean) {
    const hasImage = !!selectedImage;
    const msg = (text ?? input).trim();
    if ((!msg && !hasImage) || isProcessing) return;

    const lowerMsg = msg.toLowerCase();
    const isEmergency = /\b(emergency|heart attack|suicide|bleeding|stroke|poison|accident|unconscious|not breathing)\b/i.test(lowerMsg);
    const isNutrition = /\b(food|diet|nutrition|eat|protein|vitamin)\b/i.test(lowerMsg);
    const isSchemes = /\b(scheme|ayushman|pmjay|government|insurance)\b/i.test(lowerMsg);
    const isDisease = /\b(fever|temperature|headache|ache|symptom|disease|dengue|malaria|flu|vomiting|diarrhea|cough)\b/i.test(lowerMsg);

    if (hasImage) {
      setProcessingStage({ icon: "≡ƒæü∩╕Å", text: "Analyzing image with Gemini Vision..." });
    } else if (wasVoice) {
      setProcessingStage({ icon: "≡ƒºá", text: "Thinking..." });
    } else {
      if (isEmergency) setProcessingStage({ icon: "≡ƒÜ¿", text: "Emergency detected" });
      else if (isNutrition) setProcessingStage({ icon: "≡ƒìÄ", text: "Finding nutrition guidance..." });
      else if (isSchemes) setProcessingStage({ icon: "≡ƒôæ", text: "Searching government schemes..." });
      else if (isDisease) setProcessingStage({ icon: "≡ƒöì", text: "Searching verified medical knowledge..." });
      else setProcessingStage({ icon: "≡ƒô¥", text: "Understanding your message..." });
    }

    // Stop speaking currently reading message
    stopSpeaking();
    setSpeakingMsgId(null);

    // Keep image thumbnail for rendering
    const imagePreview = imageThumbnail;
    const imageFile = selectedImage;

    // Clear selection
    clearImage();

    const userMsgText = msg || (hasImage ? "Describe this image." : "");
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text: userMsgText,
      timestamp: new Date(),
      image: imagePreview || undefined,
    };

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
      let apiResp: any;
        if (hasImage && imageFile) {
          setUploadProgress(0);
          apiResp = await sendImageChatMessage(
            imageFile,
            userMsgText,
            language,
            sessionId,
            currentUser?.uid || "",
            llmHistory,
            (progress) => {
              setUploadProgress(progress);
            }
          );
          setUploadProgress(null);
          
          if (apiResp.is_medical_record) {
             // We'll set a state to show the save prompt
             setPromptSaveRecordFile(imageFile);
          }
        } else {
        const cachedDesc = findCachedImageDescription(messages);
        const payloadMessage = cachedDesc ? `${msg}\n[Image context: ${cachedDesc}]` : msg;

        apiResp = await sendChatMessage(
          {
            message: payloadMessage,
            language,
            session_id: sessionId,
            history: llmHistory,
            patient_records: patientRecordsContext,
          },
          (event) => {
            if (event === "HEADERS_RECEIVED") {
              if (isEmergency) setProcessingStage({ icon: "ΓÿÄ∩╕Å", text: "Preparing emergency guidance..." });
              else if (isDisease) setProcessingStage({ icon: "≡ƒºá", text: "Preparing evidence-based response..." });
              else if (!isNutrition && !isSchemes) setProcessingStage({ icon: "≡ƒºá", text: "Thinking..." });
            } else if (event === "JSON_PARSED") {
              if (isNutrition) setProcessingStage({ icon: "≡ƒÆ¼", text: "Preparing recommendations..." });
              else if (isSchemes) setProcessingStage({ icon: "≡ƒÆ¼", text: "Preparing explanation..." });
              else if (!isEmergency) setProcessingStage({ icon: "≡ƒÆ¼", text: "Preparing response..." });
            }
          }
        );
      }

      let assistantText = "";
      let riskLevel: RiskLevel = "routine";
      let imageDescription: string | undefined = undefined;
      let warnings: string[] = [];
      let confidence: string | undefined = undefined;
      let retrievedDocs: RetrievedDocument[] = [];
      let matchedRules: string[] = [];
      let disclaimer: string = "";
      let processingTimeMs: number = 0;
      let mode: "online" | "offline" = "offline";
      let llmProvider: any = "template";
      let healthcareRec: any = undefined;
      let screeningMode: boolean = false;
      let screeningComplete: boolean = false;
      let showRiskLevel: boolean = false;

      let possibleConditions: any = undefined;
      let urgency: string | undefined = undefined;
      let recommendations: string[] = [];
      let redFlags: string[] = [];

      if (hasImage) {
        // Structured JSON mapped
        imageDescription = apiResp.imageDescription;
        possibleConditions = apiResp.possibleConditions;
        urgency = apiResp.urgency;
        recommendations = apiResp.recommendations || [];
        redFlags = apiResp.redFlags || [];
        disclaimer = apiResp.disclaimer || "This is not a diagnosis. Please consult a healthcare professional.";
        riskLevel = urgency?.toLowerCase() as RiskLevel || "routine";
        
        mode = "online";
        llmProvider = "openai";
        showRiskLevel = true;

        if (currentUser?.uid) {
           logMedicalImageHistory(currentUser.uid, imagePreviewUrl || "", apiResp).catch(e => console.error(e));
        }
      } else {
        assistantText = apiResp.response;
        riskLevel = apiResp.risk_level;
        retrievedDocs = apiResp.retrieved_documents || [];
        matchedRules = apiResp.matched_rules || [];
        disclaimer = apiResp.disclaimer || "";
        processingTimeMs = apiResp.processing_time_ms || 0;
        mode = apiResp.mode;
        llmProvider = apiResp.llm_provider;
        healthcareRec = apiResp.healthcare_recommendation;
        screeningMode = apiResp.screening_mode || false;
        screeningComplete = apiResp.screening_complete || false;
        showRiskLevel = apiResp.show_risk_level || false;
      }

      const assistantId = makeId();
      setMessages((prev) => {
        let found = false;
        const afterMsgs = prev.map((m) => {
          if (m.id === typingId) {
            found = true;
            return {
              ...m,
              id: assistantId,
              text: assistantText,
              isTyping: false,
              risk_level: riskLevel,
              retrieved_documents: retrievedDocs,
              matched_rules: matchedRules,
              disclaimer: disclaimer,
              processing_time_ms: processingTimeMs,
              mode: mode,
              llm_provider: llmProvider,
              imageDescription: imageDescription,
              possibleConditions: possibleConditions,
              urgency: urgency,
              recommendations: recommendations,
              redFlags: redFlags,
              warnings: warnings,
              confidence: confidence,
              healthcare_recommendation: healthcareRec,
              screening_mode: screeningMode,
              screening_complete: screeningComplete,
              show_risk_level: showRiskLevel,
            };
          }
          return m;
        });

        if (!found) {
          afterMsgs.push({
            id: assistantId,
            role: "assistant",
            text: assistantText,
            timestamp: new Date(),
            isTyping: false,
            risk_level: riskLevel,
            retrieved_documents: retrievedDocs,
            matched_rules: matchedRules,
            disclaimer: disclaimer,
            processing_time_ms: processingTimeMs,
            mode: mode,
            llm_provider: llmProvider,
            imageDescription: imageDescription,
            possibleConditions: possibleConditions,
            urgency: urgency,
            recommendations: recommendations,
            redFlags: redFlags,
            warnings: warnings,
            confidence: confidence,
            healthcare_recommendation: healthcareRec,
            screening_mode: screeningMode,
            screening_complete: screeningComplete,
            show_risk_level: showRiskLevel,
          });
        }
        updateConversations(afterMsgs);

        // Title Generation Hook
        const activeConv = JSON.parse(localStorage.getItem("aayu_chat_conversations") || "[]").find(
          (c: any) => c.sessionId === sessionId
        );
        if (
          activeConv &&
          (activeConv.title === "New Chat" ||
            activeConv.title === "Fever & Headache Guidance" ||
            activeConv.title.includes("..."))
        ) {
          const userMsgs = afterMsgs.filter((m) => m.role === "user");
          if (userMsgs.length >= 2 || (userMsgs.length === 1 && userMsgs[0].text.length > 15)) {
            const lastUserMsg = userMsgs[userMsgs.length - 1].text;
            const promptMsg = `User: ${lastUserMsg}\nAssistant: ${assistantText}`;
            generateChatTitle(promptMsg)
              .then((t) => {
                setConversations((prevVal) => {
                  const updated = [...prevVal];
                  const idx = updated.findIndex((c) => c.sessionId === sessionId);
                  if (idx >= 0) {
                    updated[idx].title = t;
                    updated[idx].icon = determineIcon(t, updated[idx].messages);
                    localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
                  }
                  return updated;
                });
              })
              .catch(() => { });
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
        import("@/services/tts").then(({ speak: speakFn }) => {
          speakFn(apiResp.response, getTTSLangCode(language));
        });
      }
    } catch (err: any) {
      const isOffline = !navigator.onLine || err.message?.includes("fetch");
      const errMsg = isOffline
        ? "ΓÜá∩╕Å Cannot reach the AAYU server. Make sure the backend is running (`python -m uvicorn app.main:app --reload` in the backend folder), then try again."
        : `Error: ${err.message || "Something went wrong. Please try again."}`;
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m))
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }

  // Screening Answer Option Selected
  async function handleScreeningAnswer(answer: string) {
    if (!screeningQuestion || isProcessing) return;

    // Stop speaking currently reading message
    stopSpeaking();
    setSpeakingMsgId(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text: answer,
      timestamp: new Date(),
    };

    // Set processing and typing state
    setIsProcessing(true);
    setProcessingStage({ icon: "≡ƒôï", text: "Preparing health screening..." });
    const typingId = makeId();

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    updateConversations(updatedMsgs);

    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true },
    ]);

    try {
      const apiResp: any = await submitScreeningAnswer(
        sessionId,
        screeningQuestion.id,
        answer,
        (event) => {
          if (event === "JSON_PARSED") {
            setProcessingStage({ icon: "Γ¥ô", text: "Preparing next question..." });
          }
        }
      );

      const assistantId = makeId();
      setMessages((prev) => {
        let found = false;
        const nextMsgs = prev.map((m) => {
          if (m.id === typingId) {
            found = true;
            return {
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
            };
          }
          return m;
        });

        if (!found) {
          nextMsgs.push({
            id: assistantId,
            role: "assistant",
            text: apiResp.response,
            timestamp: new Date(),
            isTyping: false,
            risk_level: apiResp.risk_level,
            retrieved_documents: apiResp.retrieved_documents,
            matched_rules: apiResp.matched_rules,
            disclaimer: apiResp.disclaimer,
            processing_time_ms: apiResp.processing_time_ms,
            mode: apiResp.mode,
            llm_provider: apiResp.llm_provider,
          });
        }

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
        import("@/services/tts").then(({ speak: speakFn }) => {
          speakFn(apiResp.response, getTTSLangCode(language));
        });
      }
    } catch (err: any) {
      const isOffline = !navigator.onLine || err.message?.includes("fetch");
      const errMsg = isOffline
        ? "ΓÜá∩╕Å Cannot reach the AAYU server. Make sure the backend is running."
        : `Error: ${err.message || "Something went wrong."}`;
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m))
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }

  return (
    <div className="content-layout">
      {/* LEFT COLUMN: CHAT WORKSPACE */}
      <div className="main-content chat-workspace">
        <div className="chat-layout">
          {/* 1. HISTORY PANEL */}
          <ChatHistoryPanel
            groupedConversations={groupedConversations}
            sessionId={sessionId}
            onSelectSession={setSessionId}
            onDeleteSession={handleDeleteConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNewSession={handleStartNewSession}
          />

          {/* 2. CHAT CONTAINER */}
          <div className="chat-container">
            {/* Header info */}
            <div className="chat-header">
              <div className="assistant-info">
                <img src={logoHeart} alt="AAYU Avatar" className="assistant-avatar" />
                <div>
                  <h2>AI Screening &amp; Guidance</h2>
                  <div className="assistant-status">
                    <span className="status-dot"></span> Online
                    <span className="status-sep">ΓÇó</span>
                    Powered by Trusted Health Knowledge
                  </div>
                </div>
              </div>
              {/* Export Chat button (from Incoming/main) */}
              <button
                onClick={handleExport}
                style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-download"></i> Export Chat
              </button>
            </div>

            {/* Scrollable messages feed */}
            <div
              className="chat-messages"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ position: "relative" }}
            >
              {isDragging && (
                <div
                  style={{
                    position: "absolute",
                    inset: "12px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(15, 118, 110, 0.15)",
                    border: "2px dashed #0f766e",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0f766e",
                    fontWeight: 600,
                    zIndex: 999,
                    backdropFilter: "blur(2px)",
                    transition: "all 0.2s",
                    pointerEvents: "none",
                  }}
                >
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "2.5rem", marginBottom: "12px" }}></i>
                  Drop symptom image here to upload
                </div>
              )}
              {emergencyAlert && <EmergencyAlert emergency={emergencyAlert} />}

              {(messages || []).map((msg) => (
                <MessageBubble
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
            <ScreeningPanel
              screeningActive={screeningActive}
              screeningQuestion={screeningQuestion}
              screeningQIndex={screeningQIndex}
              screeningQTotal={screeningQTotal}
              runningScores={runningScores}
              confidenceLabel={confidenceLabel}
              screeningComplete={screeningComplete}
              messages={messages}
              isProcessing={isProcessing}
              language={language}
              handleScreeningAnswer={handleScreeningAnswer}
              onNavigateToHospitals={() => navigate("/hospitals?autoSearch=true")}
            />

            {promptSaveRecordFile && (
              <div style={{ margin: '15px 24px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#16a34a' }}>
                    <FileText size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#166534', fontSize: '15px' }}>Medical Record Detected</h4>
                    <p style={{ margin: '0 0 12px 0', color: '#15803d', fontSize: '13px' }}>
                      Would you like to save this {promptSaveRecordFile.name} to your health vault for future reference?
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={async () => {
                          if (!selectedMember || !selectedMember.familyId) {
                            addToast("Please select a family member first before saving.", "error");
                            return;
                          }
                          const { uploadMedicalRecord } = await import("@/firebase/storage");
                          const { createMedicalRecord, generateRecordId } = await import("@/services/recordService");
                          const { analyzeMedicalDocument } = await import("@/services/geminiRecordService");
                          
                          setProcessingStage({ icon: "💾", text: "Saving to records..." });
                          try {
                            const recordId = generateRecordId();
                            const url = await uploadMedicalRecord(selectedMember.familyId, selectedMember.id!, recordId, promptSaveRecordFile);
                            
                            const analysis = await analyzeMedicalDocument(url, promptSaveRecordFile.type);
                            
                            await createMedicalRecord({
                              familyId: selectedMember.familyId,
                              memberId: selectedMember.id!,
                              uploadedBy: currentUser!.uid,
                              uploadedAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              title: analysis.metadata?.documentTitle || promptSaveRecordFile.name,
                              category: analysis.classification || "Other",
                              tags: [],
                              hospital: analysis.metadata?.hospitalName || null,
                              doctor: analysis.metadata?.doctorName || null,
                              recordDate: analysis.metadata?.visitDate || null,
                              language: analysis.metadata?.language || null,
                              geminiSummary: analysis.summaries?.aiSummary || null,
                              extractedText: (analysis as any).extractedText || null,
                              importantValues: analysis.metadata?.importantValues || {},
                              fileType: promptSaveRecordFile.type,
                              fileURL: url,
                              thumbnailURL: null,
                              pageCount: 1,
                              searchable: true,
                              shared: false
                            }, recordId);
                            
                            setPromptSaveRecordFile(null);
                          } catch(err) {
                            console.error(err);
                            addToast("Failed to save record.", "error");
                          } finally {
                            setProcessingStage(null);
                          }
                        }}
                        style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Save for {selectedMember?.name || 'Member'}
                      </button>
                      <button
                        onClick={() => setPromptSaveRecordFile(null)}
                        style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#166534', border: '1px solid #166534', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Bottom input area */}
            <ChatInputBar
              screeningActive={screeningActive}
              isProcessing={isProcessing}
              transcribing={transcribing}
              isRecording={isRecording}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              startRecording={startRecording}
              stopRecording={stopRecording}
              imagePreviewUrl={imagePreviewUrl}
              selectedImage={selectedImage}
              clearImage={clearImage}
              uploadProgress={uploadProgress}
              fileInputRef={fileInputRef}
              handleImageSelection={handleImageSelection}
              setIsCameraOpen={setIsCameraOpen}
              language={language}
              handleLanguageSelect={handleLanguageSelect}
              autoSpeak={autoSpeak}
              setAutoSpeak={setAutoSpeak}
              stopSpeaking={stopSpeaking}
            />
          </div>
        </div>
      </div>

      {/* Embedded visual styles for self-containment */}
      <style>
        {`
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
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .history-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f0fdfa;
          color: #0f766e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .history-card.active .history-card-icon {
          background: #0f766e;
          color: white;
        }
        .history-card-content {
          min-width: 0;
        }
        .history-card-content h4 {
          font-size: 13.5px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-card-content span {
          font-size: 11px;
          color: #94a3b8;
          display: block;
          margin-bottom: 4px;
        }
        .history-card-content p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Main container layout */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #ffffff;
        }
        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          z-index: 10;
        }
        .assistant-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .assistant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #0f766e;
          padding: 4px;
        }
        .assistant-info h2 {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px;
        }
        .assistant-status {
          font-size: 12px;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
        }
        .status-sep {
          color: #d1d5db;
        }

        /* Message feed list styling */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #f8fafc;
        }
        .message-wrapper {
          display: flex;
          gap: 12px;
          max-width: 80%;
        }
        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .message-wrapper.assistant {
          align-self: flex-start;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #0f766e;
          padding: 3px;
          flex-shrink: 0;
          align-self: flex-start;
        }
        .message-card {
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.6;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .user .message-card {
          background: #0f766e;
          color: white;
          border-top-right-radius: 4px;
        }
        .assistant .message-card {
          background: white;
          color: #1e293b;
          border-top-left-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .message-card p {
          margin: 0 0 6px;
        }
        .message-time {
          font-size: 10px;
          color: #94a3b8;
          display: block;
          text-align: right;
        }
        .user .message-time {
          color: rgba(255,255,255,0.7);
        }
        .risk-badge-urgent {
          margin-bottom: 8px;
        }

        /* Risk level classes */
        .risk-level {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 10px;
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

        /* Mic Recording Pulsing animation */
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}
      </style>
      <CameraComponent
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleImageSelection}
      />
    </div>
  );
}

export default ChatPage;

