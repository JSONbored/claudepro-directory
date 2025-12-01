'use client';

/**
 * Job Form Component - Database-First Architecture
 * All slug generation in PostgreSQL via job_slug() function.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { between, iconSize, muted, spaceY, marginTop, weight, radius ,size , padding , gap , row } from '@heyclaude/web-runtime/design-system';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { CreateJobInput } from '@heyclaude/web-runtime';
import type { PaymentPlanCatalogEntry } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Star } from '@heyclaude/web-runtime/icons';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { CompanySelector } from '@/src/components/core/forms/company-selector';
import { FormField } from '@heyclaude/web-runtime/ui';
import { ListItemManager } from '@/src/components/core/forms/list-items-editor';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { Checkbox } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';

// Use enum values directly from @heyclaude/database-types Constants
const JOB_PLAN_VALUES = Constants.public.Enums.job_plan;
const WORKPLACE_TYPE_VALUES = Constants.public.Enums.workplace_type;
const EXPERIENCE_LEVEL_VALUES = Constants.public.Enums.experience_level;
const PLAN_LABELS: Record<Database['public']['Enums']['job_plan'], string> = {
  'one-time': 'One-Time',
  subscription: 'Subscription',
};
const PLAN_DESCRIPTION_FALLBACK: Record<Database['public']['Enums']['job_plan'], string> = {
  'one-time': '30 days of visibility, pay once',
  subscription: 'Recurring visibility with easy renewals',
};

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface PlanOption {
  plan: Database['public']['Enums']['job_plan'];
  isSubscription: boolean;
  standardPriceCents: number | null;
  featuredPriceCents: number | null;
  featuredDeltaCents: number | null;
  jobExpiryDays: number | null;
  billingCycleDays: number | null;
  description: string | null;
  benefits: string[] | null;
}

const LEGACY_PLAN_OPTIONS: PlanOption[] = [
  {
    plan: 'one-time',
    isSubscription: false,
    standardPriceCents: 7900,
    featuredPriceCents: 17800,
    featuredDeltaCents: 9900,
    jobExpiryDays: 30,
    billingCycleDays: null,
    description: PLAN_DESCRIPTION_FALLBACK['one-time'],
    benefits: null,
  },
  {
    plan: 'subscription',
    isSubscription: true,
    standardPriceCents: 5900,
    featuredPriceCents: 10800,
    featuredDeltaCents: 4900,
    jobExpiryDays: 30,
    billingCycleDays: 30,
    description: PLAN_DESCRIPTION_FALLBACK.subscription,
    benefits: null,
  },
];

function formatCurrency(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100);
}

function formatPlanPrice(cents: number, isSubscription: boolean): string {
  const base = formatCurrency(cents);
  return isSubscription ? `${base}/month` : base;
}

/**
 * Helper function to check if value is a valid WorkplaceType
 */
function isWorkplaceType(value: unknown): value is Database['public']['Enums']['workplace_type'] {
  return (
    typeof value === 'string' &&
    WORKPLACE_TYPE_VALUES.includes(value as Database['public']['Enums']['workplace_type'])
  );
}

/**
 * Helper function to check if value is a valid ExperienceLevel
 */
function isExperienceLevel(
  value: unknown
): value is Database['public']['Enums']['experience_level'] {
  return (
    typeof value === 'string' &&
    EXPERIENCE_LEVEL_VALUES.includes(value as Database['public']['Enums']['experience_level'])
  );
}

interface JobFormProps {
  initialData?: Partial<CreateJobInput>;
  onSubmit: (
    data: CreateJobInput
  ) => Promise<{ success: boolean; requiresPayment?: boolean; job?: unknown }>;
  submitLabel?: string;
  planCatalog: PaymentPlanCatalogEntry[];
}

/**
 * Render a job creation/editing form that collects job details, requirements, benefits, tags,
 * application information, and listing plan, and submits a validated CreateJobInput to the provided handler.
 *
 * The component derives selectable plan options from `planCatalog` (falls back to legacy defaults when absent),
 * validates workplace and experience enum values, serializes tags/requirements/benefits for submission,
 * and invokes `onSubmit` inside a logged transition. It displays success or error toasts and supports an optional
 * featured listing upgrade.
 *
 * @param initialData - Optional partial job data used to pre-fill form fields (title, company, plan, tier, tags, requirements, benefits, etc.).
 * @param onSubmit - Callback invoked with the assembled CreateJobInput when the form is submitted. Expected to return an object with shape `{ success: boolean, requiresPayment?: boolean, job?: ... }`; the component displays success or payment messaging based on that result.
 * @param submitLabel - Optional label for the submit button (defaults to "Create Job").
 * @param planCatalog - Optional array of PaymentPlanCatalogEntry used to build plan options (standard/featured); when absent or empty, the component uses LEGACY_PLAN_OPTIONS.
 *
 * @returns A JSX.Element representing the job form wired to validate input, manage UI state, and call `onSubmit`.
 *
 * @see CompanySelector
 * @see ListItemManager
 * @see LEGACY_PLAN_OPTIONS
 * @see PLAN_LABELS
 */
export function JobForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Job',
  planCatalog,
}: JobFormProps) {
  const runLoggedAsync = useLoggedAsync({
    scope: 'JobForm',
    defaultMessage: 'Job submission failed',
    defaultRethrow: false,
  });
  const featuredCheckboxId = useId();
  const [isPending, startTransition] = useTransition();
  const planOptions = useMemo<PlanOption[]>(() => {
    if (!planCatalog || planCatalog.length === 0) {
      return LEGACY_PLAN_OPTIONS;
    }

    const grouped = new Map<
      Database['public']['Enums']['job_plan'],
      { standard?: PaymentPlanCatalogEntry; featured?: PaymentPlanCatalogEntry }
    >();

    for (const entry of planCatalog) {
      const current = grouped.get(entry.plan) ?? {};
      if (entry.tier === 'featured') {
        current.featured = entry;
      } else {
        current.standard = entry;
      }
      grouped.set(entry.plan, current);
    }

    const derived = JOB_PLAN_VALUES.map((plan) => {
      const group = grouped.get(plan);
      if (!group?.standard) {
        return null;
      }
      const standard = group.standard;
      const featured = group.featured;
      const hasPrice = typeof standard.price_cents === 'number' ? standard.price_cents : null;
      const featuredPrice = typeof featured?.price_cents === 'number' ? featured.price_cents : null;
      const featuredDelta =
        hasPrice !== null && featuredPrice !== null ? featuredPrice - hasPrice : null;

      return {
        plan,
        isSubscription: Boolean(standard.is_subscription),
        standardPriceCents: hasPrice,
        featuredPriceCents: featuredPrice,
        featuredDeltaCents: featuredDelta,
        jobExpiryDays: standard.job_expiry_days ?? null,
        billingCycleDays: standard.billing_cycle_days ?? null,
        description: standard.description ?? featured?.description ?? null,
        benefits: standard.benefits ?? featured?.benefits ?? null,
      } satisfies PlanOption;
    }).filter(Boolean) as PlanOption[];

    return derived.length > 0 ? derived : LEGACY_PLAN_OPTIONS;
  }, [planCatalog]);
  const [selectedPlan, setSelectedPlan] = useState<Database['public']['Enums']['job_plan']>(() => {
    if (initialData?.plan && PLAN_LABELS[initialData.plan]) {
      return initialData.plan;
    }
    return planOptions[0]?.plan ?? 'one-time';
  });
  useEffect(() => {
    if (!planOptions.some((option) => option.plan === selectedPlan) && planOptions[0]) {
      setSelectedPlan(planOptions[0].plan);
    }
  }, [planOptions, selectedPlan]);
  const selectedPlanOption = useMemo(
    () => planOptions.find((option) => option.plan === selectedPlan) ?? planOptions[0] ?? null,
    [planOptions, selectedPlan]
  );
  const [companyId, setCompanyId] = useState<string | null>(initialData?.company_id || null);
  const [companyName, setCompanyName] = useState<string>(initialData?.company || '');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.tier === 'featured');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements || []);
  const [benefits, setBenefits] = useState<string[]>(initialData?.benefits || []);

  const planInfoSubtitle = (() => {
    if (!selectedPlanOption) return null;
    const parts: string[] = [];
    if (selectedPlanOption.jobExpiryDays) {
      parts.push(`${selectedPlanOption.jobExpiryDays}-day listing`);
    }
    if (selectedPlanOption.isSubscription && selectedPlanOption.billingCycleDays) {
      parts.push(`renews every ${selectedPlanOption.billingCycleDays} days`);
    }
    return parts.length > 0 ? parts.join(' • ') : null;
  })();
  const featuredUpsellDescription =
    selectedPlanOption?.plan === 'subscription'
      ? 'Top placement with orange badge plus renewal priority.'
      : 'Top placement with orange badge and priority in search results.';
  const featuredUpgradeLabel =
    selectedPlanOption?.featuredDeltaCents && selectedPlanOption.featuredDeltaCents > 0
      ? `+${formatCurrency(selectedPlanOption.featuredDeltaCents)} ${
          selectedPlanOption.isSubscription ? 'per cycle' : 'one-time'
        } upgrade`
      : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const location = formData.get('location') as string;
    const salary = formData.get('salary') as string;
    const workplaceRaw = formData.get('workplace') as string;
    const experienceRaw = formData.get('experience') as string;
    const contactEmail = formData.get('contact_email') as string;
    const companyLogo = formData.get('company_logo') as string;

    // Validate workplace type
    const workplace: Database['public']['Enums']['workplace_type'] | null | undefined = workplaceRaw
      ? isWorkplaceType(workplaceRaw)
        ? workplaceRaw
        : null
      : null;

    // Validate experience level
    const experience: Database['public']['Enums']['experience_level'] | null | undefined =
      experienceRaw ? (isExperienceLevel(experienceRaw) ? experienceRaw : null) : null;

    const jobData: CreateJobInput = {
      title: formData.get('title') as string,
      company: companyName,
      company_id: companyId || undefined,
      location: location || undefined,
      description: formData.get('description') as string,
      salary: salary || undefined,
      remote: formData.get('remote') === 'on',
      type: formData.get('type') as Database['public']['Enums']['job_type'],
      workplace: workplace || undefined,
      experience: experience || undefined,
      category: formData.get('category') as Database['public']['Enums']['job_category'],
      tags,
      requirements,
      benefits,
      link: formData.get('link') as string,
      plan: (() => {
        const planRaw = formData.get('plan');
        if (
          typeof planRaw === 'string' &&
          JOB_PLAN_VALUES.includes(planRaw as Database['public']['Enums']['job_plan'])
        ) {
          return planRaw as Database['public']['Enums']['job_plan'];
        }
        throw new Error('Invalid job plan');
      })(),
      tier: (isFeatured ? 'featured' : 'standard') as Database['public']['Enums']['job_tier'],
      contact_email: contactEmail || undefined,
      company_logo: companyLogo || undefined,
    } as unknown as CreateJobInput;

    startTransition(async () => {
      try {
        await runLoggedAsync(
          async () => {
            const result = await onSubmit(jobData);

            if (result?.success) {
              toasts.success.actionCompleted(
                result.requiresPayment
                  ? 'Job created! Contact us for payment.'
                  : 'Job posted successfully!'
              );
            } else {
              // Handle case when server action returns { success: false }
              throw new Error('Job submission returned success: false');
            }
          },
          {
            message: 'Job submission failed',
            context: {
              title: jobData.title ?? '',
              company: jobData.company ?? '',
              plan: jobData.plan ?? '',
            },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        toasts.error.fromError(
          normalizeError(error, 'Failed to save job'),
          'Failed to save job'
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={spaceY.relaxed}>
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic information about the position</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <FormField
            variant="input"
            label="Job Title"
            name="title"
            defaultValue={initialData?.title || ''}
            required={true}
            placeholder="e.g., Senior AI Engineer"
          />

          <CompanySelector
            value={companyId}
            onChange={(id, name) => {
              setCompanyId(id);
              setCompanyName(name);
            }}
            defaultCompanyName={initialData?.company || undefined}
          />

          <div className={`grid grid-cols-2 ${gap.comfortable}`}>
            <FormField
              variant="select"
              label="Employment Type"
              name="type"
              defaultValue={initialData?.type || Constants.public.Enums.job_type[0]} // 'full-time'
              required={true}
            >
              <SelectItem value={Constants.public.Enums.job_type[0]}>Full Time</SelectItem>
              <SelectItem value={Constants.public.Enums.job_type[1]}>Part Time</SelectItem>
              <SelectItem value={Constants.public.Enums.job_type[2]}>Contract</SelectItem>
              <SelectItem value={Constants.public.Enums.job_type[4]}>Internship</SelectItem>
              <SelectItem value={Constants.public.Enums.job_type[3]}>Freelance</SelectItem>
            </FormField>

            <FormField
              variant="select"
              label="Workplace"
              name="workplace"
              defaultValue={
                (initialData?.workplace as
                  | Database['public']['Enums']['workplace_type']
                  | undefined) ||
                (WORKPLACE_TYPE_VALUES[0] as Database['public']['Enums']['workplace_type'])
              }
              required={true}
            >
              {WORKPLACE_TYPE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </FormField>
          </div>

          <div className={`grid grid-cols-2 ${gap.comfortable}`}>
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
              defaultValue={
                (initialData?.experience as
                  | Database['public']['Enums']['experience_level']
                  | undefined) ||
                (EXPERIENCE_LEVEL_VALUES[0] as Database['public']['Enums']['experience_level'])
              }
              placeholder="Select level"
            >
              {EXPERIENCE_LEVEL_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </SelectItem>
              ))}
            </FormField>
          </div>

          <div className={`grid grid-cols-2 ${gap.comfortable}`}>
            <FormField
              variant="select"
              label="Category"
              name="category"
              defaultValue={initialData?.category || 'engineering'}
              required={true}
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
            defaultValue={initialData?.description || ''}
            required={true}
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
            noDuplicates={true}
            showCounter={true}
            badgeStyle="outline"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>How candidates can apply</CardDescription>
        </CardHeader>
        <CardContent className={spaceY.comfortable}>
          <FormField
            variant="input"
            label="Application URL"
            name="link"
            type="url"
            defaultValue={initialData?.link || ''}
            required={true}
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
          <Select
            name="plan"
            value={selectedPlan}
            onValueChange={(value) =>
              setSelectedPlan(value as Database['public']['Enums']['job_plan'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((option) => (
                <SelectItem key={option.plan} value={option.plan}>
                  <div>
                    <div className={weight.medium}>
                      {PLAN_LABELS[option.plan]}
                      {option.standardPriceCents !== null && (
                        <> - {formatPlanPrice(option.standardPriceCents, option.isSubscription)}</>
                      )}
                    </div>
                    <div className={`${muted.default} ${size.xs}`}>
                      {option.description ?? PLAN_DESCRIPTION_FALLBACK[option.plan]}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPlanOption && (
            <div className={`${marginTop.default} ${radius.lg} border border-border/50 bg-muted/20 ${padding.default} ${size.sm}`}>
              <div className={between.start}>
                <div>
                  <div className={weight.semibold}>{PLAN_LABELS[selectedPlanOption.plan]}</div>
                  <p className={`${muted.default} ${size.xs} ${marginTop.tight}`}>
                    {selectedPlanOption.description ??
                      PLAN_DESCRIPTION_FALLBACK[selectedPlanOption.plan]}
                  </p>
                </div>
                {selectedPlanOption.standardPriceCents !== null && (
                  <span className={`${weight.semibold} ${size.base}`}>
                    {formatPlanPrice(
                      selectedPlanOption.standardPriceCents,
                      selectedPlanOption.isSubscription
                    )}
                  </span>
                )}
              </div>
              {planInfoSubtitle && (
                <p className={`${muted.default} ${size.xs} ${marginTop.compact}`}>{planInfoSubtitle}</p>
              )}
              {selectedPlanOption.benefits && (
                <ul className={`${marginTop.compact} list-disc ${spaceY.tight} pl-4 ${muted.default} ${size.xs}`}>
                  {selectedPlanOption.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className={`${muted.default} ${size.xs} ${marginTop.compact}`}>
            Payment via Polar.sh after submission. Job goes live immediately after payment
            confirmation.
          </p>

          <div className={`${marginTop.default} ${radius.lg} border border-orange-500/30 bg-orange-500/5 ${padding.default}`}>
            <div className={`${row.default}`}>
              <Checkbox
                id={featuredCheckboxId}
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={featuredCheckboxId}
                  className={`flex cursor-pointer items-center ${gap.compact} ${weight.semibold} ${size.sm}`}
                >
                  <Star className={`${iconSize.sm} text-orange-500`} />
                  Make this a Featured Listing
                </Label>
                <p className={`${muted.default} ${size.xs} ${marginTop.tight}`}>{featuredUpsellDescription}</p>
                {featuredUpgradeLabel && (
                  <p className={`${marginTop.compact} ${weight.medium} text-orange-600 ${size.sm} dark:text-orange-400`}>
                    {featuredUpgradeLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="requirements" value={JSON.stringify(requirements)} />
      <input type="hidden" name="benefits" value={JSON.stringify(benefits)} />

      <div className={`flex ${gap.comfortable}`}>
        <Button
          type="submit"
          disabled={isPending || tags.length === 0 || requirements.length === 0}
        >
          {isPending ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild={true}>
          <a href={ROUTES.ACCOUNT_JOBS}>Cancel</a>
        </Button>
      </div>
    </form>
  );
}