'use client';

import { ExperienceLevel } from '@heyclaude/data-layer/prisma';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';
import {
  cn,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { size, cluster, muted, spaceY, border } from "@heyclaude/web-runtime/design-system";

// Use Prisma enum values
const EXPERIENCE_OPTIONS = [
  { value: 'any', label: 'All experience levels' },
  { value: ExperienceLevel.beginner, label: 'Entry level' }, // 'beginner'
  { value: ExperienceLevel.intermediate, label: 'Mid level' }, // 'intermediate'
  { value: ExperienceLevel.advanced, label: 'Senior level' }, // 'advanced'
] as const;

const REMOTE_OPTIONS = [
  { value: 'any', label: 'Any location' },
  { value: 'remote', label: 'Remote only' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'support', label: 'Support' },
  { value: 'research', label: 'Research' },
  { value: 'data', label: 'Data' },
  { value: 'operations', label: 'Operations' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
] as const;

interface JobAlertsCardProps {
  defaultCategory?: string;
  defaultExperience?: string;
  defaultRemote?: 'any' | 'remote';
}

/**
 * Card UI that lets users create email job alerts filtered by category, experience, and remote preference.
 *
 * Renders a form with an email input and selects for preferred category, experience level, and location; submits preferences via the newsletter subscription hook.
 *
 * @param defaultCategory - Initial selected job category (defaults to "all")
 * @param defaultExperience - Initial selected experience level (defaults to "any")
 * @param defaultRemote - Initial selected remote preference, either "any" or "remote" (defaults to "any")
 *
 * @see useNewsletter - hook used to manage subscription state and send the subscription request
 * @see CATEGORY_OPTIONS - available category choices shown in the category select
 * @see EXPERIENCE_OPTIONS - available experience choices shown in the experience select
 * @see REMOTE_OPTIONS - available location choices shown in the location select
 */
export function JobAlertsCard({
  defaultCategory = 'all',
  defaultExperience = 'any',
  defaultRemote = 'any',
}: JobAlertsCardProps) {
  const [category, setCategory] = useState(defaultCategory);
  const [experience, setExperience] = useState(defaultExperience);
  const [remotePreference, setRemotePreference] = useState(defaultRemote);

  const { email, setEmail, subscribe, isSubmitting, error, reset } = useNewsletter({
    source: 'inline',
    successMessage: 'We will email you when new roles match your preferences.',
    metadata: {
      preferred_category: category,
      preferred_experience: experience,
      preferred_remote: remotePreference,
    },
    logContext: {
      component: 'JobAlertsCard',
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await subscribe();
  };

  return (
    <Card className={`border-${border.default}/60`}>
      <CardHeader>
        <CardTitle className={`${size.xl}`}>Job alerts</CardTitle>
        <p className={`text-muted-foreground ${size.sm}`}>
          Get email updates when new AI roles match your preferences.
        </p>
      </CardHeader>
      <CardContent>
        <form className={`${spaceY.comfortable}`} onSubmit={handleSubmit}>
          <div className={`${spaceY.compact}`}>
            <label className={size.sm} htmlFor="job-alert-email">
              Email
            </label>
            <Input
              id="job-alert-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              aria-describedby={error ? 'job-alert-error' : undefined}
            />
          </div>

          <div className={cn('grid gap-3', 'sm:grid-cols-2')}>
            <div className={`${spaceY.compact}`}>
              <label className={size.sm} htmlFor="job-alert-category">
                Category preference
              </label>
              <Select value={category} onValueChange={setCategory} name="preferred_category">
                <SelectTrigger id="job-alert-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={`${spaceY.compact}`}>
              <label className={size.sm} htmlFor="job-alert-experience">
                Experience level
              </label>
              <Select value={experience} onValueChange={setExperience} name="preferred_experience">
                <SelectTrigger id="job-alert-experience">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value ?? ''}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`${spaceY.compact}`}>
            <label className={size.sm} htmlFor="job-alert-remote">
              Location preference
            </label>
            <Select
              value={remotePreference}
              onValueChange={(value: 'any' | 'remote') => setRemotePreference(value)}
              name="preferred_remote"
            >
              <SelectTrigger id="job-alert-remote">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {REMOTE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p id="job-alert-error" className={`text-destructive ${size.sm}`}>
              {error}
            </p>
          ) : null}

          <div className={cluster.compact}>
            <Button type="submit" disabled={isSubmitting} className={`flex-1`}>
              {isSubmitting ? 'Subscribing…' : 'Create alert'}
            </Button>
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={reset}>
              Reset
            </Button>
          </div>

          <p className={cn(size.xs, muted.default, 'leading-snug')}>
            We only send relevant AI roles. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}