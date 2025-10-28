'use client';

/**
 * Job Form Component
 * Reusable form for creating/editing job listings
 *
 * Follows patterns from existing forms and react-hook-form integration
 */

import { useState, useTransition } from 'react';
import { FormField } from '@/src/components/forms/utilities/form-field';
import { ListItemManager } from '@/src/components/forms/utilities/list-item-manager';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { ROUTES } from '@/src/lib/constants/routes';
import type { Database } from '@/src/types/database.types';

type CreateJobInput = Database['public']['Tables']['jobs']['Insert'];

import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

interface JobFormProps {
  initialData?: Partial<CreateJobInput>;
  onSubmit: (
    data: CreateJobInput
  ) => Promise<{ success: boolean; requiresPayment?: boolean; job?: unknown }>;
  submitLabel?: string;
}

export function JobForm({ initialData, onSubmit, submitLabel = 'Create Job' }: JobFormProps) {
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements || []);
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const jobData: CreateJobInput = {
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      location: (formData.get('location') as string) || undefined,
      description: formData.get('description') as string,
      salary: (formData.get('salary') as string) || undefined,
      remote: formData.get('remote') === 'on',
      type: formData.get('type') as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'internship'
        | 'freelance',
      workplace: (formData.get('workplace') as 'On site' | 'Remote' | 'Hybrid') || undefined,
      experience:
        (formData.get('experience') as 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive') ||
        undefined,
      category: formData.get('category') as string,
      tags,
      requirements,
      benefits,
      link: formData.get('link') as string,
      contact_email: (formData.get('contact_email') as string) || undefined,
      company_logo: (formData.get('company_logo') as string) || undefined,
      plan: (formData.get('plan') as 'standard' | 'featured' | 'premium') || 'standard',
    };

    startTransition(async () => {
      try {
        const result = await onSubmit(jobData);

        if (result?.success) {
          toasts.success.actionCompleted(
            result.requiresPayment
              ? 'Job created! Contact us for payment.'
              : 'Job posted successfully!'
          );
        }
      } catch (error) {
        toasts.error.fromError(error, 'Failed to save job');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic information about the position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            variant="input"
            label="Job Title"
            name="title"
            {...(initialData?.title && { defaultValue: initialData.title })}
            required
            placeholder="e.g., Senior AI Engineer"
          />

          <FormField
            variant="input"
            label="Company"
            name="company"
            {...(initialData?.company && { defaultValue: initialData.company })}
            required
            placeholder="e.g., Acme Corp"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              variant="select"
              label="Employment Type"
              name="type"
              defaultValue={initialData?.type || 'full-time'}
              required
            >
              <SelectItem value="full-time">Full Time</SelectItem>
              <SelectItem value="part-time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </FormField>

            <FormField
              variant="select"
              label="Workplace"
              name="workplace"
              defaultValue={initialData?.workplace || 'Remote'}
              required
            >
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="On site">On site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              variant="input"
              label="Location"
              name="location"
              defaultValue={initialData?.location || ''}
              placeholder="e.g., San Francisco, CA"
            />

            <FormField
              variant="select"
              label="Experience Level"
              name="experience"
              defaultValue={initialData?.experience || ''}
              placeholder="Select level"
            >
              <SelectItem value="Entry">Entry Level</SelectItem>
              <SelectItem value="Mid">Mid Level</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              variant="select"
              label="Category"
              name="category"
              defaultValue={initialData?.category || 'engineering'}
              required
            >
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </FormField>

            <FormField
              variant="input"
              label="Salary Range"
              name="salary"
              defaultValue={initialData?.salary || ''}
              placeholder="e.g., $120k - $180k"
            />
          </div>

          <FormField
            variant="textarea"
            label="Job Description"
            name="description"
            {...(initialData?.description && { defaultValue: initialData.description })}
            required
            rows={6}
            placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
            description="Minimum 50 characters"
          />
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>Skills and qualifications needed</CardDescription>
        </CardHeader>
        <CardContent>
          <ListItemManager
            variant="list"
            label="Add Requirement"
            items={requirements}
            onChange={setRequirements}
            placeholder="e.g., 5+ years of Python experience"
            maxItems={20}
          />
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits (Optional)</CardTitle>
          <CardDescription>Perks and benefits offered</CardDescription>
        </CardHeader>
        <CardContent>
          <ListItemManager
            variant="badge"
            label="Add Benefit"
            items={benefits}
            onChange={setBenefits}
            placeholder="e.g., Health insurance, 401k, Remote work"
            maxItems={20}
            badgeStyle="secondary"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags *</CardTitle>
          <CardDescription>Keywords for search (minimum 1, maximum 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <ListItemManager
            variant="badge"
            label="Add Tag"
            items={tags}
            onChange={setTags}
            placeholder="e.g., AI, Python, Remote"
            minItems={1}
            maxItems={10}
            noDuplicates
            showCounter
            badgeStyle="outline"
          />
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>How candidates can apply</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            variant="input"
            label="Application URL"
            name="link"
            type="url"
            {...(initialData?.link && { defaultValue: initialData.link })}
            required
            placeholder="https://company.com/careers/apply"
          />

          <FormField
            variant="input"
            label="Contact Email"
            name="contact_email"
            type="email"
            defaultValue={initialData?.contact_email || ''}
            placeholder="jobs@company.com"
          />

          <FormField
            variant="input"
            label="Company Logo URL"
            name="company_logo"
            type="url"
            defaultValue={initialData?.company_logo || ''}
            placeholder="https://company.com/logo.png"
          />
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Plan</CardTitle>
          <CardDescription>Choose your visibility level</CardDescription>
        </CardHeader>
        <CardContent>
          <Select name="plan" defaultValue={initialData?.plan || 'standard'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                <div>
                  <div className="font-medium">Standard (Free)</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>Basic listing, 30 days</div>
                </div>
              </SelectItem>
              <SelectItem value="featured">
                <div>
                  <div className="font-medium">Featured (Contact for pricing)</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>Top placement, badge, analytics</div>
                </div>
              </SelectItem>
              <SelectItem value="premium">
                <div>
                  <div className="font-medium">Premium (Contact for pricing)</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>Featured + newsletter + promotion</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Hidden inputs for arrays (handled by state) */}
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="requirements" value={JSON.stringify(requirements)} />
      <input type="hidden" name="benefits" value={JSON.stringify(benefits)} />

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending || tags.length === 0 || requirements.length === 0}
        >
          {isPending ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={ROUTES.ACCOUNT_JOBS}>Cancel</a>
        </Button>
      </div>
    </form>
  );
}
