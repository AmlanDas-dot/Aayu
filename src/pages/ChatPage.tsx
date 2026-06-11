import { useState, useRef, useEffect } from "react";
import { searchKnowledgeBase, getMockChatResponse } from "../services/api";
import type { SearchResult } from "../types/search";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Namaste! 🙏 I am AAYU, your AI health assistant.\n\nI can help you with:\n• Understanding symptoms\n• First aid guidance\n• Finding healthcare centres\n• Health information\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const searchResp = await searchKnowledgeBase(msg, "all", 3).catch(() => ({ results: [] as SearchResult[] }));
      setSearchResults(searchResp.results ?? []);
      const aiText = await getMockChatResponse(msg, searchResp.results ?? []);
      setMessages((prev) =>
        prev.map((m) => (m.id === typingId ? { ...m, text: aiText, isTyping: false } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, text: "Something went wrong. Please try again.", isTyping: false }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-wrap ${msg.role}`}>
              {msg.role === "assistant" && <div className="chat-avatar">🌿</div>}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.isTyping ? (
                  <div className="typing-indicator">
                    <span /><span /><span />
                  </div>
                ) : (
                  <>
                    <p className="bubble-text">{msg.text}</p>
                    <span className="bubble-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </div>
              {msg.role === "user" && <div className="chat-avatar user-avatar">👤</div>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Search results panel */}
        {searchResults.length > 0 && (
          <div className="chat-search-panel">
            <h4 className="search-panel-title">📚 Related Knowledge</h4>
            {searchResults.slice(0, 2).map((r) => (
              <div key={r.id} className="search-panel-card">
                <span className="search-panel-score">{(r.score * 100).toFixed(0)}%</span>
                <strong>{r.title}</strong>
                <p>{r.content.slice(0, 120)}…</p>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <div className="quick-prompts">
            {["Fever and headache", "Snake bite first aid", "Dengue symptoms"].map((q) => (
              <button key={q} className="quick-prompt-btn" onClick={() => handleSend(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="chat-input-row">
            <textarea
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Describe your symptoms or ask AAYU..."
              rows={2}
              disabled={isProcessing}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? "⏳" : "➤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
