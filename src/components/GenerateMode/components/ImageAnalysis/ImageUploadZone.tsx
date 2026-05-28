import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageFile } from '../../types';

interface ImageUploadZoneProps {
  images: ImageFile[];
  onAddImages: (images: ImageFile[]) => void;
  onRemoveImage: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_IMAGES = 10;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({
        base64,
        mimeType: file.type,
        preview: dataUrl,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  onNext,
  onBack,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`${file.name}: unsupported format. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`${file.name}: too large. Maximum ${MAX_SIZE_MB}MB per image.`);
        continue;
      }
      validFiles.push(file);
    }

    const remaining = MAX_IMAGES - images.length;
    const toProcess = validFiles.slice(0, remaining);

    if (validFiles.length > remaining) {
      setError(`Only ${remaining} more image(s) can be added (max ${MAX_IMAGES}).`);
    }

    const newImages: ImageFile[] = [];
    for (const file of toProcess) {
      const { base64, mimeType, preview } = await readFileAsBase64(file);
      newImages.push({ base64, mimeType, preview, name: file.name, size: file.size });
    }

    if (newImages.length > 0) {
      onAddImages(newImages);
    }
  }, [images.length, onAddImages]);

  const handleDrop: React.DragEventHandler = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (e.target.files?.length) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <section className="">
      <div className="mb-4">
        <p className="label-mono mb-1">Step 02 / Images</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Upload product images
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Drag &amp; drop or click to upload up to {MAX_IMAGES} images. JPEG / PNG / WebP, max {MAX_SIZE_MB}MB each.
        </p>
      </div>

      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Drag and drop images or click to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-3 border border-dashed p-12 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2',
          isDragging
            ? 'border-signal bg-signal/[0.04]'
            : 'border-border bg-card hover:border-foreground/40 hover:bg-muted/30',
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <div className="text-center">
          <p className="label-mono mb-1">Drop images or click to browse</p>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {images.length} / {MAX_IMAGES} uploaded
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-4 sm:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img.preview}
                alt={img.name}
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover border border-border"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }}
                aria-label={`Remove ${img.name}`}
                className="absolute -top-2 -right-2 h-7 w-7 bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground truncate" title={img.name}>
                {img.name}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={images.length === 0}>
          Next: Select model
        </Button>
      </div>
    </section>
  );
};
