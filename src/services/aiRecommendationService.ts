import { sendChatMessage } from "./api";
import type { EnvironmentData } from "../types/environment";

export const getPersonalizedRecommendation = async (
  environment: EnvironmentData,
  userProfile: any
): Promise<string> => {
  try {
    const role = userProfile?.role || "Citizen";
    const history = userProfile?.medicalHistory?.join(", ") || "None";
    const conditions = userProfile?.chronicConditions?.join(", ") || "None";
    
    let prompt = `As AAYU AI, provide a 1-paragraph (max 3 sentences) personalized environmental health recommendation.\n`;
    prompt += `User Context: Role: ${role}. `;
    if (role === "Citizen") {
      prompt += `Medical History: ${history}. Conditions: ${conditions}. `;
    }
    prompt += `\nEnvironmental Conditions: AQI: ${environment.airQuality.aqi} (${environment.airQuality.status}), Temp: ${environment.heat.temperature}C, UV Index: ${environment.uv.index}.\n`;
    prompt += `CRITICAL RULES: Tailor the advice strictly to these environmental conditions and the user's medical profile. Do not diagnose. Keep it highly practical.`;

    // Since we don't want to show search references, just get the answer
    const response = await sendChatMessage({
      message: prompt,
      language: "en",
      top_k: 1
    });

    return response.response || environment.heat.recommendation;
  } catch (error) {
    console.error("AI Recommendation failed:", error);
    return environment.heat.recommendation; // fallback
  }
};
