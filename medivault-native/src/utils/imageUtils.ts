/**
 * MediVault AI - Image Utilities
 * Helper functions for image processing
 */

import { API_CONFIG } from '../constants';

/**
 * Get the medication icon name based on type
 * @param type - Medication type string (e.g., "Tablet", "Syrup")
 * @returns Icon name for lucide-react-native
 */
export const getMedicationIconName = (type?: string): string => {
  if (!type) return 'Tablets';
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('syrup') || lowerType.includes('liquid')) {
    return 'Droplets';
  }
  if (lowerType.includes('capsule')) {
    return 'Pill';
  }
  if (lowerType.includes('cream') || lowerType.includes('ointment')) {
    return 'Pipette';
  }
  if (lowerType.includes('injection') || lowerType.includes('syringe')) {
    return 'Syringe';
  }
  if (lowerType.includes('inhaler')) {
    return 'Wind';
  }
  if (lowerType.includes('drops')) {
    return 'Droplet';
  }
  
  return 'Tablets';
};

/**
 * Convert image URI to base64 string
 * @param uri - Local image URI from image picker
 * @returns Promise resolving to base64 string
 */
export const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix if present
        const base64Data = base64.includes(',') 
          ? base64.split(',')[1] 
          : base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URI to base64:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Create a base64 data URL from base64 string
 * @param base64 - Base64 encoded image data
 * @param mimeType - Image MIME type (default: image/jpeg)
 * @returns Data URL string
 */
export const createDataUrl = (
  base64: string, 
  mimeType: string = 'image/jpeg'
): string => {
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Validate if a string is valid base64
 * @param str - String to validate
 * @returns boolean
 */
export const isValidBase64 = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  try {
    // Check if string matches base64 pattern
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str);
  } catch {
    return false;
  }
};

/**
 * Get estimated file size from base64 string
 * @param base64 - Base64 encoded string
 * @returns Estimated size in bytes
 */
export const getBase64Size = (base64: string): number => {
  if (!base64) return 0;
  
  // Remove padding characters
  const padding = (base64.match(/=/g) || []).length;
  // Calculate size: base64 uses 4 chars to represent 3 bytes
  return Math.floor((base64.length * 3) / 4) - padding;
};

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Check if image size is within acceptable limits
 * @param base64 - Base64 encoded image
 * @param maxSizeMB - Maximum size in megabytes (default: 5)
 * @returns boolean
 */
export const isImageSizeValid = (
  base64: string, 
  maxSizeMB: number = 5
): boolean => {
  const sizeBytes = getBase64Size(base64);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeBytes <= maxSizeBytes;
};

/**
 * Get image dimensions configuration for API
 */
export const getImageConfig = () => ({
  maxWidth: API_CONFIG.MAX_IMAGE_WIDTH,
  quality: API_CONFIG.JPEG_QUALITY,
  mimeType: 'image/jpeg',
});
