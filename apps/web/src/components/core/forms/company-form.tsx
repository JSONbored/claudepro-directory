'use client';

/**
 * Company Form Component
 *
 * Form for creating and editing company profiles.
 * Features logo upload with client-side validation and server action integration.
 *
 * @example
 * ```tsx
 * <CompanyForm mode="create" />
 * <CompanyForm mode="edit" initialData={existingCompany} />
 * ```
 */

import type { Database } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import { getFormConfig } from '@heyclaude/web-runtime';
import {
  createCompany,
  updateCompany,
  uploadCompanyLogoAction,
} from '@heyclaude/web-runtime/actions';
import { logClientError, logClientWarn } from '@heyclaude/web-runtime/logging/client';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useFormSubmit, useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { FileText, X } from '@heyclaude/web-runtime/icons';
import { toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useId, useState } from 'react';
import { FormField } from '@/src/components/core/forms/form-field-wrapper';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { SelectItem } from '@heyclaude/web-runtime/ui';

// Use the generated composite type from the RPC return
type CompanyCompositeType = Database['public']['CompositeTypes']['user_companies_company'];

type AllowedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

interface CompanyFormProps {
  /** Existing company data for edit mode */
  initialData?: Partial<CompanyCompositeType>;
  /** Form mode - 'create' for new companies, 'edit' for existing */
  mode: 'create' | 'edit';
}

// Default form validation values (will be loaded from config in component)
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_DIMENSION = 2048; // 2048px

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

/**
 * Form component for creating and editing company profiles.
 * Includes logo upload with validation, company details, and metadata.
 */
export function CompanyForm({ initialData, mode }: CompanyFormProps) {
  const logoUploadId = useId();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [useCursorDate, setUseCursorDate] = useState<boolean>(!!initialData?.using_cursor_since);
  const [maxFileSize, setMaxFileSize] = useState(DEFAULT_MAX_FILE_SIZE);
  const [maxDimension, setMaxDimension] = useState(DEFAULT_MAX_DIMENSION);
  const { executeAsync: uploadLogo } = useAction(uploadCompanyLogoAction);

  // Use standardized form submission hook
  const { isPending, handleSubmit, router } = useFormSubmit({
    scope: 'CompanyForm',
    mode,
    successRedirect: ROUTES.ACCOUNT_COMPANIES,
    refreshOnSuccess: true,
    messages: {
      createSuccess: 'Company created successfully!',
      editSuccess: 'Company updated successfully!',
      errorTitle: 'Failed to save company',
    },
    logContext: {
      companyId: initialData?.id ?? undefined,
    },
  });

  // Logged async for logo upload (separate from main form submit)
  const runLoggedAsync = useLoggedAsync({
    scope: 'CompanyForm.LogoUpload',
    defaultMessage: 'Logo upload failed',
    defaultRethrow: false,
  });

  // Load form validation config from static defaults on mount
  useEffect(() => {
    getFormConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data;
        const maxMB = config['form.max_file_size_mb'];
        setMaxFileSize(maxMB * 1024 * 1024);
        setMaxDimension(config['form.max_image_dimension_px']);
      })
      .catch((error: unknown) => {
        logClientWarn('CompanyForm: failed to load form config', error, 'CompanyForm.loadConfig');
      });
  }, []);

  const handleLogoUpload = async (file: File) => {
    // Client-side validation
    if (file.size > maxFileSize) {
      toasts.error.actionFailed(`File too large. Maximum size is ${maxFileSize / 1024}KB.`);
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

    // Upload to edge function
    setIsUploadingLogo(true);

    try {
      await runLoggedAsync(
        async () => {
          const fileBase64 = await fileToBase64(file);
          const result = await uploadLogo({
            fileName: file.name,
            mimeType: file.type as AllowedImageMimeType,
            fileBase64,
            companyId: initialData?.id ?? undefined,
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
        },
        {
          message: 'Logo upload failed',
          context: {
            fileName: file.name,
            companyId: initialData?.id ?? undefined,
          },
        }
      );
    } catch (error) {
      toasts.error.fromError(
        normalizeError(error, 'Failed to upload logo'),
        'Failed to upload logo'
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const sizeValue = (formData.get('size') as string) || null;
    const data = {
      name: formData.get('name') as string,
      website: (formData.get('website') as string) || null,
      logo: logoUrl,
      description: (formData.get('description') as string) || null,
      size: sizeValue as Database['public']['Enums']['company_size'] | null,
      industry: (formData.get('industry') as string) || null,
      using_cursor_since: useCursorDate
        ? (formData.get('using_cursor_since') as string) || null
        : null,
    };

    await handleSubmit(async () => {
      if (mode === 'create') {
        const result = await createCompany(data);

        if (result?.serverError || result?.validationErrors) {
          throw new Error(result.serverError || 'Validation failed');
        }

        return result;
      } else {
        const companyId = initialData?.id;
        if (!companyId) {
          throw new Error('Company ID is required for updates');
        }

        const result = await updateCompany({
          id: companyId,
          ...data,
        });

        if (result?.serverError || result?.validationErrors) {
          throw new Error(result.serverError || 'Validation failed');
        }

        return result;
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
            required={true}
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
                    fill={true}
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
                  handleLogoUpload(file).catch((error: unknown) => {
                    logClientError(
                      'Logo upload failed',
                      normalizeError(error, 'Logo upload failed'),
                      'CompanyForm.handleLogoUpload',
                      {
                        component: 'CompanyForm',
                        action: 'handleLogoUpload',
                      }
                    );
                    toasts.error.fromError(error, 'Failed to upload logo');
                  });
                  e.target.value = '';
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
            <SelectItem value="just_me">Just Me</SelectItem>
            <SelectItem value="2-10">2-10 employees</SelectItem>
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
