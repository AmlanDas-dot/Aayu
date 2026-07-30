// Calls the Python backend to analyze a medical document via Gemini
import { config } from "../config";
const API_BASE_URL = config.apiBaseUrl;

export interface AnalyzeRecordResponse {
  classification: string;
  metadata: any;
  summaries: any;
}

export const analyzeMedicalDocument = async (fileUrl: string, mimeType: string): Promise<AnalyzeRecordResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/records/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_url: fileUrl,
      mime_type: mimeType
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to analyze document: ${errorText}`);
  }

  return response.json();
};
