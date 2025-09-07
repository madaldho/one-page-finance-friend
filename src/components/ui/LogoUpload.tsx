import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Camera, X, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function LogoUpload({ value, onChange, className, disabled }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB.');
      }

      const fileExt = file.name.split('.').pop();
      const filename = `${user?.id}-wallet-${Date.now()}.${fileExt}`;
      const filePath = `wallet-logos/${filename}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('wallet-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('wallet-logos')
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      
      toast({
        title: "Logo Diunggah",
        description: "Logo dompet berhasil diunggah",
      });
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah logo';
      toast({
        title: "Gagal Mengunggah Logo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    onChange(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Logo Dompet</span>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLogo}
            disabled={disabled || uploading}
            className="h-7 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Hapus
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Logo Preview */}
        <div className="relative">
          <div className={cn(
            "w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden",
            "transition-all duration-200 bg-gray-50/50",
            value ? "border-solid border-gray-200 bg-white shadow-sm" : "border-gray-300 hover:border-gray-400"
          )}>
            {value ? (
              <img
                src={value}
                alt="Logo dompet"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  console.error("Failed to load logo image");
                  onChange(null);
                }}
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <label
            htmlFor="logo-upload"
            className={cn(
              "inline-flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-xl cursor-pointer",
              "hover:bg-gray-50 hover:border-gray-400 transition-all duration-200",
              "text-sm font-medium text-gray-700 w-full justify-center",
              "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
              (disabled || uploading) && "opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-300"
            )}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-blue-600" />
                <span>{value ? 'Ganti Logo' : 'Upload Logo'}</span>
              </>
            )}
            <input
              id="logo-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={uploadLogo}
              disabled={disabled || uploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2 text-center">
            PNG, JPG hingga 2MB. Optimal: 64x64px
          </p>
        </div>
      </div>
    </div>
  );
}