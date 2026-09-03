// Utility functions for handling images safely

/**
 * Creates a safe object URL for an image file with automatic cleanup
 */
export const createImageUrl = (file: File): string => {
  try {
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Failed to create object URL:', error);
    return '';
  }
};

/**
 * Safely revokes an object URL
 */
export const revokeImageUrl = (url: string): void => {
  try {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.warn('Failed to revoke object URL:', error);
  }
};

/**
 * Validates image file type and size
 */
export const validateImage = (file: File, maxSizeInMB: number = 60): boolean => {
  if (!file.type.startsWith('image/')) {
    return false;
  }
  
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return false;
  }
  
  return true;
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets image file extension
 */
export const getImageExtension = (file: File): string => {
  return file.type.split('/')[1]?.toUpperCase() || 'Unknown';
};

/**
 * Optimize an image for Gemini API by resizing and encoding to JPEG base64
 * - Limits longest side to 2048px
 * - Encodes as JPEG at 0.9 quality for broad compatibility
 */
export const optimizeImageForGemini = async (
  file: File,
  maxSide: number = 2048,
  quality: number = 0.9
): Promise<{ base64Data: string; mimeType: string }> => {
  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  try {
    const dataUrl = await readAsDataURL(file);

    // Create image element
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const { width, height } = img;
    const longest = Math.max(width, height);
    const scale = longest > maxSide ? maxSide / longest : 1;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Always standardize to JPEG for best compatibility
    const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64Data = optimizedDataUrl.split(',')[1] || '';
    return { base64Data, mimeType: 'image/jpeg' };
  } catch (e) {
    console.warn('Optimization failed, falling back to original image:', e);
    // Fallback: return original base64 if optimization fails
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    return { base64Data: dataUrl.split(',')[1] || '', mimeType: file.type || 'image/jpeg' };
  }
};

// Convert video file to base64 for Gemini API
export const convertVideoToBase64 = async (
  file: File
): Promise<{ base64Data: string; mimeType: string }> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const base64Data = dataUrl.split(',')[1] || '';
  return { base64Data, mimeType: file.type || 'video/mp4' };
};