import React, { useState, useRef } from 'react';
import { Upload, X, Image, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  preview?: string | null;
  onClearPreview?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  uploading?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function FileUpload({
  onFileSelect,
  preview,
  onClearPreview,
  accept = "image/*",
  maxSize = 5,
  uploading = false,
  disabled = false,
  className,
  placeholder = "Upload image"
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept === "image/*" && !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleClearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearPreview?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
          />
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleClearPreview}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
          dragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          disabled || uploading ? "opacity-50 cursor-not-allowed" : "",
          !preview ? "hover:bg-gray-50" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              {preview ? (
                <Image className="h-6 w-6 text-gray-400" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {preview ? "Change image" : placeholder}
              </p>
              <p className="text-xs text-gray-400">
                Drag & drop or click to browse
              </p>
              {maxSize && (
                <p className="text-xs text-gray-400">
                  Max size: {maxSize}MB
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}