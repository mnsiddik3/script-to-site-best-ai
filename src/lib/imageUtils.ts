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
 * Detects a low-power / mobile device so we can use a smaller payload there.
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (!!coarse && lowCores);
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Optimize an image for Gemini API by resizing and encoding to JPEG base64.
 * - Desktop: longest side 2048px @ 0.9 quality
 * - Mobile: longest side 1280px @ 0.8 quality (much smaller upload + faster decode)
 * Uses createImageBitmap + OffscreenCanvas when available (off main thread, far
 * faster on phones than <img> + toDataURL).
 */
export const optimizeImageForGemini = async (
  file: File,
  maxSide?: number,
  quality?: number
): Promise<{ base64Data: string; mimeType: string }> => {
  const mobile = isMobileDevice();
  const targetSide = maxSide ?? (mobile ? 1280 : 2048);
  const targetQuality = quality ?? (mobile ? 0.8 : 0.9);

  try {
    let width: number;
    let height: number;
    let source: ImageBitmap | HTMLImageElement;

    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    } else {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
      });
      source = img;
      width = img.width;
      height = img.height;
    }

    const longest = Math.max(width, height);
    const scale = longest > targetSide ? targetSide / longest : 1;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    let blob: Blob | null = null;

    if (typeof OffscreenCanvas === 'function') {
      const canvas = new OffscreenCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = mobile ? 'medium' : 'high';
      ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: targetQuality });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = mobile ? 'medium' : 'high';
      ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', targetQuality)
      );
    }

    if ('close' in source && typeof source.close === 'function') source.close();
    if (!blob) throw new Error('Encoding failed');

    const base64Data = await blobToBase64(blob);
    return { base64Data, mimeType: 'image/jpeg' };
  } catch (e) {
    console.warn('Optimization failed, falling back to original image:', e);
    const base64Data = await blobToBase64(file);
    return { base64Data, mimeType: file.type || 'image/jpeg' };
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