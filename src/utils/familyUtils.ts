import { doc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export function generateFamilyMemberId(familyId: string, userIdOrSuffix?: string | null): string {
  // We recreate the collection reference here to avoid circular dependencies
  // since this is a pure utility
  const familyMembersCollection = collection(db, "familyMembers");
  const suffix = userIdOrSuffix || doc(familyMembersCollection).id;
  return `${familyId}_${suffix}`;
}
