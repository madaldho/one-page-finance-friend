import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Loader2, Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  loading?: boolean;
  currentFileUrl?: string | null;
  className?: string;
  placeholder?: string;
  showPreview?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*",
  maxSize = 5,
  loading = false,
  currentFileUrl,
  className,
  placeholder = "Pilih file...",
  showPreview = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File terlalu besar. Maksimal ${maxSize}MB.`;
    }
    
    if (accept && !accept.split(',').some(type => 
      file.type.match(type.trim().replace('*', '.*'))
    )) {
      return `Tipe file tidak didukung. Hanya ${accept} yang diperbolehkan.`;
    }
    
    return null;
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setError(null);
    onFileRemove?.();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300",
          loading && "opacity-50 pointer-events-none",
          "hover:border-gray-400 hover:bg-gray-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={loading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}
          
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={loading}
            >
              {loading ? "Mengunggah..." : placeholder}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              atau seret dan lepas file di sini
            </p>
            {maxSize && (
              <p className="text-xs text-gray-400">
                Maksimal {maxSize}MB
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Preview */}
      {showPreview && currentFileUrl && (
        <div className="relative">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
              {currentFileUrl ? (
                <img
                  src={currentFileUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Image className="h-6 w-6 text-gray-400 hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Logo saat ini
              </p>
              <p className="text-xs text-gray-500">
                Klik untuk mengganti
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}