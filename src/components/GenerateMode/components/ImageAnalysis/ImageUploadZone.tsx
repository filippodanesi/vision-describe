import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Upload, X, ImageIcon } from 'lucide-react';
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
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Product Images</CardTitle>
        <CardDescription>
          Drag & drop or click to upload up to {MAX_IMAGES} images (JPEG, PNG, WebP — max {MAX_SIZE_MB}MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/40'
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {images.length}/{MAX_IMAGES} images uploaded
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full aspect-square object-cover rounded-md border"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-[9px] text-muted-foreground truncate mt-0.5">{img.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={images.length === 0}>
            Next: Select Model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
