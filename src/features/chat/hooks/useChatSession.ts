import { useState, useEffect } from "react";
import type { ChatMessage, Conversation } from "../types/chat";
import { 
  getDefaultWelcomeSession, 
  generateSessionId, 
  makeId, 
  determineIcon,
  DEFAULT_WELCOME_SESSION_ID 
} from "../utils/chatUtils";

export function useChatSession() {
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

  const handleStartNewSession = (onNewSessionCreated?: () => void) => {
    if (onNewSessionCreated) {
      onNewSessionCreated();
    }
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
      const updated = [newConv, ...prev];
      localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteConversation = (id: string, onSelectNewSession?: () => void) => {
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
        if (onSelectNewSession) onSelectNewSession();
        return [newConv];
      }

      if (sessionId === id) {
        setSessionId(updated[0].sessionId);
        if (onSelectNewSession) onSelectNewSession();
      }

      localStorage.setItem("aayu_chat_conversations", JSON.stringify(updated));
      return updated;
    });
  };

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

  const groupedConversations: Record<string, Conversation[]> = {
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

  return {
    conversations,
    sessionId,
    setSessionId,
    searchTerm,
    setSearchTerm,
    filteredConversations,
    groupedConversations,
    updateConversations,
    handleStartNewSession,
    handleDeleteConversation,
    setConversations
  };
}
