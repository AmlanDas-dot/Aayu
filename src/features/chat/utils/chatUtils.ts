import type { RiskLevel } from "@/types/search";
import type { ChatMessage, Conversation } from "../types/chat";

export const RISK_CONFIG: Record<RiskLevel, { label: string; className: string; icon: string }> = {
  emergency: { label: "EMERGENCY", className: "risk-level emergency", icon: "🚨" },
  urgent: { label: "URGENT", className: "risk-level urgent", icon: "⚠️" },
  routine: { label: "ROUTINE", className: "risk-level routine", icon: "✅" },
};

export const LABELS: Record<string, {
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

export function getLabels(lang: string) {
  return LABELS[lang] || LABELS.en;
}

export const DEFAULT_WELCOME_SESSION_ID = "welcome-session";

export const getDefaultWelcomeSession = (): Conversation => ({
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

export function determineIcon(title: string, messages: ChatMessage[] = []): string {
  const msgs = messages || [];
  const text = ((title || "") + " " + msgs.map(m => m.text).join(" ")).toLowerCase();
  if (/\b(food|diet|nutrition|eat|protein|vitamin)\b/.test(text)) return "fa-seedling";
  if (/\b(fever|temperature|headache|ache|symptom|disease|dengue|malaria|flu)\b/.test(text)) return "fa-heart-pulse";
  if (/\b(scheme|ayushman|pmjay|government|insurance)\b/.test(text)) return "fa-file-medical";
  if (/\b(hospital|clinic|phc|chc|doctor|ambulance)\b/.test(text)) return "fa-hospital";
  if (/\b(scared|anxious|lonely|sad|failed|lost|die|stress)\b/.test(text)) return "fa-face-smile";
  if (/\b(record|report)\b/.test(text)) return "fa-folder";
  if (/\b(medicine|pill|tablet)\b/.test(text)) return "fa-pills";
  return "fa-comments";
}

export function makeId() {
  return Math.random().toString(36).slice(2);
}

export function generateSessionId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
}
