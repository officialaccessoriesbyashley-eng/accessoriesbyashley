"use client";

import { useState, useRef, Suspense } from "react";
import Image from "next/image";
import {
  useDocument,
  useEditDocument,
  type DocumentHandle,
} from "@sanity/sdk-react";
import {
  Upload,
  X,
  Loader2,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_WIDTH = 1500;
const JPEG_QUALITY = 0.85;
const MAX_RETRIES = 1;

interface SanityImageAsset {
  _type: "image";
  _key: string;
  asset: {
    _type: "reference";
    _ref: string;
  };
}

interface ImageWithUrl {
  _key: string;
  _type: string;
  asset: {
    _ref: string;
    url?: string;
  } | null;
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_WIDTH) {
        // No resize needed — still convert to JPEG to save size
      } else {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" },
          );
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadFile(file: File, attempt = 0): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      return uploadFile(file, attempt + 1);
    }
    throw new Error(await res.text());
  }
  const { assetId } = await res.json();
  return assetId as string;
}

function ImageUploaderContent(handle: DocumentHandle) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images } = useDocument({ ...handle, path: "images" });
  const editImages = useEditDocument({ ...handle, path: "images" });

  const currentImages = (images as ImageWithUrl[] | null) ?? [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgress(`Compressing ${files.length} image${files.length > 1 ? "s" : ""}…`);

    try {
      const compressed = await Promise.all(files.map(compressImage));

      let done = 0;
      setProgress(`Uploading 0 of ${compressed.length}…`);

      const results = await Promise.allSettled(
        compressed.map(async (file) => {
          const assetId = await uploadFile(file);
          done += 1;
          setProgress(`Uploading ${done} of ${compressed.length}…`);
          return assetId;
        }),
      );

      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);

      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (succeeded.length > 0) {
        const newImages: SanityImageAsset[] = succeeded.map((assetId) => ({
          _type: "image",
          _key: crypto.randomUUID(),
          asset: { _type: "reference", _ref: assetId },
        }));
        editImages([...currentImages, ...newImages]);
      }

      if (failedCount > 0) {
        setError(
          `${failedCount} of ${files.length} image${failedCount > 1 ? "s" : ""} failed — try uploading them again.`,
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed — please try again.");
    } finally {
      setIsUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (keyToRemove: string) => {
    const updated = currentImages.filter((img) => img._key !== keyToRemove);
    editImages(updated.length > 0 ? updated : null);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentImages.length) return;
    const updated = [...currentImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    editImages(updated);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800/40 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {currentImages.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {currentImages.map((image, index) => (
              <ImageThumbnail
                key={image._key}
                image={image}
                index={index}
                isFirst={index === 0}
                onRemove={() => handleRemoveImage(image._key)}
                onMoveUp={() => handleMoveImage(index, index - 1)}
                onMoveDown={() => handleMoveImage(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < currentImages.length - 1}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            First image is the main product image.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-8 dark:border-zinc-700">
          <ImageIcon className="mb-2 h-10 w-10 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No images uploaded</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Click upload to add product images
          </p>
        </div>
      )}
    </div>
  );
}

interface ImageThumbnailProps {
  image: ImageWithUrl;
  index: number;
  isFirst: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ImageThumbnail({
  image,
  isFirst,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ImageThumbnailProps) {
  const assetRef = image.asset?._ref;
  let imageUrl: string | null = null;

  if (assetRef) {
    const match = assetRef.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
    if (match) {
      const [, id, dimensions, format] = match;
      imageUrl = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${id}-${dimensions}.${format}`;
    }
  }

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800",
        isFirst && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900",
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="Product image" fill className="object-cover" sizes="150px" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="h-8 w-8 text-zinc-400" />
        </div>
      )}

      {isFirst && (
        <div className="absolute left-2 top-2 rounded bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white">
          Main
        </div>
      )}

      {/* Mobile: always-visible controls (no hover on touch screens) */}
      <div className="absolute inset-0 sm:hidden">
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-zinc-800 shadow disabled:opacity-30 dark:bg-zinc-800/90 dark:text-zinc-100"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex h-6 w-6 items-center justify-center rounded bg-white/90 text-zinc-800 shadow disabled:opacity-30 dark:bg-zinc-800/90 dark:text-zinc-100"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop: hover overlay */}
      <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ImageUploaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
      </div>
    </div>
  );
}

export function ImageUploader(props: DocumentHandle) {
  return (
    <Suspense fallback={<ImageUploaderSkeleton />}>
      <ImageUploaderContent {...props} />
    </Suspense>
  );
}
