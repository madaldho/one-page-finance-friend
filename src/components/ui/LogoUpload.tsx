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
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Logo Dompet</span>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeLogo}
            disabled={disabled || uploading}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
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
            "w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden",
            "transition-colors duration-200",
            value && "border-solid border-gray-200"
          )}>
            {value ? (
              <img
                src={value}
                alt="Logo dompet"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  console.error("Failed to load logo image");
                  onChange(null);
                }}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <label
            htmlFor="logo-upload"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer",
              "hover:bg-gray-50 transition-colors duration-200",
              "text-sm font-medium text-gray-700",
              (disabled || uploading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {value ? 'Ganti Logo' : 'Upload Logo'}
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
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG hingga 2MB. Ukuran optimal: 64x64px
          </p>
        </div>
      </div>
    </div>
  );
}