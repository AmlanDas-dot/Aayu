import { OLLAMA_CONFIG } from "../config/ollama";

export function useOllama() {
  const generate = async (prompt: string, systemPrompt?: string): Promise<string> => {
    const fullPrompt = systemPrompt ? `SYSTEM:\n${systemPrompt}\n\nUSER:\n${prompt}` : prompt;
    
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}${OLLAMA_CONFIG.endpoints.generate}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_CONFIG.model,
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Local AI (Ollama) is not running");
    }

    const data = await response.json();
    return typeof data.response === "string" && data.response.trim().length > 0
      ? data.response
      : "";
  };

  const generateJSON = async <T>(prompt: string, systemPrompt?: string): Promise<T | null> => {
    try {
      const responseText = await generate(prompt, systemPrompt);
      
      // Clean up markdown block wrappers if model returns them despite instructions
      const cleaned = responseText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
        
      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.error("Failed to parse JSON response from Ollama:", e);
      return null;
    }
  };

  return {
    generate,
    generateJSON,
  };
}
