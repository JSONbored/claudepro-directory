'use client';

/**
 * Company Form Component - Uses server actions for CRUD operations
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useId, useState, useTransition } from 'react';
import { FormField } from '@/src/components/core/forms/form-field-wrapper';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { SelectItem } from '@/src/components/primitives/ui/select';
import {
  createCompany,
  updateCompany,
  uploadCompanyLogoAction,
} from '@/src/lib/actions/companies.actions';
import { getFormConfig } from '@/src/lib/actions/feature-flags.actions';
import { ROUTES } from '@/src/lib/constants';
import { FileText, X } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Database } from '@/src/types/database.types';

type CompanyRow = Database['public']['Tables']['companies']['Row'];

type AllowedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

interface CompanyFormProps {
  initialData?: Partial<CompanyRow>;
  mode: 'create' | 'edit';
}

// Form validation (loaded from Statsig via server action)
let MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
let MAX_DIMENSION = 2048; // 2048px

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function CompanyForm({ initialData, mode }: CompanyFormProps) {
  const router = useRouter();
  const logoUploadId = useId();
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [useCursorDate, setUseCursorDate] = useState<boolean>(!!initialData?.using_cursor_since);
  const { executeAsync: uploadLogo } = useAction(uploadCompanyLogoAction);

  // Load form validation config from Statsig on mount
  useEffect(() => {
    getFormConfig()
      .then((config) => {
        const maxMB = (config['form.max_file_size_mb'] as number) ?? 5;
        MAX_FILE_SIZE = maxMB * 1024 * 1024;
        MAX_DIMENSION = (config['form.max_image_dimension_px'] as number) ?? 2048;
      })
      .catch((error) => {
        logClientWarning('CompanyForm: failed to load form config', error);
      });
  }, []);

  const handleLogoUpload = async (file: File) => {
    // Client-side validation
    if (file.size > MAX_FILE_SIZE) {
      toasts.error.actionFailed(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB.`);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toasts.error.actionFailed('Invalid file type. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    // Verify actual file content matches MIME type (magic bytes check)
    // This prevents any potential XSS via malformed file uploads
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

    // Check dimensions using createImageBitmap (safer than URL.createObjectURL for CodeQL)
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close(); // Release memory

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        toasts.error.actionFailed(
          `Image too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION}px.`
        );
        return;
      }
    } catch {
      toasts.error.actionFailed('Failed to read image dimensions.');
      return;
    }

    // Upload to edge function
    setIsUploadingLogo(true);

    try {
      const fileBase64 = await fileToBase64(file);
      const result = await uploadLogo({
        fileName: file.name,
        mimeType: file.type as AllowedImageMimeType,
        fileBase64,
        companyId: initialData?.id,
        oldLogoUrl: logoUrl ?? undefined,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      if (result?.validationErrors) {
        throw new Error('Logo upload failed validation.');
      }

      const uploaded = result?.data;
      if (!uploaded?.publicUrl) {
        throw new Error('Upload response was missing a public URL.');
      }

      setLogoUrl(uploaded.publicUrl);
      setLogoPreview(uploaded.publicUrl);
      toasts.success.actionCompleted('Logo uploaded successfully!');
    } catch (error) {
      logClientWarning('CompanyForm: logo upload failed', error, {
        fileName: file.name,
        companyId: initialData?.id,
      });
      toasts.error.fromError(error, 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      website: (formData.get('website') as string) || null,
      logo: logoUrl, // Use uploaded logo URL from state
      description: (formData.get('description') as string) || null,
      size: (formData.get('size') as string) || null,
      industry: (formData.get('industry') as string) || null,
      using_cursor_since: useCursorDate
        ? (formData.get('using_cursor_since') as string) || null
        : null,
    };

    startTransition(async () => {
      try {
        if (mode === 'create') {
          // Create company via server action
          const result = await createCompany(data);

          if (result?.serverError || result?.validationErrors) {
            throw new Error(result.serverError || 'Validation failed');
          }

          toasts.success.actionCompleted('Company created successfully!');
        } else {
          // Update company via server action
          if (!initialData?.id) {
            throw new Error('Company ID is required for updates');
          }

          const result = await updateCompany({
            id: initialData.id,
            ...data,
          });

          if (result?.serverError || result?.validationErrors) {
            throw new Error(result.serverError || 'Validation failed');
          }

          toasts.success.actionCompleted('Company updated successfully!');
        }

        router.push(ROUTES.ACCOUNT_COMPANIES);
        router.refresh();
      } catch (error) {
        logClientWarning('CompanyForm: save failed', error, {
          mode,
          companyId: initialData?.id,
        });
        toasts.error.fromError(error, 'Failed to save company');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Basic details about your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            variant="input"
            label="Company Name"
            name="name"
            defaultValue={initialData?.name || ''}
            required
            placeholder="e.g., Acme Corporation"
          />

          <FormField
            variant="input"
            label="Website"
            name="website"
            type="url"
            defaultValue={initialData?.website || ''}
            placeholder="https://company.com"
            description="Your company's website URL"
          />

          <div className="space-y-2">
            <label htmlFor={logoUploadId} className="font-medium text-sm">
              Company Logo
              <span className="ml-1 font-normal text-muted-foreground text-xs">
                (max 200KB, 512x512px, WebP/PNG/JPG)
              </span>
            </label>

            {logoPreview ? (
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                  <Image
                    src={logoPreview}
                    alt="Company logo preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogoUrl(null);
                      setLogoPreview(null);
                    }}
                    disabled={isUploadingLogo}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remove Logo
                  </Button>
                  <label htmlFor={logoUploadId}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingLogo}
                      onClick={() => document.getElementById(logoUploadId)?.click()}
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      Change Logo
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor={logoUploadId} className={UI_CLASSES.UPLOAD_ZONE}>
                <div className={`${UI_CLASSES.FLEX_COL_GAP_2} items-center text-center`}>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {isUploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                    </p>
                    <p className={UI_CLASSES.TEXT_SM_MUTED}>Max 200KB, 512x512px</p>
                  </div>
                </div>
              </label>
            )}

            <input
              id={logoUploadId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={UI_CLASSES.INPUT_HIDDEN}
              disabled={isUploadingLogo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleLogoUpload(file).catch((error) => {
                    logger.error(
                      'Logo upload failed',
                      error instanceof Error ? error : new Error(String(error))
                    );
                    toasts.error.fromError(error, 'Failed to upload logo');
                  });
                  e.target.value = ''; // Reset input
                }
              }}
            />
          </div>

          <FormField
            variant="textarea"
            label="Description"
            name="description"
            defaultValue={initialData?.description || ''}
            rows={4}
            placeholder="Brief description of your company..."
            description="Maximum 1000 characters"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Additional information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            variant="select"
            label="Company Size"
            name="size"
            defaultValue={initialData?.size || ''}
            placeholder="Select size"
          >
            <SelectItem value="1-10">1-10 employees</SelectItem>
            <SelectItem value="11-50">11-50 employees</SelectItem>
            <SelectItem value="51-200">51-200 employees</SelectItem>
            <SelectItem value="201-500">201-500 employees</SelectItem>
            <SelectItem value="500+">500+ employees</SelectItem>
          </FormField>

          <FormField
            variant="input"
            label="Industry"
            name="industry"
            defaultValue={initialData?.industry || ''}
            placeholder="e.g., SaaS, Fintech, Healthcare"
            description="Maximum 100 characters"
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium text-sm">
              <input
                type="checkbox"
                checked={useCursorDate}
                onChange={(e) => setUseCursorDate(e.target.checked)}
                className="rounded"
              />
              Using Claude since specific date
            </label>
            {useCursorDate && (
              <input
                type="date"
                name="using_cursor_since"
                defaultValue={initialData?.using_cursor_since || ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : mode === 'create' ? 'Create Company' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
