import { db, auth } from "@/firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export type AuditAction = "ACCESS_READ" | "ACCESS_WRITE" | "ACCESS_DELETE" | "ACCESS_LIST";
export type ResourceType = "MEDICAL_RECORD" | "PATIENT_PROFILE" | "SYSTEM_SETTING" | "UNKNOWN";

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string; // Captured by backend in a real enterprise app
}

const AUDIT_COLLECTION = "audit_logs";

export const logAuditEvent = async (
  action: AuditAction,
  resourceType: ResourceType,
  resourceId: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid || "unauthenticated";
    
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceType,
      resourceId,
      details,
    };

    // In a true enterprise environment, this should hit a hardened backend endpoint.
    // We log it to a secure Firestore collection where security rules prevent updates/deletes.
    await addDoc(collection(db, AUDIT_COLLECTION), entry);
    
    // Also log to console for development observability
    console.log(`[AUDIT LOG] ${action} on ${resourceType} (${resourceId}) by user ${userId}`);
  } catch (error) {
    console.error("CRITICAL: Failed to write audit log!", error);
    // In a strict environment, failing to log might require blocking the request.
  }
};
