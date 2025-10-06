'use client';

/**
 * Job Form Component
 * Reusable form for creating/editing job listings
 *
 * Follows patterns from existing forms and react-hook-form integration
 */

import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import type { CreateJobInput } from '@/src/lib/schemas/content/job.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
  const [currentTag, setCurrentTag] = useState('');
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');

  // Generate unique IDs for form fields
  const titleId = useId();
  const companyId = useId();
  const typeId = useId();
  const workplaceId = useId();
  const locationId = useId();
  const experienceId = useId();
  const categoryId = useId();
  const salaryId = useId();
  const descriptionId = useId();
  const requirementInputId = useId();
  const benefitInputId = useId();
  const tagInputId = useId();
  const linkId = useId();
  const contactEmailId = useId();
  const companyLogoId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const jobData: CreateJobInput = {
      title: formData.get('title') as string,
      company: formData.get('company') as string,
      location: (formData.get('location') as string) || null,
      description: formData.get('description') as string,
      salary: (formData.get('salary') as string) || null,
      remote: formData.get('remote') === 'on',
      type: formData.get('type') as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'internship'
        | 'freelance',
      workplace: (formData.get('workplace') as 'On site' | 'Remote' | 'Hybrid') || null,
      experience:
        (formData.get('experience') as 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive') || null,
      category: formData.get('category') as string,
      tags,
      requirements,
      benefits,
      link: formData.get('link') as string,
      contact_email: (formData.get('contact_email') as string) || null,
      company_logo: (formData.get('company_logo') as string) || null,
      plan: (formData.get('plan') as 'standard' | 'featured' | 'premium') || 'standard',
    };

    startTransition(async () => {
      try {
        const result = await onSubmit(jobData);

        if (result?.success) {
          toast.success(
            result.requiresPayment
              ? 'Job created! Contact us for payment.'
              : 'Job posted successfully!'
          );
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save job');
      }
    });
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag) && tags.length < 10) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addRequirement = () => {
    if (currentRequirement && requirements.length < 20) {
      setRequirements([...requirements, currentRequirement]);
      setCurrentRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const addBenefit = () => {
    if (currentBenefit && benefits.length < 20) {
      setBenefits([...benefits, currentBenefit]);
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={UI_CLASSES.SPACE_Y_6}>
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Basic information about the position</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={titleId}>Job Title *</Label>
            <Input
              id={titleId}
              name="title"
              defaultValue={initialData?.title}
              required
              placeholder="e.g., Senior AI Engineer"
            />
          </div>

          <div>
            <Label htmlFor={companyId}>Company *</Label>
            <Input
              id={companyId}
              name="company"
              defaultValue={initialData?.company}
              required
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={typeId}>Employment Type *</Label>
              <Select name="type" defaultValue={initialData?.type || 'full-time'}>
                <SelectTrigger id={typeId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={workplaceId}>Workplace *</Label>
              <Select name="workplace" defaultValue={initialData?.workplace || 'Remote'}>
                <SelectTrigger id={workplaceId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="On site">On site</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={locationId}>Location</Label>
              <Input
                id={locationId}
                name="location"
                defaultValue={initialData?.location || ''}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div>
              <Label htmlFor={experienceId}>Experience Level</Label>
              <Select name="experience" defaultValue={initialData?.experience || ''}>
                <SelectTrigger id={experienceId}>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry">Entry Level</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={categoryId}>Category *</Label>
              <Select name="category" defaultValue={initialData?.category || 'engineering'}>
                <SelectTrigger id={categoryId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={salaryId}>Salary Range</Label>
              <Input
                id={salaryId}
                name="salary"
                defaultValue={initialData?.salary || ''}
                placeholder="e.g., $120k - $180k"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={descriptionId}>Job Description *</Label>
            <Textarea
              id={descriptionId}
              name="description"
              defaultValue={initialData?.description}
              required
              rows={6}
              placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
              className="resize-none"
            />
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
              Minimum 50 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>Skills and qualifications needed</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={requirementInputId}>Add Requirement</Label>
            <div className={UI_CLASSES.FLEX_GAP_2}>
              <Input
                id={requirementInputId}
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                placeholder="e.g., 5+ years of Python experience"
              />
              <Button type="button" onClick={addRequirement} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {requirements.length > 0 && (
            <div className={UI_CLASSES.SPACE_Y_2}>
              {requirements.map((req) => (
                <div
                  key={req}
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} p-2 border rounded`}
                >
                  <span className={UI_CLASSES.TEXT_SM}>{req}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(requirements.indexOf(req))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits (Optional)</CardTitle>
          <CardDescription>Perks and benefits offered</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={benefitInputId}>Add Benefit</Label>
            <div className={UI_CLASSES.FLEX_GAP_2}>
              <Input
                id={benefitInputId}
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="e.g., Health insurance, 401k, Remote work"
              />
              <Button type="button" onClick={addBenefit} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {benefits.length > 0 && (
            <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
              {benefits.map((benefit) => (
                <Badge key={benefit} variant="secondary">
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeBenefit(benefits.indexOf(benefit))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags *</CardTitle>
          <CardDescription>Keywords for search (minimum 1, maximum 10)</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={tagInputId}>Add Tag</Label>
            <div className={UI_CLASSES.FLEX_GAP_2}>
              <Input
                id={tagInputId}
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., AI, Python, Remote"
              />
              <Button type="button" onClick={addTag} variant="outline" disabled={tags.length >= 10}>
                Add
              </Button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {tags.length === 0 && (
            <p className={`${UI_CLASSES.TEXT_XS} text-destructive`}>At least one tag is required</p>
          )}
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>How candidates can apply</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <Label htmlFor={linkId}>Application URL *</Label>
            <Input
              id={linkId}
              name="link"
              type="url"
              defaultValue={initialData?.link}
              required
              placeholder="https://company.com/careers/apply"
            />
          </div>

          <div>
            <Label htmlFor={contactEmailId}>Contact Email</Label>
            <Input
              id={contactEmailId}
              name="contact_email"
              type="email"
              defaultValue={initialData?.contact_email || ''}
              placeholder="jobs@company.com"
            />
          </div>

          <div>
            <Label htmlFor={companyLogoId}>Company Logo URL</Label>
            <Input
              id={companyLogoId}
              name="company_logo"
              type="url"
              defaultValue={initialData?.company_logo || ''}
              placeholder="https://company.com/logo.png"
            />
          </div>
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
                  <div className={UI_CLASSES.FONT_MEDIUM}>Standard (Free)</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>Basic listing, 30 days</div>
                </div>
              </SelectItem>
              <SelectItem value="featured">
                <div>
                  <div className={UI_CLASSES.FONT_MEDIUM}>Featured (Contact for pricing)</div>
                  <div className={UI_CLASSES.TEXT_XS_MUTED}>Top placement, badge, analytics</div>
                </div>
              </SelectItem>
              <SelectItem value="premium">
                <div>
                  <div className={UI_CLASSES.FONT_MEDIUM}>Premium (Contact for pricing)</div>
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
      <div className={UI_CLASSES.FLEX_GAP_4}>
        <Button
          type="submit"
          disabled={isPending || tags.length === 0 || requirements.length === 0}
        >
          {isPending ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/account/jobs">Cancel</a>
        </Button>
      </div>
    </form>
  );
}
