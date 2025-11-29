/**
 * Firebase Cloud Storage Service
 * Handles file upload and download operations for MediVault
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTaskSnapshot,
  StorageReference,
  UploadTask,
} from 'firebase/storage';
import { storage } from '../config/firebase';

// Types
export interface UploadResult {
  downloadUrl: string;
  fullPath: string;
  name: string;
  size: number;
  contentType: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface FileMetadata {
  name: string;
  size: number;
  contentType: string;
  fullPath: string;
  timeCreated: string;
  updated: string;
}

// Storage paths
const STORAGE_PATHS = {
  userDocuments: 'documents',
  userImages: 'images',
  userProfilePictures: 'profile_pictures',
};

/**
 * Generate a unique filename with timestamp
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
};

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  userId: string,
  filePath: string,
  fileBlob: Blob,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const uniqueFileName = generateUniqueFileName(fileName);
  const storageRef = ref(storage, `${STORAGE_PATHS.userDocuments}/${userId}/${uniqueFileName}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, fileBlob);
    
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress,
            state: snapshot.state as UploadProgress['state'],
          });
        }
      },
      (error) => {
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const metadata = await getMetadata(uploadTask.snapshot.ref);
          
          resolve({
            downloadUrl,
            fullPath: metadata.fullPath,
            name: metadata.name,
            size: metadata.size,
            contentType: metadata.contentType || 'application/octet-stream',
          });
        } catch (error: any) {
          reject(new Error(`Failed to get download URL: ${error.message}`));
        }
      }
    );
  });
};

/**
 * Upload an image file (with compression considerations)
 */
export const uploadImage = async (
  userId: string,
  imageUri: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Fetch the image and convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const uniqueFileName = generateUniqueFileName(fileName);
    const storageRef = ref(storage, `${STORAGE_PATHS.userImages}/${userId}/${uniqueFileName}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as UploadProgress['state'],
            });
          }
        },
        (error) => {
          reject(new Error(`Image upload failed: ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = await getMetadata(uploadTask.snapshot.ref);
            
            resolve({
              downloadUrl,
              fullPath: metadata.fullPath,
              name: metadata.name,
              size: metadata.size,
              contentType: metadata.contentType || 'image/jpeg',
            });
          } catch (error: any) {
            reject(new Error(`Failed to get image URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

/**
 * Upload a profile picture
 */
export const uploadProfilePicture = async (
  userId: string,
  imageUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Profile pictures always use the same filename per user (overwrite)
    const storageRef = ref(storage, `${STORAGE_PATHS.userProfilePictures}/${userId}/profile.jpg`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress,
              state: snapshot.state as UploadProgress['state'],
            });
          }
        },
        (error) => {
          reject(new Error(`Profile picture upload failed: ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (error: any) {
            reject(new Error(`Failed to get profile picture URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }
};

/**
 * Get download URL for a file
 */
export const getFileDownloadUrl = async (filePath: string): Promise<string> => {
  const storageRef = ref(storage, filePath);
  return await getDownloadURL(storageRef);
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
};

/**
 * List all files in a user's documents folder
 */
export const listUserDocuments = async (userId: string): Promise<FileMetadata[]> => {
  const folderRef = ref(storage, `${STORAGE_PATHS.userDocuments}/${userId}`);
  const result = await listAll(folderRef);
  
  const files: FileMetadata[] = [];
  for (const itemRef of result.items) {
    const metadata = await getMetadata(itemRef);
    files.push({
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType || 'application/octet-stream',
      fullPath: metadata.fullPath,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
    });
  }
  
  return files;
};

/**
 * List all images in a user's images folder
 */
export const listUserImages = async (userId: string): Promise<FileMetadata[]> => {
  const folderRef = ref(storage, `${STORAGE_PATHS.userImages}/${userId}`);
  const result = await listAll(folderRef);
  
  const files: FileMetadata[] = [];
  for (const itemRef of result.items) {
    const metadata = await getMetadata(itemRef);
    files.push({
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType || 'image/jpeg',
      fullPath: metadata.fullPath,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
    });
  }
  
  return files;
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (filePath: string): Promise<FileMetadata> => {
  const storageRef = ref(storage, filePath);
  const metadata = await getMetadata(storageRef);
  
  return {
    name: metadata.name,
    size: metadata.size,
    contentType: metadata.contentType || 'application/octet-stream',
    fullPath: metadata.fullPath,
    timeCreated: metadata.timeCreated,
    updated: metadata.updated,
  };
};

/**
 * Delete all files in a user's folder (use with caution)
 */
export const deleteAllUserFiles = async (
  userId: string,
  folder: 'documents' | 'images' = 'documents'
): Promise<void> => {
  const path = folder === 'documents' 
    ? STORAGE_PATHS.userDocuments 
    : STORAGE_PATHS.userImages;
  const folderRef = ref(storage, `${path}/${userId}`);
  const result = await listAll(folderRef);
  
  const deletePromises = result.items.map((itemRef) => deleteObject(itemRef));
  await Promise.all(deletePromises);
};
