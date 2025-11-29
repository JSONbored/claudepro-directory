'use client';

import { Constants } from '@heyclaude/database-types';
import { cn, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';

// Use Constants for enum values
const EXPERIENCE_OPTIONS = [
  { value: 'any', label: 'All experience levels' },
  { value: Constants.public.Enums.experience_level[0], label: 'Entry level' }, // 'beginner'
  { value: Constants.public.Enums.experience_level[1], label: 'Mid level' }, // 'intermediate'
  { value: Constants.public.Enums.experience_level[2], label: 'Senior level' }, // 'advanced'
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
  defaultRemote?: 'remote' | 'any';
}

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
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Job alerts</CardTitle>
        <p className="text-muted-foreground text-sm">
          Get email updates when new AI roles match your preferences.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className={UI_CLASSES.TEXT_SM} htmlFor="job-alert-email">
              Email
            </label>
            <Input
              id="job-alert-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required={true}
              aria-describedby={error ? 'job-alert-error' : undefined}
            />
          </div>

          <div className={cn('grid gap-3', 'sm:grid-cols-2')}>
            <div className="space-y-2">
              <label className={UI_CLASSES.TEXT_SM} htmlFor="job-alert-category">
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

            <div className="space-y-2">
              <label className={UI_CLASSES.TEXT_SM} htmlFor="job-alert-experience">
                Experience level
              </label>
              <Select value={experience} onValueChange={setExperience} name="preferred_experience">
                <SelectTrigger id="job-alert-experience">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={UI_CLASSES.TEXT_SM} htmlFor="job-alert-remote">
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

          {error && (
            <p id="job-alert-error" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Subscribing…' : 'Create alert'}
            </Button>
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={reset}>
              Reset
            </Button>
          </div>

          <p className={cn(UI_CLASSES.TEXT_XS_MUTED, 'leading-snug')}>
            We only send relevant AI roles. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
