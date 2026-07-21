import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot
} from "firebase/storage";
import { storage } from "./firebase";

export const uploadFile = (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

export const deleteAvatar = async (uid: string): Promise<void> => {
  try {
    await deleteFile(`users/${uid}/profile/avatar`);
  } catch (err: any) {
    if (err.code !== 'storage/object-not-found') throw err;
  }
};

export const uploadAvatar = (
  uid: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return uploadFile(`users/${uid}/profile/avatar`, file, onProgress);
};

export const uploadMedicalRecord = (
  familyId: string,
  memberId: string,
  recordId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const uniqueFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  return uploadFile(`records/${familyId}/${memberId}/${recordId}/${uniqueFileName}`, file, onProgress);
};

export const deleteMedicalRecordFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (err: any) {
    if (err.code !== 'storage/object-not-found') {
      console.error("Failed to delete record file:", err);
    }
  }
};
