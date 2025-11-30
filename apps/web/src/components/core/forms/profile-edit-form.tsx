'use client';

/**
 * Profile Edit Form - Database-First Architecture
 * Uses React Hook Form + generated Zod schema for validation.
 */

import type { Database } from '@heyclaude/database-types';
import { normalizeError } from '@heyclaude/shared-runtime';
import { refreshProfileFromOAuth, updateProfile } from '@heyclaude/web-runtime';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { toasts } from '@heyclaude/web-runtime/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField, ToggleField } from '@heyclaude/web-runtime/ui';
import { ListItemManager } from '@/src/components/core/forms/list-items-editor';
import { Button } from '@heyclaude/web-runtime/ui';

// Profile data consolidated into users table - use generated types
type ProfileData = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'display_name'
  | 'bio'
  | 'work'
  | 'website'
  | 'social_x_link'
  | 'interests'
  | 'profile_public'
  | 'follow_email'
>;

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500).optional(),
  work: z.string().max(100).optional(),
  website: z
    .string()
    .refine((val) => val === '' || z.string().url().safeParse(val).success, {
      message: 'Must be a valid URL',
    })
    .optional(),
  social_x_link: z
    .string()
    .refine((val) => val === '' || z.string().url().safeParse(val).success, {
      message: 'Must be a valid URL',
    })
    .optional(),
  interests: z.array(z.string()).max(10).optional(),
  public: z.boolean(),
  follow_email: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  profile: ProfileData;
}

/**
 * Renders a profile edit form wired to React Hook Form and the generated Zod schema, allowing a user to edit and submit profile fields.
 *
 * The form handles validation, shows field-level errors, manages interests via ListItemManager, and submits updates through the updateProfile API while displaying contextual toasts.
 *
 * @param profile - Initial profile values used to populate the form. Expected to include fields such as `display_name`, `bio`, `work`, `website`, `social_x_link`, `interests`, `profile_public`, and `follow_email`. Missing fields are populated with sensible defaults.
 * @returns The JSX form element used to edit and submit a user's profile.
 *
 * @see ListItemManager
 * @see updateProfile
 * @see toasts
 * @see profileFormSchema
 */
export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const runLoggedAsync = useLoggedAsync({
    scope: 'ProfileEditForm',
    defaultMessage: 'Profile update failed',
    defaultRethrow: false,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    // Type assertion needed due to version incompatibility between Zod v4 and @hookform/resolvers v5.2.2
    // The resolver expects Zod v3 types but we're using Zod v4. This is a known compatibility issue.
    // TODO: Update @hookform/resolvers when a version with full Zod v4 support is available
    // Using double cast (as unknown as) as TypeScript requires when types don't overlap sufficiently
    resolver: zodResolver(
      profileFormSchema as unknown as Parameters<typeof zodResolver>[0]
    ) as unknown as Resolver<ProfileFormData>,
    defaultValues: {
      name: profile.display_name || '',
      bio: profile.bio || '',
      work: profile.work || '',
      website: profile.website || '',
      social_x_link: profile.social_x_link || '',
      interests: profile.interests || [],
      public: profile.profile_public ?? true,
      follow_email: profile.follow_email ?? true,
    },
  });

  const interests = watch('interests') || [];
  const isPublic = watch('public');
  const followEmail = watch('follow_email');

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        await runLoggedAsync(
          async () => {
            const result = await updateProfile({
              display_name: data.name || undefined,
              bio: data.bio || '',
              work: data.work || '',
              website: data.website || '',
              social_x_link: data.social_x_link || '',
              interests: data.interests,
              profile_public: data.public,
              follow_email: data.follow_email,
            });

            if (result?.data?.success) {
              toasts.success.profileUpdated();
              reset(data);
            } else if (result?.serverError) {
              throw new Error(result.serverError);
            } else {
              throw new Error('Profile update returned unexpected response');
            }
          },
          {
            message: 'Profile update failed',
            context: {
              hasName: !!data.name,
              hasBio: !!data.bio,
            },
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        toasts.error.serverError(normalizeError(error, 'Failed to update profile').message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        variant="input"
        label="Name"
        value={watch('name')}
        onChange={(e) => setValue('name', e.target.value, { shouldDirty: true })}
        placeholder="Your name"
        maxLength={100}
        required={true}
        error={!!errors.name}
        {...(errors.name?.message && { errorMessage: errors.name.message })}
      />

      <FormField
        variant="textarea"
        label="Bio"
        value={watch('bio') || ''}
        onChange={(e) => setValue('bio', e.target.value, { shouldDirty: true })}
        placeholder="Tell us about yourself..."
        maxLength={500}
        showCharCount={true}
        rows={4}
        error={!!errors.bio}
        {...(errors.bio?.message && { errorMessage: errors.bio.message })}
      />

      <FormField
        variant="input"
        label="Work"
        value={watch('work') || ''}
        onChange={(e) => setValue('work', e.target.value, { shouldDirty: true })}
        placeholder="e.g., Software Engineer at Company"
        maxLength={100}
        error={!!errors.work}
        {...(errors.work?.message && { errorMessage: errors.work.message })}
      />

      <FormField
        variant="input"
        label="Website"
        type="url"
        value={watch('website') || ''}
        onChange={(e) => setValue('website', e.target.value, { shouldDirty: true })}
        placeholder="https://yourwebsite.com"
        error={!!errors.website}
        {...(errors.website?.message && { errorMessage: errors.website.message })}
      />

      <FormField
        variant="input"
        label="X / Twitter"
        type="url"
        value={watch('social_x_link') || ''}
        onChange={(e) => setValue('social_x_link', e.target.value, { shouldDirty: true })}
        placeholder="https://x.com/yourhandle"
        error={!!errors.social_x_link}
        {...(errors.social_x_link?.message && { errorMessage: errors.social_x_link.message })}
      />

      <ListItemManager
        variant="badge"
        label="Interests & Skills"
        items={interests}
        onChange={(newInterests) => setValue('interests', newInterests, { shouldDirty: true })}
        onFieldChange={() => {
          // Intentional
        }}
        placeholder="Add an interest..."
        maxItems={10}
        maxLength={30}
        noDuplicates={true}
        showCounter={true}
        badgeStyle="secondary"
        description="Press Enter or click Add"
      />

      <div className="space-y-4 pt-2">
        <ToggleField
          label="Public profile"
          description="Allow others to view your profile"
          checked={isPublic}
          onCheckedChange={(checked) => setValue('public', !!checked, { shouldDirty: true })}
          ariaLabel="Toggle public profile visibility"
        />

        <ToggleField
          label="Email on new followers"
          description="Send me an email when someone follows me"
          checked={followEmail}
          onCheckedChange={(checked) => setValue('follow_email', !!checked, { shouldDirty: true })}
          ariaLabel="Toggle follower email notifications"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        {isDirty && (
          <Button type="button" variant="outline" onClick={() => reset()}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function RefreshProfileButton({ providerLabel }: { providerLabel: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        startTransition(async () => {
          const result = await refreshProfileFromOAuth();
          if (result?.data?.success) {
            toasts.success.actionCompleted(`Refreshed from ${providerLabel}`);
          } else if (result?.serverError) {
            toasts.error.serverError(result.serverError);
          } else {
            toasts.error.profileRefreshFailed();
          }
        })
      }
      disabled={isPending}
    >
      {isPending ? 'Refreshing...' : `Refresh from ${providerLabel}`}
    </Button>
  );
}