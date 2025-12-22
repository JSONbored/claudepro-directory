'use client';

/**
 * Profile Avatar Upload Component
 * Handles avatar image upload with preview
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

interface ProfileAvatarUploadProps {
  currentAvatarUrl: string | null;
  onAvatarChange?: (newUrl: string | null) => void;
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

export function ProfileAvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
}: ProfileAvatarUploadProps) {
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'ProfileAvatarUpload' });
  const { openAuthModal } = useAuthModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const {
    value: isUploading,
    setTrue: setIsUploadingTrue,
    setFalse: setIsUploadingFalse,
  } = useBoolean();
  const { executeAsync: uploadAvatar } = useSafeAction(uploadUserImage);
  const { executeAsync: deleteAvatar } = useSafeAction(deleteUserImage);
  const runLoggedAsync = useLoggedAsync({
    scope: 'ProfileAvatarUpload',
    defaultMessage: 'Avatar upload failed',
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
          valueProposition: 'Sign in to upload avatar',
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
          // JPEG: FF D8 FF
          (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
          // PNG: 89 50 4E 47
          (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
          // WebP: 52 49 46 46 ... 57 45 42 50
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

      // Check dimensions using createImageBitmap
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
      setAvatarPreview(previewUrl);

      // Upload
      setIsUploadingTrue();
      try {
        await runLoggedAsync(
          async () => {
            const fileBase64 = await fileToBase64(file);
            const result = await uploadAvatar({
              fileName: file.name,
              mimeType:
                file.type === 'image/jpeg' ||
                file.type === 'image/png' ||
                file.type === 'image/webp'
                  ? file.type
                  : ('image/png' as const),
              fileBase64,
              imageType: 'avatar',
              oldImageUrl: currentAvatarUrl ?? undefined,
            });

            if (result?.serverError) {
              throw new Error(result.serverError);
            }

            if (result?.validationErrors) {
              throw new Error('Avatar upload failed validation.');
            }

            const uploaded = result?.data;
            if (!uploaded?.publicUrl) {
              throw new Error('Upload response was missing a public URL.');
            }

            setAvatarPreview(uploaded.publicUrl);
            onAvatarChange?.(uploaded.publicUrl);
            toasts.success.actionCompleted('Avatar uploaded successfully!');
          },
          {
            message: 'Avatar upload failed',
            context: {
              fileName: file.name,
            },
          }
        );
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to upload avatar');
        const errorMessage = normalized.message;

        // Reset preview on error
        setAvatarPreview(currentAvatarUrl);

        if (
          errorMessage.includes('signed in') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('unauthorized')
        ) {
          openAuthModal({
            valueProposition: 'Sign in to upload avatar',
            redirectTo: pathname ?? undefined,
          });
        } else {
          toasts.raw.error('Failed to upload avatar', {
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
      currentAvatarUrl,
      maxFileSize,
      maxDimension,
      uploadAvatar,
      runLoggedAsync,
      onAvatarChange,
      setIsUploadingTrue,
      setIsUploadingFalse,
    ]
  );

  const handleDelete = useCallback(async () => {
    if (!currentAvatarUrl) return;

    try {
      await runLoggedAsync(
        async () => {
          const result = await deleteAvatar({
            imageType: 'avatar',
            imageUrl: currentAvatarUrl,
          });

          if (result?.serverError) {
            throw new Error(result.serverError);
          }

          setAvatarPreview(null);
          onAvatarChange?.(null);
          toasts.success.actionCompleted('Avatar removed successfully!');
        },
        {
          message: 'Avatar deletion failed',
        }
      );
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to delete avatar');
      toasts.error.actionFailed(normalized.message);
    }
  }, [currentAvatarUrl, deleteAvatar, runLoggedAsync, onAvatarChange]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        {avatarPreview ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-border sm:h-24 sm:w-24">
            <Image
              src={avatarPreview}
              alt="Avatar preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full ring-2 ring-border sm:h-24 sm:w-24">
            <Camera className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
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
            {avatarPreview ? 'Change' : 'Upload'}
          </Button>
          {avatarPreview && (
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
          JPG, PNG, or WebP. Max {FORM_CONFIG.max_file_size_mb}MB, {maxDimension}x{maxDimension}px
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
    </div>
  );
}

