import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface PickedMedia {
  localUrl: string; // The URL to show in the UI preview img src
  file: File | Blob; // The actual file ready for uploading to Supabase
}

export function useMediaPicker() {
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE_MB = 5;
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Validates file size and type regardless of where it came from
  const validateFile = (file: File | Blob, name: string): boolean => {
    // Check Size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(`Image is too large (${fileSizeMB.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }

    // Check Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or WEBP image.`);
      return false;
    }

    return true;
  };

  /**
   * Helper to convert Base64 string from Capacitor to a native Web Blob
   * This is required because Supabase storage prefers Files or Blobs over pure base64 strings.
   */
  const base64ToBlob = async (base64Data: string, contentType: string) => {
    try {
      const response = await fetch(`data:${contentType};base64,${base64Data}`);
      return await response.blob();
    } catch {
      throw new Error("Failed to process image data");
    }
  };

  /**
   * Main function to trigger the Media Picker
   * Works on Web (via hidden input fallback) and Native Android (via Capacitor)
   */
  const pickImage = async (): Promise<PickedMedia | null> => {
    setIsPicking(true);
    setError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        // --- NATIVE ANDROID/IOS PICKER ---
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: true, // Allows user to crop image before confirming
          resultType: CameraResultType.Base64, // We need the actual data to upload
          source: CameraSource.Prompt, // Prompts user to choose Camera or Gallery
        });

        if (photo.base64String) {
          const mimeType = `image/${photo.format}`;
          const blob = await base64ToBlob(photo.base64String, mimeType);
          
          if (!validateFile(blob, 'native_upload')) {
             return null;
          }

          // Create a local blob URL so the UI can preview it instantly without uploading yet
          const localUrl = URL.createObjectURL(blob);
          
          return { localUrl, file: blob };
        }
        
      } else {
        // --- WEB BROWSER FALLBACK ---
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/jpeg, image/png, image/webp';
          
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (file) {
              if (!validateFile(file, file.name)) {
                resolve(null);
                return;
              }
              const localUrl = URL.createObjectURL(file);
              resolve({ localUrl, file });
            } else {
              resolve(null);
            }
          };
          
          // Trigger the file browser
          input.click();
        });
      }
    } catch (err: any) {
      // User cancelled picker or threw an error
      console.warn("Media picker cancelled or failed:", err);
      // We don't necessarily want to show an error if they just pressed "cancel"
    } finally {
      setIsPicking(false);
    }
    
    return null;
  };

  return {
    pickImage,
    isPicking,
    pickerError: error,
    clearPickerError: () => setError(null)
  };
}
