'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { resizeImageToDataUrl } from '@/lib/image';
import { useToast } from '@/hooks/useToast';

const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024; // 8MB — generous, since we resize down anyway

export interface AvatarUploadProps {
  name: string;
  avatarUrl: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function AvatarUpload({ name, avatarUrl, onChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }

    if (file.size > MAX_SOURCE_FILE_BYTES) {
      toast.error('Image is too large. Please choose a file under 8MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      onChange(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not process that image.');
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-card"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </motion.button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </div>

      <div className="text-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-medium text-primary hover:underline"
        >
          Change photo
        </button>
        {avatarUrl && (
          <>
            <span className="mx-2 text-text-muted">·</span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-text-muted hover:text-negative"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </>
        )}
        <p className="mt-1 text-xs text-text-muted">JPG, PNG or GIF. Resized automatically.</p>
      </div>
    </div>
  );
}
