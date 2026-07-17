import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Family, FamilyMember, FamilyRole, AuditLog } from "@/firebase/collections";
import { makeId } from "@/features/chat/utils/chatUtils";

const familiesCollection = collection(db, "families");
const familyMembersCollection = collection(db, "familyMembers");
const auditLogsCollection = collection(db, "auditLogs");
const joinTokensCollection = collection(db, "joinTokens");
import { generateFamilyMemberId } from "@/utils/familyUtils";

export async function logAuditAction(familyId: string, performedBy: string, action: string, metadata?: any, memberId?: string) {
  const logId = doc(auditLogsCollection).id;
  const logData: any = {
    id: logId,
    familyId,
    performedBy,
    action,
    createdAt: new Date().toISOString()
  };

  if (metadata !== undefined && metadata !== null) {
    logData.metadata = metadata;
  }
  if (memberId !== undefined && memberId !== null) {
    logData.memberId = memberId;
  }

  await setDoc(doc(auditLogsCollection, logId), logData as AuditLog);
}

export async function createFamily(
  ownerUid: string,
  ownerName: string,
  familyData: { name: string; photoURL?: string; primaryCaregiver?: string; address?: string; motto?: string }
): Promise<string> {
  const familyId = doc(familiesCollection).id;
  const joinToken = makeId().substring(0, 6).toUpperCase(); // Short code like A1B2C3
  const now = new Date().toISOString();

  const newFamily: Family = {
    id: familyId,
    ownerUid,
    name: familyData.name,
    photoURL: familyData.photoURL,
    primaryCaregiver: familyData.primaryCaregiver,
    address: familyData.address,
    motto: familyData.motto,
    joinToken,
    createdAt: now,
    updatedAt: now,
  };

  const newMember: FamilyMember = {
    id: generateFamilyMemberId(familyId, ownerUid),
    familyId,
    userId: ownerUid,
    isLinkedAccount: true,
    name: ownerName,
    role: 'owner',
    status: 'linked',
    createdBy: ownerUid,
    createdAt: now,
    updatedAt: now,
    joinedAt: now,
    lastActive: now,
  };

  await runTransaction(db, async (transaction) => {
    transaction.set(doc(familiesCollection, familyId), newFamily);
    transaction.set(doc(familyMembersCollection, newMember.id!), newMember);
    transaction.set(doc(joinTokensCollection, joinToken), { familyId, ownerUid, createdAt: now });
  });
  
  await logAuditAction(familyId, ownerUid, 'FAMILY_CREATED', { name: familyData.name });

  return familyId;
}

export async function getFamilyDetails(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(familiesCollection, familyId));
  if (snap.exists()) {
    return snap.data() as Family;
  }
  return null;
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const q = query(familyMembersCollection, where("familyId", "==", familyId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data() as FamilyMember);
}

export async function getUserFamily(userId: string): Promise<{ family: Family | null; member: FamilyMember | null }> {
  // First find the user's membership
  const memberQ = query(familyMembersCollection, where("userId", "==", userId));
  const memberSnap = await getDocs(memberQ);
  
  if (memberSnap.empty) {
    return { family: null, member: null };
  }

  const member = memberSnap.docs[0].data() as FamilyMember;
  const family = await getFamilyDetails(member.familyId);

  return { family, member };
}

export async function joinFamilyWithToken(
  userId: string,
  userName: string,
  joinToken: string
): Promise<string> {
  // 1. Find family by token
  const tokenDoc = await getDoc(doc(joinTokensCollection, joinToken));
  
  if (!tokenDoc.exists()) {
    throw new Error("Invalid join code.");
  }
  
  const familyId = tokenDoc.data().familyId;

  // 2. Check if already a member
  const memberQ = query(familyMembersCollection, where("familyId", "==", familyId), where("userId", "==", userId));
  const memberSnap = await getDocs(memberQ);
  if (!memberSnap.empty) {
    throw new Error("You are already a member of this family.");
  }

  // 3. Add to family
  const now = new Date().toISOString();
  const newMember: FamilyMember = {
    id: generateFamilyMemberId(familyId, userId),
    familyId,
    userId,
    isLinkedAccount: true,
    name: userName,
    role: 'member', // Default role for invitees
    status: 'pending', // Requires admin approval
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    joinedAt: now,
    lastActive: now,
  };

  await setDoc(doc(familyMembersCollection, newMember.id!), newMember);
  await logAuditAction(familyId, userId, 'MEMBER_JOIN_REQUESTED', { memberId: newMember.id }, newMember.id!);
  
  return familyId;
}

export async function addManualMember(
  familyId: string,
  adminUid: string,
  memberData: {
    name: string;
    relationship?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    healthProfile?: {
      allergies: string[];
      conditions: string[];
      medications: string[];
    };
  }
): Promise<string> {
  const memberId = generateFamilyMemberId(familyId); // Deterministic ID for local profiles
  const now = new Date().toISOString();

  const newMember: FamilyMember = {
    id: memberId,
    familyId,
    userId: null,
    isLinkedAccount: false,
    createdBy: adminUid,
    name: memberData.name,
    relationship: memberData.relationship,
    gender: memberData.gender,
    dob: memberData.dob,
    bloodGroup: memberData.bloodGroup,
    phone: memberData.phone,
    email: memberData.email,
    healthProfile: memberData.healthProfile,
    role: 'member',
    status: 'local',
    createdAt: now,
    updatedAt: now,
    joinedAt: now,
    lastActive: now,
  };

  await setDoc(doc(familyMembersCollection, memberId), newMember);
  await logAuditAction(familyId, adminUid, 'LOCAL_PROFILE_CREATED', { memberId }, memberId);
  return memberId;
}

export async function updateFamily(familyId: string, updates: Partial<Family>): Promise<void> {
  updates.updatedAt = new Date().toISOString();
  await updateDoc(doc(familiesCollection, familyId), updates);
}

export async function updateMemberRole(memberId: string, newRole: FamilyRole): Promise<void> {
  await updateDoc(doc(familyMembersCollection, memberId), { role: newRole, updatedAt: new Date().toISOString() });
}

export async function approveMember(memberId: string): Promise<void> {
  await updateDoc(doc(familyMembersCollection, memberId), { status: 'linked', updatedAt: new Date().toISOString() });
}

export async function removeMember(memberId: string, performedByUid?: string): Promise<void> {
  const memberDoc = await getDoc(doc(familyMembersCollection, memberId));
  if (!memberDoc.exists()) return;
  const member = memberDoc.data() as FamilyMember;
  
  const family = await getFamilyDetails(member.familyId);
  if (family && family.ownerUid === member.userId) {
    throw new Error("The family owner cannot leave or be removed. Transfer ownership first or delete the family.");
  }

  await deleteDoc(doc(familyMembersCollection, memberId));
  if (performedByUid) {
    await logAuditAction(member.familyId, performedByUid, 'MEMBER_REMOVED', { removedMemberId: memberId }, memberId);
  }
}

export async function deleteFamily(familyId: string, ownerUid?: string): Promise<void> {
  // 1. Delete all members
  const members = await getFamilyMembers(familyId);
  await runTransaction(db, async (transaction) => {
    for (const m of members) {
      if (m.id) {
        transaction.delete(doc(familyMembersCollection, m.id));
      }
    }
    // 2. Delete the family doc
    transaction.delete(doc(familiesCollection, familyId));
  });
  
  if (ownerUid) {
    await logAuditAction(familyId, ownerUid, 'FAMILY_DELETED', {});
  }
}
