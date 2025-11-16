'use client';

/**
 * Job Form Component - Database-First Architecture
 * All slug generation in PostgreSQL via job_slug() function.
 */

import { useId, useState, useTransition } from 'react';
import { CompanySelector } from '@/src/components/core/forms/company-selector';
import { FormField } from '@/src/components/core/forms/form-field-wrapper';
import { ListItemManager } from '@/src/components/core/forms/list-items-editor';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Checkbox } from '@/src/components/primitives/ui/checkbox';
import { Label } from '@/src/components/primitives/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/ui/select';
import type { CreateJobInput } from '@/src/lib/actions/jobs.actions';
import { ROUTES } from '@/src/lib/data/config/constants';
import { Star } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { ensureStringArray } from '@/src/lib/utils/data.utils';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { JobCategory } from '@/src/types/database-overrides';

interface JobFormProps {
  initialData?: Partial<CreateJobInput>;
  onSubmit: (
    data: CreateJobInput
  ) => Promise<{ success: boolean; requiresPayment?: boolean; job?: unknown }>;
  submitLabel?: string;
}

export function JobForm({ initialData, onSubmit, submitLabel = 'Create Job' }: JobFormProps) {
  const featuredCheckboxId = useId();
  const [isPending, startTransition] = useTransition();
  const [companyId, setCompanyId] = useState<string | null>(initialData?.company_id || null);
  const [companyName, setCompanyName] = useState<string>(initialData?.company || '');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.tier === 'featured');
  const [tags, setTags] = useState<string[]>(ensureStringArray(initialData?.tags));
  const [requirements, setRequirements] = useState<string[]>(
    ensureStringArray(initialData?.requirements)
  );
  const [benefits, setBenefits] = useState<string[]>(ensureStringArray(initialData?.benefits));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const location = formData.get('location') as string;
    const salary = formData.get('salary') as string;
    const workplace = formData.get('workplace') as string;
    const experience = formData.get('experience') as string;
    const contactEmail = formData.get('contact_email') as string;
    const companyLogo = formData.get('company_logo') as string;

    const jobData: CreateJobInput = {
      title: formData.get('title') as string,
      company: companyName, // Use state (supports legacy text field)
      company_id: companyId, // FK to companies table
      ...(location && { location }),
      description: formData.get('description') as string,
      ...(salary && { salary }),
      remote: formData.get('remote') === 'on',
      type: formData.get('type') as string,
      ...(workplace && { workplace }),
      ...(experience && { experience }),
      category: formData.get('category') as JobCategory,
      tags,
      requirements,
      benefits,
      link: formData.get('link') as string,
      plan: formData.get('plan') as 'one-time' | 'subscription',
      tier: isFeatured ? 'featured' : 'standard',
      ...(contactEmail && { contact_email: contactEmail }),
      ...(companyLogo && { company_logo: companyLogo }),
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
        logClientWarning('JobForm: submit failed', error, {
          title: jobData.title,
          company: jobData.company,
          plan: jobData.plan,
        });
        toasts.error.fromError(error, 'Failed to save job');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

          <CompanySelector
            value={companyId}
            onChange={(id, name) => {
              setCompanyId(id);
              setCompanyName(name);
            }}
            defaultCompanyName={initialData?.company}
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
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="leadership">Leadership</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle>Listing Plan</CardTitle>
          <CardDescription>30 days of visibility - choose your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Select name="plan" defaultValue={initialData?.plan || 'one-time'}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">
                <div>
                  <div className="font-medium">One-Time - $79</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>30 days active, pay once</div>
                </div>
              </SelectItem>
              <SelectItem value="subscription">
                <div>
                  <div className="font-medium">Subscription - $59/month</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>
                    Auto-renew, cancel anytime (first 50: lifetime rate lock)
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className={`${UI_CLASSES.TEXT_XS_MUTED} mt-2`}>
            Payment via Polar.sh after submission. Job goes live immediately after payment
            confirmation.
          </p>

          <div className="mt-4 rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id={featuredCheckboxId}
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={featuredCheckboxId}
                  className="flex cursor-pointer items-center gap-2 font-semibold text-sm"
                >
                  <Star className={`${UI_CLASSES.ICON_SM} text-orange-500`} />
                  Make this a Featured Listing
                </Label>
                <p className={`${UI_CLASSES.TEXT_XS_MUTED} mt-1`}>
                  Top placement with orange badge and priority in search results
                </p>
                <p className="mt-2 font-medium text-orange-600 text-sm dark:text-orange-400">
                  +$99 one-time or +$49/month with subscription
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="requirements" value={JSON.stringify(requirements)} />
      <input type="hidden" name="benefits" value={JSON.stringify(benefits)} />

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
