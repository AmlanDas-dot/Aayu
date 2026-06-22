import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Send,
  Mic,
  Camera,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Eye,
  X,
} from "lucide-react";
import { sendChatMessage } from "../services/api";
import { useSpeech } from "../hooks/useSpeech";
import type { RiskLevel, RetrievedDocument, ChatApiResponse } from "../types/search";

/* ── Types ─────────────────────────────────────────────────────── */

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
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Risk helpers ──────────────────────────────────────────────── */

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  emergency: { label: "EMERGENCY", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  urgent:    { label: "URGENT",    color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  routine:   { label: "ROUTINE",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
};

/* ── LocalStorage helpers ─────────────────────────────────────── */

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem("aayu_conversations");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem("aayu_conversations", JSON.stringify(convos));
}

/* ── Welcome message ──────────────────────────────────────────── */

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Namaste! 🙏 I am AAYU, your AI health assistant.\n\nI can help you with:\n• Understanding symptoms\n• First aid guidance\n• Emergency triage\n• Health information\n\nHow can I help you today?",
  timestamp: new Date(),
};

/* ── Component ────────────────────────────────────────────────── */

export function ChatPage() {
  const location = useLocation();
  const initialMsg = (location.state as any)?.initialMessage;

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);

  // Accessibility
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  const { startListening, stopListening, isListening, isLoading, transcript, error, isSupported } = useSpeech(language as any);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle initial message from home page
  useEffect(() => {
    if (initialMsg) {
      handleSend(initialMsg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync transcription
  useEffect(() => {
    if (transcript) {
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    }
  }, [transcript]);

  // Save conversations to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // TTS
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && !last.isTyping && last.text) {
        const utterance = new SpeechSynthesisUtterance(last.text);
        utterance.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-US";
        speechSynthesis.speak(utterance);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, ttsEnabled]);

  function toggleDoc(key: string) {
    setExpandedDocs((p) => ({ ...p, [key]: !p[key] }));
  }

  function saveCurrentConversation() {
    if (messages.length <= 1) return;
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg ? firstUserMsg.text.slice(0, 50) : "New Conversation";
    const now = Date.now();

    if (activeConvoId) {
      setConversations((prev) =>
        prev.map((c) => c.id === activeConvoId ? { ...c, messages, updatedAt: now, title } : c)
      );
    } else {
      const newId = makeId();
      setConversations((prev) => [{ id: newId, title, messages, createdAt: now, updatedAt: now }, ...prev]);
      setActiveConvoId(newId);
    }
  }

  function loadConversation(convo: Conversation) {
    saveCurrentConversation();
    setMessages(convo.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
    setActiveConvoId(convo.id);
    setShowHistory(false);
  }

  function startNewChat() {
    saveCurrentConversation();
    setMessages([WELCOME]);
    setActiveConvoId(null);
    setShowHistory(false);
  }

  function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) {
      setMessages([WELCOME]);
      setActiveConvoId(null);
    }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isProcessing) return;

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    const typingId = makeId();
    setMessages((prev) => [...prev, { id: typingId, role: "assistant", text: "", timestamp: new Date(), isTyping: true }]);

    try {
      const apiResp: ChatApiResponse = await sendChatMessage({ message: msg, language });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, text: apiResp.response, isTyping: false, risk_level: apiResp.risk_level, retrieved_documents: apiResp.retrieved_documents, matched_rules: apiResp.matched_rules, disclaimer: apiResp.disclaimer, processing_time_ms: apiResp.processing_time_ms }
            : m
        )
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) => prev.map((m) => m.id === typingId ? { ...m, text: errMsg, isTyping: false } : m));
    } finally {
      setIsProcessing(false);
      saveCurrentConversation();
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 animate-fade-in">
      {/* ── History Sidebar ─────────────────────────────────── */}
      <aside className={`
        ${showHistory ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        fixed lg:static inset-y-0 left-0 z-50 lg:z-0
        w-72 lg:w-64 shrink-0
        bg-white border-r lg:border border-slate-200 rounded-none lg:rounded-2xl
        flex flex-col shadow-2xl lg:shadow-md
        transition-transform duration-300
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">History</h3>
          <div className="flex gap-1">
            <button
              onClick={startNewChat}
              className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-teal-600 transition-colors cursor-pointer"
              aria-label="New chat"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowHistory(false)}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              aria-label="Close history"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No conversations yet</p>
          ) : (
            conversations.map((convo) => (
              <div
                key={convo.id}
                className={`
                  group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors
                  ${activeConvoId === convo.id ? "bg-teal-50 text-teal-700" : "hover:bg-slate-50 text-slate-600"}
                `}
                onClick={() => loadConversation(convo)}
              >
                <MessageSquare size={14} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{convo.title}</p>
                  <p className="text-2xs text-slate-400">{new Date(convo.updatedAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                  className="hidden group-hover:flex w-6 h-6 rounded items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* History overlay (mobile) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setShowHistory(false)} />
      )}

      {/* ── Chat Main ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              aria-label="Show history"
            >
              <Clock size={16} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-slate-900 text-xs font-bold">A</div>
            <div>
              <p className="text-sm font-semibold text-slate-800">AAYU Health Assistant</p>
              <p className="text-2xs text-slate-400">Online · Powered by local AI</p>
            </div>
          </div>

          {/* Accessibility controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              aria-label="Decrease text size"
              title="Decrease text size"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              aria-label="Increase text size"
              title="Increase text size"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => {
                const html = document.documentElement;
                const current = html.getAttribute("data-contrast");
                html.setAttribute("data-contrast", current === "high" ? "" : "high");
              }}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              aria-label="Toggle high contrast"
              title="High contrast"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => setTtsEnabled((t) => !t)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${ttsEnabled ? "bg-teal-100 text-teal-600" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}
              aria-label={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
              title="Text-to-speech"
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
              className="ml-2 text-xs bg-slate-100 border-none rounded-lg px-2 py-1.5 text-slate-600 font-medium cursor-pointer hover:bg-slate-200 transition-colors outline-none"
              aria-label="Chat language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="gu">ગુજરાતી</option>
              <option value="or">ଓଡ଼ିଆ</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ fontSize: `${fontSize}px` }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 animate-slide-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
                ${msg.role === "assistant"
                  ? "bg-gradient-to-br from-teal-500 to-teal-700 text-slate-900"
                  : "bg-slate-200 text-slate-600"
                }
              `}>
                {msg.role === "assistant" ? "A" : "U"}
              </div>

              {/* Bubble */}
              <div className={`
                max-w-[75%] rounded-2xl px-4 py-3 space-y-2
                ${msg.role === "user"
                  ? "bg-teal-600 text-slate-900 rounded-tr-md"
                  : "bg-slate-50 border border-slate-200/80 text-slate-700 rounded-tl-md"
                }
              `}>
                {msg.isTyping ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <>
                    {/* Risk badge */}
                    {msg.risk_level && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${RISK_CONFIG[msg.risk_level].bg} ${RISK_CONFIG[msg.risk_level].color}`}>
                        {(() => { const Icon = RISK_CONFIG[msg.risk_level!].icon; return <Icon size={12} />; })()}
                        {RISK_CONFIG[msg.risk_level].label}
                      </div>
                    )}

                    {/* Text */}
                    <p className="whitespace-pre-wrap leading-relaxed text-[1em]">{msg.text}</p>

                    {/* Retrieved docs */}
                    {msg.retrieved_documents && msg.retrieved_documents.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <BookOpen size={12} />
                          Retrieved Knowledge ({msg.retrieved_documents.length})
                        </div>
                        {msg.retrieved_documents.map((doc, idx) => {
                          const key = `${msg.id}-${idx}`;
                          const isOpen = !!expandedDocs[key];
                          return (
                            <button
                              key={key}
                              onClick={() => toggleDoc(key)}
                              className="w-full text-left bg-white rounded-xl p-3 border border-slate-200/80 hover:border-teal-200 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                    {(doc.score * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-xs font-medium text-slate-700 truncate">{doc.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-2xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{doc.collection}</span>
                                  {isOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                                </div>
                              </div>
                              {isOpen && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  {doc.category && (
                                    <span className="text-2xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{doc.category}</span>
                                  )}
                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{doc.content}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Disclaimer */}
                    {msg.disclaimer && (
                      <p className="text-2xs text-slate-400 italic border-t border-slate-100 pt-2 mt-2">{msg.disclaimer}</p>
                    )}

                    {/* Timestamp */}
                    <span className={`text-2xs block ${msg.role === "user" ? "text-teal-200" : "text-slate-400"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {msg.processing_time_ms != null && <span> · {msg.processing_time_ms}ms</span>}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ──────────────────────────────────────── */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Quick prompts */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["Fever and headache", "Snake bite first aid", "Dog bite — what to do?", "Healthy food advice"].map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={isProcessing}
                className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-xs text-slate-600 font-medium transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <p className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            {isSupported && (
              <button
                onClick={() => isListening ? stopListening() : startListening()}
                disabled={isLoading || isProcessing}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                  isListening
                    ? "bg-red-100 hover:bg-red-200 text-red-600 animate-pulse"
                    : isLoading
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                }`}
                aria-label={isListening ? "Stop recording" : "Voice input"}
              >
                <Mic size={18} />
              </button>
            )}
            <button
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors shrink-0 cursor-pointer"
              aria-label="Upload image"
            >
              <Camera size={18} />
            </button>
            <textarea
              ref={textareaRef}
              id="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Describe your symptoms or ask AAYU..."
              rows={1}
              disabled={isProcessing}
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all disabled:opacity-50"
              aria-label="Chat message input"
            />
            <button
              id="chat-send-btn"
              onClick={() => handleSend()}
              disabled={isProcessing || !input.trim()}
              className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
