import { useState, useRef } from "react";
import type { ChatMessage } from "../types/chat";

export function useImageCapture() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageThumbnail, setImageThumbnail] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resize helper for local storage persistence
  const resizeImageToDataUrl = (file: File, maxDim = 300): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          } else {
            resolve("");
          }
        };
        img.onerror = () => resolve("");
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelection = (file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Unsupported format. Please select a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller image.");
      return;
    }
    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    
    resizeImageToDataUrl(file).then(dataUrl => {
      setImageThumbnail(dataUrl);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleImageSelection(file);
    }
  };

  const findCachedImageDescription = (messages: ChatMessage[]): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].imageDescription) {
        return messages[i].imageDescription ?? null;
      }
    }
    return null;
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageThumbnail(null);
  };

  return {
    selectedImage,
    setSelectedImage,
    imagePreviewUrl,
    setImagePreviewUrl,
    imageThumbnail,
    setImageThumbnail,
    isCameraOpen,
    setIsCameraOpen,
    uploadProgress,
    setUploadProgress,
    isDragging,
    setIsDragging,
    fileInputRef,
    handleImageSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    findCachedImageDescription,
    clearImage,
  };
}
export default useImageCapture;
