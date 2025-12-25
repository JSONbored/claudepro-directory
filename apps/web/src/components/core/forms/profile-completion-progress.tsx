'use client';

/**
 * Profile Completion Progress Component
 * Calculates and displays profile completion percentage
 */

import { CheckCircle2, Circle } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';

interface ProfileCompletionProgressProps {
  profile: {
    name?: string;
    username?: string;
    bio?: string;
    work?: string;
    website?: string;
    social_x_link?: string;
    interests?: string[];
    avatarUrl?: string | null;
    heroUrl?: string | null;
  };
}

/**
 * Calculate profile completion percentage based on filled fields
 */
function calculateCompletion(profile: ProfileCompletionProgressProps['profile']): {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
} {
  const fields = [
    { key: 'name', label: 'Name', value: profile.name },
    { key: 'username', label: 'Username', value: profile.username },
    { key: 'bio', label: 'Bio', value: profile.bio },
    { key: 'work', label: 'Work', value: profile.work },
    { key: 'website', label: 'Website', value: profile.website },
    { key: 'social_x_link', label: 'Social Link', value: profile.social_x_link },
    {
      key: 'interests',
      label: 'Interests',
      value: profile.interests?.length ? 'filled' : undefined,
    },
    { key: 'avatarUrl', label: 'Avatar', value: profile.avatarUrl },
    { key: 'heroUrl', label: 'Hero Image', value: profile.heroUrl },
  ];

  const completedFields = fields.filter((field) => field.value).map((field) => field.label);
  const missingFields = fields.filter((field) => !field.value).map((field) => field.label);

  const percentage = Math.round((completedFields.length / fields.length) * 100);

  return { percentage, completedFields, missingFields };
}

export function ProfileCompletionProgress({ profile }: ProfileCompletionProgressProps) {
  const { percentage, completedFields, missingFields } = calculateCompletion(profile);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Profile Completion</p>
          <p className="text-muted-foreground text-xs">{percentage}% complete</p>
        </div>
        <div className="text-2xl font-bold">{percentage}%</div>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-accent h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground mb-1 font-medium">Completed</p>
          <div className="space-y-1">
            {completedFields.map((field) => (
              <div key={field} className="flex items-center gap-1">
                <CheckCircle2 className="text-success h-3 w-3" />
                <span className="text-muted-foreground">{field}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 font-medium">Missing</p>
          <div className="space-y-1">
            {missingFields.map((field) => (
              <div key={field} className="flex items-center gap-1">
                <Circle className="text-muted-foreground h-3 w-3" />
                <span className="text-muted-foreground">{field}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
