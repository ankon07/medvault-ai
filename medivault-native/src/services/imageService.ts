/**
 * MediVault AI - Image Service
 * Image capture and processing using expo-image-picker
 */

import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG } from '../constants';
import { uriToBase64 } from '../utils/imageUtils';

/**
 * Image picker options configuration
 */
const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: API_CONFIG.JPEG_QUALITY,
  base64: true,
};

/**
 * Result from image capture/selection
 */
export interface ImageResult {
  success: boolean;
  base64?: string;
  uri?: string;
  error?: string;
}

/**
 * Request camera permissions
 * @returns Promise resolving to permission granted status
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Request media library permissions
 * @returns Promise resolving to permission granted status
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Check camera permission status
 * @returns Promise resolving to permission status
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === 'granted';
};

/**
 * Check media library permission status
 * @returns Promise resolving to permission status
 */
export const checkMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Capture image using device camera
 * @returns Promise resolving to ImageResult
 */
export const captureImage = async (): Promise<ImageResult> => {
  try {
    // Check/request camera permission
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        return {
          success: false,
          error: 'Camera permission is required to scan documents.',
        };
      }
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled) {
      return {
        success: false,
        error: 'Image capture was cancelled.',
      };
    }

    const asset = result.assets[0];
    
    // Get base64 data
    let base64Data = asset.base64;
    
    // If base64 not available from picker, convert from URI
    if (!base64Data && asset.uri) {
      base64Data = await uriToBase64(asset.uri);
    }

    if (!base64Data) {
      return {
        success: false,
        error: 'Failed to process image data.',
      };
    }

    return {
      success: true,
      base64: base64Data,
      uri: asset.uri,
    };
  } catch (error) {
    console.error('Camera capture error:', error);
    return {
      success: false,
      error: 'Failed to capture image. Please try again.',
    };
  }
};

/**
 * Select image from device gallery
 * @returns Promise resolving to ImageResult
 */
export const selectImage = async (): Promise<ImageResult> => {
  try {
    // Check/request media library permission
    const hasPermission = await checkMediaLibraryPermission();
    if (!hasPermission) {
      const granted = await requestMediaLibraryPermission();
      if (!granted) {
        return {
          success: false,
          error: 'Photo library permission is required to select images.',
        };
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled) {
      return {
        success: false,
        error: 'Image selection was cancelled.',
      };
    }

    const asset = result.assets[0];
    
    // Get base64 data
    let base64Data = asset.base64;
    
    // If base64 not available from picker, convert from URI
    if (!base64Data && asset.uri) {
      base64Data = await uriToBase64(asset.uri);
    }

    if (!base64Data) {
      return {
        success: false,
        error: 'Failed to process image data.',
      };
    }

    return {
      success: true,
      base64: base64Data,
      uri: asset.uri,
    };
  } catch (error) {
    console.error('Image selection error:', error);
    return {
      success: false,
      error: 'Failed to select image. Please try again.',
    };
  }
};

/**
 * Show action sheet to choose between camera and gallery
 * This is a placeholder - actual implementation should use an alert or action sheet
 * @param onCapture - Callback for camera selection
 * @param onSelect - Callback for gallery selection
 */
export const showImageSourceOptions = (
  onCapture: () => void,
  onSelect: () => void
): { title: string; action: () => void }[] => {
  return [
    { title: 'Take Photo', action: onCapture },
    { title: 'Choose from Gallery', action: onSelect },
  ];
};

export default {
  captureImage,
  selectImage,
  requestCameraPermission,
  requestMediaLibraryPermission,
  checkCameraPermission,
  checkMediaLibraryPermission,
  showImageSourceOptions,
};
