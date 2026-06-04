import { useState, useEffect, useRef } from "react";
import { Message, HealthRecord, HealthFieldKey, RiskFactors } from "../types";
import { useOllama } from "./useOllama";
import { useStorage } from "./useStorage";
import { LocalRetriever } from "../services/rag/retrieval";
import { KnowledgeEntry } from "../services/rag/types";
import {
  SYMPTOM_EXTRACTION_SYSTEM,
  getChatSystemPrompt,
  SUMMARY_GENERATION_SYSTEM,
  getAdvicePrompt
} from "../services/healthcare";
import { APP_CONFIG } from "../config/app";
import { DEFAULT_STOP_WORDS } from "../config/constants";
import { findHealthcareCenters } from "../services/healthcareFinder";

// Part 4: Full default active record with all optional extended fields
const defaultActiveRecord = (): Omit<HealthRecord, "id" | "createdAt" | "summary"> => ({
  symptoms: "",
  duration: "",
  severity: "",
  age: "",
  gender: "",
  location: "",
  preExistingConditions: "",
  triggers: "",
  urgency: "",
  possibleConditions: [],
  riskFactors: {},
  personalHistory: "",
  familyHistory: "",
  occupation: "",
  incomeRange: "",
  nutrition: "",
  governmentSchemeUsage: "",
  pets: "",
  housingConditions: "",
  attachments: [],
});

export function useChat() {
  const { generate, generateJSON } = useOllama();
  const { records, saveRecord, deleteRecord } = useStorage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedGuidelines, setMatchedGuidelines] = useState<KnowledgeEntry[]>([]);
  const [suggestedRecordIndexes, setSuggestedRecordIndexes] = useState<number[]>([]);

  const [activeRecord, setActiveRecord] = useState<Omit<HealthRecord, "id" | "createdAt" | "summary">>(
    defaultActiveRecord()
  );

  const isSendingRef = useRef(false);
  const retriever = new LocalRetriever();

  // Initialize chat greeting on mount
  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: "Hello! I am Aayu, your personal local health assistant. How can I help you feel better today? You can describe any symptoms or health concerns you are experiencing.",
      },
    ]);
  }, []);

  // Recalculate historical suggestions when active record or records list changes
  useEffect(() => {
    const suggestions = getSuggestedRecordIndexes();
    setSuggestedRecordIndexes(suggestions);
  }, [activeRecord, records]);

  // Update matched RAG guidelines based on extracted symptoms
  useEffect(() => {
    if (activeRecord.symptoms.trim()) {
      retriever.retrieve(activeRecord.symptoms, 2).then((entries) => {
        setMatchedGuidelines(entries);
      });
    } else {
      setMatchedGuidelines([]);
    }
  }, [activeRecord.symptoms]);

  /* ----- Vector Math & Similarity Matching ----- */
  const extractKeywords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !DEFAULT_STOP_WORDS.includes(word));
  };

  const buildVector = (text: string): Record<string, number> => {
    const keywords = extractKeywords(text);
    const vector: Record<string, number> = {};
    keywords.forEach((kw) => {
      vector[kw] = (vector[kw] || 0) + 1;
    });
    return vector;
  };

  const vectorSimilarity = (a?: Record<string, number> | null, b?: Record<string, number> | null) => {
    if (!a || !b) return 0;
    let score = 0;
    Object.keys(a).forEach((key) => {
      if (b[key]) score += a[key] * b[key];
    });
    return score;
  };

  const getSuggestedRecordIndexes = (): number[] => {
    const activeText = `
      ${activeRecord.symptoms}
      ${activeRecord.preExistingConditions}
      ${activeRecord.triggers}
    `;
    const queryVector = buildVector(activeText);
    if (Object.keys(queryVector).length === 0) return [];

    return records
      .map((rec, index) => {
        const fullText = `${rec.symptoms} ${rec.preExistingConditions} ${rec.triggers}`;
        const recVector = buildVector(fullText);
        const sim = vectorSimilarity(queryVector, recVector);
        
        const daysOld = (Date.now() - rec.createdAt) / (1000 * 60 * 60 * 24);
        const recencyBoost = daysOld < 30 ? 1 : 0;
        
        return {
          index,
          score: sim + recencyBoost,
        };
      })
      .filter((item) => item.score > APP_CONFIG.suggestionThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.index);
  };

  /* ----- Healthcare Center Lookup ----- */
  const detectHealthcareCenterQuery = (text: string): string | null => {
    const patterns = [
      /hospital\s+(?:near|in|at|around)\s+([a-z\s]+)/i,
      /clinic\s+(?:near|in|at|around)\s+([a-z\s]+)/i,
      /health\s+center\s+(?:near|in|at|around)\s+([a-z\s]+)/i,
      /doctor\s+(?:near|in|at|around)\s+([a-z\s]+)/i,
      /(?:find|show|where|locate)\s+(?:me\s+)?(?:a\s+)?(?:hospital|clinic|doctor)\s+(?:near|in|at)\s+([a-z\s]+)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    // Also check if user simply asks about hospitals / clinics
    if (/hospital|clinic|health\s+center|emergency\s+room|urgent\s+care/i.test(text)) {
      // Return the user's stored location as fallback
      return activeRecord.location || null;
    }
    return null;
  };

  /* ----- Core Handlers ----- */
  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsProcessing(true);

    try {
      const userMessage: Message = { role: "user", text: textToSend };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      // Part 5: Check if the user is asking about healthcare centers
      const locationQuery = detectHealthcareCenterQuery(textToSend);
      if (locationQuery) {
        const centers = findHealthcareCenters(locationQuery);
        if (centers.length > 0) {
          const centerList = centers
            .map(
              (c, i) =>
                `${i + 1}. **${c.name}** (${c.type})\n   📍 ${c.city}${c.district ? `, ${c.district}` : ""}${c.state ? `, ${c.state}` : ""}\n   ☎️ ${c.contact}\n   🕐 ${c.hours}${c.emergency ? "\n   🚨 Emergency services available" : ""}`
            )
            .join("\n\n");
          const centerMessage = `Here are healthcare centers I found:\n\n${centerList}\n\nPlease call ahead to confirm availability. For medical emergencies, call your local emergency number immediately.`;
          setMessages((prev) => [...prev, { role: "ai", text: centerMessage }]);
          isSendingRef.current = false;
          setIsProcessing(false);
          return;
        }
      }

      // 1. Get LLM response
      const systemPrompt = getChatSystemPrompt();
      const userHistoryText = updatedMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
        .join("\n");
      
      const aiResponse = await generate(userHistoryText, systemPrompt);
      setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);

      // 2. Background JSON symptom inference extraction (Parts 3+4)
      const extracted = await generateJSON<any>(
        `Here is the conversation history:\n${userHistoryText}\n\nPlease extract structured symptom fields.`,
        SYMPTOM_EXTRACTION_SYSTEM
      );

      if (extracted && typeof extracted === "object" && !Array.isArray(extracted)) {
        setActiveRecord((prev) => {
          const safeValue = (val: any, fallback: string) => {
            if (typeof val === "string" && val.trim().length > 0) return val.trim();
            if (Array.isArray(val) && val.length > 0) return val.join("; ");
            return fallback;
          };
          const safeArray = (val: any, fallback: string[]) => {
            if (Array.isArray(val) && val.length > 0) return val.map(String);
            return fallback;
          };
          return {
            ...prev,
            symptoms: safeValue(extracted.symptoms, prev.symptoms),
            duration: safeValue(extracted.duration, prev.duration),
            severity: (safeValue(extracted.severity, prev.severity) as any) || "",
            age: safeValue(extracted.age, prev.age),
            gender: safeValue(extracted.gender, prev.gender),
            location: safeValue(extracted.location, prev.location),
            preExistingConditions: safeValue(extracted.preExistingConditions, prev.preExistingConditions),
            triggers: safeValue(extracted.triggers, prev.triggers),
            // Part 3: new inferred fields
            urgency: (safeValue(extracted.urgency, prev.urgency ?? "") as any) || "",
            possibleConditions: safeArray(extracted.possibleConditions, prev.possibleConditions ?? []),
            // Part 4: extended profile fields
            occupation: safeValue(extracted.occupation, prev.occupation ?? ""),
            personalHistory: safeValue(extracted.personalHistory, prev.personalHistory ?? ""),
            familyHistory: safeValue(extracted.familyHistory, prev.familyHistory ?? ""),
            nutrition: safeValue(extracted.nutrition, prev.nutrition ?? ""),
            housingConditions: safeValue(extracted.housingConditions, prev.housingConditions ?? ""),
            pets: safeValue(extracted.pets, prev.pets ?? ""),
          };
        });
      }
    } catch (e) {
      console.error("Chat flow generation failed:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Something went wrong while communicating with Ollama. Please ensure Ollama is running locally at http://localhost:11434 with llama3.1:8b.",
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsProcessing(false);
    }
  };

  const updateField = (key: HealthFieldKey, value: any) => {
    setActiveRecord((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateRiskFactor = (key: keyof RiskFactors, value: boolean) => {
    setActiveRecord((prev) => ({
      ...prev,
      riskFactors: {
        ...prev.riskFactors,
        [key]: value,
      },
    }));
  };

  const askAIForAdvice = async () => {
    setIsProcessing(true);
    
    const ragContext = matchedGuidelines
      .map((g) => `Category: ${g.category}\nAdvice: ${g.guidance}\nPrecautions: ${g.precautions.join(", ")}`)
      .join("\n\n");

    const prompt = getAdvicePrompt(activeRecord, ragContext);
    setMessages((prev) => [...prev, { role: "ai", text: "Analyzing symptoms and compiling health guidance…" }]);

    try {
      const advice = await generate(prompt, "You are a supportive, educational local health guidance system. Provide structured, helpful health information without diagnosing or prescribing.");
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "ai", text: advice || "Unable to generate specific care recommendations." },
      ]);
    } catch (e) {
      console.error("Advice request failed:", e);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "ai", text: "Advice retrieval failed. Please check Ollama server logs." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSession = async () => {
    setIsProcessing(true);
    try {
      const summaryPrompt = `Symptoms profile: symptoms: "${activeRecord.symptoms}", severity: "${activeRecord.severity}". Summarize this in past tense in 1 sentence.`;
      const summaryText = await generate(summaryPrompt, SUMMARY_GENERATION_SYSTEM);
      
      const fullTextForVector = `${activeRecord.symptoms} ${activeRecord.preExistingConditions} ${activeRecord.triggers}`;
      const vectorMap = buildVector(fullTextForVector);

      const newRecord: HealthRecord = {
        ...activeRecord,
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        summary: summaryText.trim() || "Symptom logs compiled.",
        createdAt: Date.now(),
      };

      saveRecord(newRecord, vectorMap);
      
      // Reset active record state
      setActiveRecord(defaultActiveRecord());

      setMessages([
        {
          role: "ai",
          text: "Session saved successfully. Let me know if you have any other symptoms or health concerns.",
        },
      ]);
    } catch (e) {
      console.error("Save session failed:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetChat = () => {
    setActiveRecord(defaultActiveRecord());
    setMessages([
      {
        role: "ai",
        text: "Hello! I am Aayu, your personal local health assistant. How can I help you feel better today?",
      },
    ]);
  };

  const injectHistoryRecord = (record: HealthRecord) => {
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: `Recalling past session from ${new Date(record.createdAt).toLocaleDateString()}: "${record.summary}".` },
    ]);
    
    setActiveRecord((prev) => ({
      ...defaultActiveRecord(),
      symptoms: prev.symptoms || record.symptoms,
      duration: prev.duration || record.duration,
      severity: prev.severity || record.severity,
      age: prev.age || record.age,
      gender: prev.gender || record.gender,
      location: prev.location || record.location,
      preExistingConditions: prev.preExistingConditions || record.preExistingConditions,
      triggers: prev.triggers || record.triggers,
      urgency: prev.urgency || record.urgency || "",
      possibleConditions: prev.possibleConditions?.length ? prev.possibleConditions : (record.possibleConditions ?? []),
      riskFactors: prev.riskFactors ?? record.riskFactors ?? {},
      personalHistory: prev.personalHistory || record.personalHistory || "",
      familyHistory: prev.familyHistory || record.familyHistory || "",
      occupation: prev.occupation || record.occupation || "",
      attachments: prev.attachments.length > 0 ? prev.attachments : record.attachments,
    }));
  };

  return {
    messages,
    input,
    setInput,
    isProcessing,
    activeRecord,
    records,
    matchedGuidelines,
    suggestedRecordIndexes,
    handleSend,
    updateField,
    updateRiskFactor,
    askAIForAdvice,
    saveSession,
    resetChat,
    injectHistoryRecord,
    deleteRecord,
  };
}
