import { setDoc, addDoc, updateDoc, deleteDoc } from "@/firebase/firestoreLogger";
import { db } from "@/firebase/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { sendChatMessage } from "./api";

export interface SchemeDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  eligibility: string;
  income_criteria: string;
  age: string;
  gender: string;
  location: string;
  benefits: string;
  documents_required: string[];
  application_process: string;
  official_website: string;
  contact_numbers: string;
  last_updated: string;
  tags: string[];
}

export interface AIMatchResult {
  matchLevel: "Highly Recommended" | "Possibly Eligible" | "Not Eligible" | "Needs More Information";
  reason: string;
}

export interface EvaluatedScheme extends SchemeDefinition {
  aiMatch?: AIMatchResult;
}

export const SCHEMES_DB: SchemeDefinition[] = [
  {
    id: "AB-PMJAY",
    name: "Ayushman Bharat PM-JAY",
    description: "The world's largest health assurance scheme, providing a health cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization.",
    category: "Insurance",
    eligibility: "Based on deprivation and occupational criteria of Socio-Economic Caste Census 2011 (SECC 2011) for rural and urban areas respectively.",
    income_criteria: "Low income households (SECC 2011 criteria)",
    age: "Any",
    gender: "All",
    location: "National",
    benefits: "Rs. 5 lakhs per family per year cashless treatment.",
    documents_required: ["Aadhaar Card", "Ration Card", "PMJAY Golden Card"],
    application_process: "Visit nearest empanelled hospital or Common Service Centre (CSC) for identification and e-card generation.",
    official_website: "https://pmjay.gov.in/",
    contact_numbers: "14555",
    last_updated: "2024-01-01",
    tags: ["Insurance", "Cashless", "Health", "Hospitalization"]
  },
  {
    id: "PMMVY",
    name: "Pradhan Mantri Matru Vandana Yojana",
    description: "A maternity benefit programme providing partial compensation for the wage loss in terms of cash incentives.",
    category: "Women & Children",
    eligibility: "Pregnant Women and Lactating Mothers (PW&LM) for their first live child.",
    income_criteria: "N/A (Excludes regular employees of Central/State Govt/PSUs)",
    age: "19+",
    gender: "Female",
    location: "National",
    benefits: "Cash incentive of Rs. 5000 in three installments.",
    documents_required: ["Aadhaar Card", "Bank Account Details", "Mother and Child Protection (MCP) Card"],
    application_process: "Register at Anganwadi Centre (AWC) or approved Health facility.",
    official_website: "https://pmmvy-cas.nic.in/",
    contact_numbers: "104",
    last_updated: "2024-01-01",
    tags: ["Pregnancy", "Women", "Maternity", "Nutrition"]
  },
  {
    id: "JANAUSHADHI",
    name: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
    description: "Making quality medicines available at affordable prices for all, particularly the poor and disadvantaged.",
    category: "Medicine",
    eligibility: "Open to all Indian citizens.",
    income_criteria: "None",
    age: "Any",
    gender: "All",
    location: "National",
    benefits: "Generic medicines at 50%-90% cheaper prices than branded equivalents.",
    documents_required: ["Doctor's Prescription"],
    application_process: "Visit the nearest PMBJP Kendra.",
    official_website: "http://janaushadhi.gov.in/",
    contact_numbers: "1800-180-8080",
    last_updated: "2024-01-01",
    tags: ["Medicine", "Affordable", "Pharmacy", "Generic"]
  },
  {
    id: "RBSK",
    name: "Rashtriya Bal Swasthya Karyakram",
    description: "Aims at early identification and early intervention for children from birth to 18 years to cover 4 'D's viz. Defects at birth, Deficiencies, Diseases, Development delays.",
    category: "Children",
    eligibility: "Children from birth to 18 years.",
    income_criteria: "None",
    age: "0-18",
    gender: "All",
    location: "National",
    benefits: "Free screening and management of 30 health conditions.",
    documents_required: ["Aadhaar Card (of child or parent)", "Birth Certificate"],
    application_process: "Screening conducted at Anganwadi centers and Government schools.",
    official_website: "https://nhm.gov.in/",
    contact_numbers: "104",
    last_updated: "2024-01-01",
    tags: ["Children", "Screening", "Health", "Free"]
  }
];

export const getSchemes = async (): Promise<SchemeDefinition[]> => {
  return SCHEMES_DB;
};

export const searchSchemes = async (query: string): Promise<SchemeDefinition[]> => {
  const q = query.toLowerCase();
  return SCHEMES_DB.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );
};

export const evaluateSchemesWithAI = async (uid: string, profileContext: any): Promise<EvaluatedScheme[]> => {
  const schemes = SCHEMES_DB;
  
  try {
    const prompt = `Evaluate eligibility for the following user profile against these government schemes.
    User Profile: ${JSON.stringify(profileContext)}
    
    Schemes:
    ${schemes.map(s => `- ${s.name}: ${s.eligibility} (Age: ${s.age}, Gender: ${s.gender})`).join('\n')}
    
    Return a JSON array of objects mapping scheme names to match levels and reasons.
    Example: [{"schemeId": "AB-PMJAY", "matchLevel": "Highly Recommended", "reason": "You meet the age criteria..."}]
    Valid matchLevels: "Highly Recommended", "Possibly Eligible", "Not Eligible", "Needs More Information".`;

    const chatRes = await sendChatMessage({ message: prompt, top_k: 1, language: "en" });
    const match = chatRes.response.match(/\[[\s\S]*\]/);
    
    if (match) {
      const parsedMatches = JSON.parse(match[0]);
      
      const evaluated = schemes.map(scheme => {
        const aiEvaluation = parsedMatches.find((m: any) => m.schemeId === scheme.id || m.schemeName === scheme.name);
        return {
          ...scheme,
          aiMatch: aiEvaluation ? { matchLevel: aiEvaluation.matchLevel, reason: aiEvaluation.reason } : undefined
        };
      });
      
      // Save results to firestore for cache/history
      await setDoc(doc(db, `users/${uid}/schemeMatches/latest`), {
        timestamp: serverTimestamp(),
        matches: parsedMatches
      });
      
      return evaluated.sort((a, b) => {
        const rank: Record<string, number> = { "Highly Recommended": 1, "Possibly Eligible": 2, "Needs More Information": 3, "Not Eligible": 4 };
        const rankA = a.aiMatch ? rank[a.aiMatch.matchLevel] || 5 : 5;
        const rankB = b.aiMatch ? rank[b.aiMatch.matchLevel] || 5 : 5;
        return rankA - rankB;
      });
    }
  } catch (error) {
    console.error("AI Evaluation failed", error);
  }
  
  return schemes;
};

// Application Flow Tracking
export const saveSchemeApplication = async (uid: string, schemeId: string, status: string) => {
  await setDoc(doc(db, `users/${uid}/schemeApplications/${schemeId}`), {
    schemeId,
    status, // "Step 1", "Step 2", "Enrolled"
    updatedAt: serverTimestamp()
  }, { merge: true });
};

