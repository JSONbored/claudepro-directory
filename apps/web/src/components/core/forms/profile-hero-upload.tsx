'use client';

/**
 * Profile Hero Image Upload Component
 * Handles hero image upload with preview
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { uploadUserImage, deleteUserImage } from '@heyclaude/web-runtime/actions/user-images';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { Camera, X } from '@heyclaude/web-runtime/icons';
import { usePathname } from 'next/navigation';
import { useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import { useSafeAction } from '@heyclaude/web-runtime/hooks/use-safe-action';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { FORM_CONFIG } from '@heyclaude/web-runtime/config/unified-config';
import { useAuthModal } from '@/src/hooks/use-auth-modal';

interface ProfileHeroUploadProps {
  currentHeroUrl: string | null;
  onHeroChange?: (newUrl: string | null) => void;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x80_00;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function ProfileHeroUpload({ currentHeroUrl, onHeroChange }: ProfileHeroUploadProps) {
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'ProfileHeroUpload' });
  const { openAuthModal } = useAuthModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(currentHeroUrl);
  const {
    value: isUploading,
    setTrue: setIsUploadingTrue,
    setFalse: setIsUploadingFalse,
  } = useBoolean();
  const { executeAsync: uploadHero } = useSafeAction(uploadUserImage);
  const { executeAsync: deleteHero } = useSafeAction(deleteUserImage);
  const runLoggedAsync = useLoggedAsync({
    scope: 'ProfileHeroUpload',
    defaultMessage: 'Hero image upload failed',
    defaultRethrow: false,
  });

  const maxFileSize = FORM_CONFIG.max_file_size_mb * 1024 * 1024;
  const maxDimension = FORM_CONFIG.max_image_dimension_px;

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (status === 'loading') {
        return;
      }

      if (!user) {
        openAuthModal({
          valueProposition: 'Sign in to upload hero image',
          redirectTo: pathname ?? undefined,
        });
        return;
      }

      // Client-side validation
      if (file.size > maxFileSize) {
        toasts.error.actionFailed(
          `File too large. Maximum size is ${FORM_CONFIG.max_file_size_mb}MB.`
        );
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toasts.error.actionFailed('Invalid file type. Only JPG, PNG, and WebP are allowed.');
        return;
      }

      // Verify actual file content matches MIME type (magic bytes check)
      try {
        const buffer = await file.slice(0, 12).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const isValidImage =
          (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
          (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
          (bytes[0] === 0x52 &&
            bytes[1] === 0x49 &&
            bytes[2] === 0x46 &&
            bytes[3] === 0x46 &&
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50);

        if (!isValidImage) {
          toasts.error.actionFailed(
            'Invalid image file. File content does not match expected format.'
          );
          return;
        }
      } catch {
        toasts.error.actionFailed('Failed to validate image file.');
        return;
      }

      // Check dimensions
      try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        bitmap.close();

        if (width > maxDimension || height > maxDimension) {
          toasts.error.actionFailed(
            `Image too large. Maximum dimensions are ${maxDimension}x${maxDimension}px.`
          );
          return;
        }
      } catch {
        toasts.error.actionFailed('Failed to read image dimensions.');
        return;
      }

      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setHeroPreview(previewUrl);

      // Upload
      setIsUploadingTrue();
      try {
        await runLoggedAsync(
          async () => {
            const fileBase64 = await fileToBase64(file);
            const result = await uploadHero({
              fileName: file.name,
              mimeType:
                file.type === 'image/jpeg' ||
                file.type === 'image/png' ||
                file.type === 'image/webp'
                  ? file.type
                  : ('image/png' as const),
              fileBase64,
              imageType: 'hero',
              oldImageUrl: currentHeroUrl ?? undefined,
            });

            if (result?.serverError) {
              throw new Error(result.serverError);
            }

            if (result?.validationErrors) {
              throw new Error('Hero image upload failed validation.');
            }

            const uploaded = result?.data;
            if (!uploaded?.publicUrl) {
              throw new Error('Upload response was missing a public URL.');
            }

            setHeroPreview(uploaded.publicUrl);
            onHeroChange?.(uploaded.publicUrl);
            toasts.success.actionCompleted('Hero image uploaded successfully!');
          },
          {
            message: 'Hero image upload failed',
            context: {
              fileName: file.name,
            },
          }
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to upload hero image');
        const errorMessage = normalized.message;

        // Reset preview on error
        setHeroPreview(currentHeroUrl);

        if (
          errorMessage.includes('signed in') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('unauthorized')
        ) {
          openAuthModal({
            valueProposition: 'Sign in to upload hero image',
            redirectTo: pathname ?? undefined,
          });
        } else {
          toasts.raw.error('Failed to upload hero image', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleFileSelect(file);
              },
            },
          });
        }
      } finally {
        setIsUploadingFalse();
      }
    },
    [
      user,
      status,
      openAuthModal,
      pathname,
      currentHeroUrl,
      maxFileSize,
      maxDimension,
      uploadHero,
      runLoggedAsync,
      onHeroChange,
      setIsUploadingTrue,
      setIsUploadingFalse,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!currentHeroUrl) return;

    try {
      await runLoggedAsync(
        async () => {
          const result = await deleteHero({
            imageType: 'hero',
            imageUrl: currentHeroUrl,
          });

          if (result?.serverError) {
            throw new Error(result.serverError);
          }

          setHeroPreview(null);
          onHeroChange?.(null);
          toasts.success.actionCompleted('Hero image removed successfully!');
        },
        {
          message: 'Hero image deletion failed',
        }
      );
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to delete hero image');
      toasts.error.actionFailed(normalized.message);
    }
  }, [currentHeroUrl, deleteHero, runLoggedAsync, onHeroChange]);

  return (
    <div className="space-y-3">
      {heroPreview ? (
        <div className="border-border relative h-48 w-full overflow-hidden rounded-lg border">
          <Image src={heroPreview} alt="Hero preview" fill className="object-cover" unoptimized />
          {isUploading && (
            <div className="bg-background/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
              <div className="border-accent h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted border-border flex h-48 w-full items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <Camera className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
            <p className="text-muted-foreground text-sm">No hero image</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          <Camera className="mr-2 h-4 w-4" />
          {heroPreview ? 'Change' : 'Upload Hero Image'}
        </Button>
        {heroPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        JPG, PNG, or WebP. Max {FORM_CONFIG.max_file_size_mb}MB, {maxDimension}x{maxDimension}px.
        Recommended: 1200x400px
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
      />
    </div>
  );
}
