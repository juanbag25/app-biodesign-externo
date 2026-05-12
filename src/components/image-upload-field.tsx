"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadFieldProps {
  label: string;
  existingUrl: string | null;
  readOnly: boolean;
  onChange: (file: File | null) => void;
}

export default function ImageUploadField({
  label,
  existingUrl,
  readOnly,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar los 5 MB.");
      return;
    }

    onChange(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleRemove() {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const imageUrl = preview || existingUrl;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-text-secondary">{label}</p>

      {imageUrl ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <Image
            src={imageUrl}
            alt={label}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
            unoptimized={!!preview}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
              aria-label="Eliminar imagen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ) : readOnly ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border-subtle bg-surface-hover">
          <span className="text-sm text-text-muted">Sin imagen</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-blue-500 hover:bg-surface-hover transition-colors"
        >
          <div className="text-center">
            <svg
              className="mx-auto h-8 w-8 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <span className="mt-1 block text-xs text-text-muted">
              Subir imagen
            </span>
          </div>
        </button>
      )}

      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
