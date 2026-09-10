'use client';

import { useCallback, useRef, useState, type DragEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeBytes?: number;
}

export function FileDropzone({
  file,
  onFileSelect,
  accept = '.csv',
  maxSizeBytes = 5 * 1024 * 1024,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (candidate: File) => {
      setError(null);

      if (!candidate.name.toLowerCase().endsWith('.csv')) {
        setError('Only .csv files are accepted.');
        return;
      }

      if (candidate.size > maxSizeBytes) {
        setError(`File exceeds the maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
        return;
      }

      onFileSelect(candidate);
    },
    [maxSizeBytes, onFileSelect]
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) validateAndSelect(dropped);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-card border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-text-primary">{file.name}</p>
            <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFileSelect(null)}
          aria-label="Remove file"
          className="text-text-muted hover:text-negative"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed p-10 text-center transition-colors duration-150',
          isDragging ? 'border-primary bg-primary-soft' : 'border-border hover:border-border-strong'
        )}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-text-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">Drop your CSV file here or click to browse</p>
        <p className="mt-1 text-xs text-text-muted">
          Supports CSV files up to {Math.round(maxSizeBytes / (1024 * 1024))}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) validateAndSelect(selected);
          }}
        />
      </div>
      {error && <p className="mt-2 text-xs text-negative">{error}</p>}
    </div>
  );
}
