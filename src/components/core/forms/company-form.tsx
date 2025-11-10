'use client';

/**
 * Company Form Component - Calls companies-handler edge function with file upload
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { FormField } from '@/src/components/core/forms/utilities/form-field';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { SelectItem } from '@/src/components/primitives/select';
import { ROUTES } from '@/src/lib/constants';
import { FileText, X } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Database } from '@/src/types/database.types';

type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];

interface CompanyFormProps {
  initialData?: Partial<CompanyRow>;
  mode: 'create' | 'edit';
}

const MAX_FILE_SIZE = 200 * 1024; // 200KB
const MAX_DIMENSION = 512;

export function CompanyForm({ initialData, mode }: CompanyFormProps) {
  const router = useRouter();
  const logoUploadId = useId();
  const [isPending, startTransition] = useTransition();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [useCursorDate, setUseCursorDate] = useState<boolean>(!!initialData?.using_cursor_since);

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

    // Check dimensions
    try {
      const img = document.createElement('img');
      const imgPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
      });
      img.src = URL.createObjectURL(file);
      const { width, height } = await imgPromise;

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
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toasts.error.authRequired();
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      if (initialData?.id) {
        uploadFormData.append('companyId', initialData.id);
        if (logoUrl) {
          uploadFormData.append('oldLogoUrl', logoUrl);
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/companies-handler`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'X-Company-Action': 'upload-logo',
          },
          body: uploadFormData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      setLogoUrl(result.publicUrl);
      setLogoPreview(result.publicUrl);
      toasts.success.actionCompleted('Logo uploaded successfully!');
    } catch (error) {
      toasts.error.fromError(error, 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const data: Partial<CompanyInsert> = {
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
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          toasts.error.authRequired();
          return;
        }

        const action = mode === 'create' ? 'create' : 'update';
        const payload = mode === 'edit' ? { ...data, id: initialData?.id } : data;

        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/companies-handler`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'X-Company-Action': action,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save company');
        }

        const result = await response.json();

        if (result.success || result.company) {
          toasts.success.actionCompleted(
            mode === 'create' ? 'Company created successfully!' : 'Company updated successfully!'
          );
          router.push(ROUTES.ACCOUNT_COMPANIES);
          router.refresh();
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (error) {
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
