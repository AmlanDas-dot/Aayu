import { sendChatMessage } from "./api";
import { EnvironmentData } from "./environmentMock";

export const getPersonalizedRecommendation = async (
  environment: EnvironmentData,
  userProfile: any
): Promise<string> => {
  try {
    const role = userProfile?.role || "Citizen";
    const history = userProfile?.medicalHistory?.join(", ") || "None";
    const conditions = userProfile?.chronicConditions?.join(", ") || "None";
    
    let prompt = `As the AAYU AI, provide a short, single-paragraph personalized environmental health recommendation (max 3 sentences). `;
    prompt += `Role: ${role}. `;
    if (role === "Citizen") {
      prompt += `Medical History: ${history}. Conditions: ${conditions}. `;
    }
    prompt += `Current conditions - AQI: ${environment.airQuality.aqi} (${environment.airQuality.status}), Temp: ${environment.heat.temperature}C, UV Index: ${environment.uv.index}. `;

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
