import { setDoc, updateDoc, deleteDoc } from "@/firebase/firestoreLogger";
import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Family } from "@/firebase/collections";
import { logAuditAction } from "./familyService";
import { generateFamilyMemberId } from "@/utils/familyUtils";

export async function runHardeningMigration() {
  console.log("Starting Architectural Hardening Migration...");
  let familiesUpdated = 0;
  let membersUpdated = 0;
  let membersRecreated = 0;
  let auditLogsWritten = 0;
  let auditLogFailures = 0;

  try {
    console.log("[Operation]: getDocs on 'families' collection. ID: N/A");
    const familiesSnap = await getDocs(collection(db, "families"));
    console.log("[Success]: getDocs on 'families' completed.");

    const familiesMap = new Map<string, Family>();

    // 1. Migrate Families
    for (const familyDoc of familiesSnap.docs) {
      const familyData = familyDoc.data() as any;
      familiesMap.set(familyDoc.id, familyData as Family);
      
      const updates: any = {};
      
      // Remove adminUids if it exists
      if (familyData.adminUids !== undefined) {
        updates.adminUids = null; 
      }

      // Ensure updatedAt exists
      if (!familyData.updatedAt) {
        updates.updatedAt = familyData.createdAt || new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        const cleanFamily = { ...familyData, ...updates };
        delete cleanFamily.adminUids;

        console.log(`[Operation]: setDoc on 'families' collection. ID: ${familyDoc.id}`);
        try {
          await setDoc(doc(db, "families", familyDoc.id), cleanFamily);
          console.log(`[Success]: setDoc on 'families' completed. ID: ${familyDoc.id}`);
          familiesUpdated++;
        } catch (error: any) {
          console.error(`[Error]: setDoc failed on 'families'. ID: ${familyDoc.id}`);
          console.error("Firebase error code:", error.code);
          console.error("Firebase error message:", error.message);
          throw error;
        }
      }
    }

    // 2. Migrate Family Members
    console.log("[Operation]: getDocs on 'familyMembers' collection. ID: N/A");
    const membersSnap = await getDocs(collection(db, "familyMembers"));
    console.log("[Success]: getDocs on 'familyMembers' completed.");

    const now = new Date().toISOString();

    for (const memberDoc of membersSnap.docs) {
      const memberData = memberDoc.data() as any;
      let needsUpdate = false;
      let newId = memberDoc.id;
      let needsRecreation = false;

      const family = familiesMap.get(memberData.familyId);

      // Determine deterministic ID for linked members and local members
      if (memberData.userId) {
        const expectedId = generateFamilyMemberId(memberData.familyId, memberData.userId);
        if (memberDoc.id !== expectedId) {
          newId = expectedId;
          needsRecreation = true;
        }
      } else {
        // Local members have no userId, so ID should be familyId_suffix
        if (!memberDoc.id.startsWith(`${memberData.familyId}_`)) {
          newId = generateFamilyMemberId(memberData.familyId, memberDoc.id);
          needsRecreation = true;
        }
      }

      // Rename active to linked
      if (memberData.status === 'active') {
        memberData.status = 'linked';
        needsUpdate = true;
      }

      // Set owner role
      if (family && memberData.userId === family.ownerUid && memberData.role !== 'owner') {
        memberData.role = 'owner';
        needsUpdate = true;
      }

      // Ensure timestamps
      if (!memberData.updatedAt) {
        memberData.updatedAt = memberData.createdAt || memberData.joinedAt || now;
        needsUpdate = true;
      }

      // Execute Changes
      if (needsRecreation) {
        memberData.id = newId;
        
        console.log(`[Operation]: setDoc on 'familyMembers' collection. ID: ${newId}`);
        try {
          await setDoc(doc(db, "familyMembers", newId), memberData);
          console.log(`[Success]: setDoc on 'familyMembers' completed. ID: ${newId}`);
        } catch (error: any) {
          console.error(`[Error]: setDoc failed on 'familyMembers'. ID: ${newId}`);
          console.error("Firebase error code:", error.code);
          console.error("Firebase error message:", error.message);
          throw error;
        }

        console.log(`[Operation]: deleteDoc on 'familyMembers' collection. ID: ${memberDoc.id}`);
        try {
          await deleteDoc(doc(db, "familyMembers", memberDoc.id));
          console.log(`[Success]: deleteDoc on 'familyMembers' completed. ID: ${memberDoc.id}`);
          membersRecreated++;
        } catch (error: any) {
          console.error(`[Error]: deleteDoc failed on 'familyMembers'. ID: ${memberDoc.id}`);
          console.error("Firebase error code:", error.code);
          console.error("Firebase error message:", error.message);
          throw error;
        }

        console.log(`[Operation]: logAuditAction (setDoc on 'auditLogs'). ID: N/A`);
        try {
          await logAuditAction(memberData.familyId, 'SYSTEM_MIGRATION', 'MEMBER_ID_MIGRATED', { oldId: memberDoc.id, newId });
          console.log(`[Success]: logAuditAction completed.`);
          auditLogsWritten++;
        } catch (error: any) {
          console.warn(
            "Audit logging failed. Continuing migration...",
            error
          );
          auditLogFailures++;
        }
        
      } else if (needsUpdate) {
        console.log(`[Operation]: updateDoc on 'familyMembers' collection. ID: ${memberDoc.id}`);
        try {
          await updateDoc(doc(db, "familyMembers", memberDoc.id), memberData);
          console.log(`[Success]: updateDoc on 'familyMembers' completed. ID: ${memberDoc.id}`);
          membersUpdated++;
        } catch (error: any) {
          console.error(`[Error]: updateDoc failed on 'familyMembers'. ID: ${memberDoc.id}`);
          console.error("Firebase error code:", error.code);
          console.error("Firebase error message:", error.message);
          throw error;
        }
      }
    }

    console.log("====================================");
    console.log("Migration Summary");
    console.log("====================================");
    console.log(`Families migrated: ${familiesUpdated}`);
    console.log(`Members migrated: ${membersUpdated}`);
    console.log(`Legacy members deleted: ${membersRecreated}`);
    console.log(`Audit logs written: ${auditLogsWritten}`);
    console.log(`Audit log failures: ${auditLogFailures}`);
    console.log("");
    console.log("Migration completed successfully.");

    alert(`Migration Complete! Families: ${familiesUpdated}, Members Updated: ${membersUpdated}, Legacy Deleted: ${membersRecreated}`);
  } catch (error) {
    console.error("Migration failed:", error);
    alert("Migration failed. Check console.");
  }
}

