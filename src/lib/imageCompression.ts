// Client-side image compression utility

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 4,
  maxWidthOrHeight: 2048,
  quality: 0.8,
};

/**
 * Compress an image file to reduce its size
 * Uses canvas-based compression for wide browser support
 */
export const compressImage = async (
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // If file is already small enough, return as-is
  const maxSizeBytes = opts.maxSizeMB * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const maxDim = opts.maxWidthOrHeight || 2048;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          // Use high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format
          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          let quality = opts.quality || 0.8;

          // Convert to blob with iterative quality reduction if needed
          const tryCompress = (currentQuality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                // If still too large and quality can be reduced, try again
                if (blob.size > maxSizeBytes && currentQuality > 0.3) {
                  tryCompress(currentQuality - 0.1);
                  return;
                }

                // Create new file from blob
                const compressedFile = new File([blob], file.name, {
                  type: outputType,
                  lastModified: Date.now(),
                });

                console.log(
                  `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
                );

                resolve(compressedFile);
              },
              outputType,
              currentQuality
            );
          };

          tryCompress(quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Check if compression is needed based on file size
 */
export const needsCompression = (file: File, maxSizeMB: number = 4): boolean => {
  return file.size > maxSizeMB * 1024 * 1024;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};
