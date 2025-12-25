'use client';

/**
 * Profile Edit Form - Database-First Architecture
 * Uses React Hook Form + generated Zod schema for validation.
 */

import type { Prisma } from '@prisma/client';

type public_usersModel = Prisma.public_usersGetPayload<{}>;
import { normalizeError } from '@heyclaude/shared-runtime';
import { refreshProfileFromOAuth, updateProfile } from '@heyclaude/web-runtime/actions/user';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import {
  extractFirstFieldFromTuple,
  isPostgresTupleString,
} from '@heyclaude/web-runtime/utils/deserialize-postgres-tuple';
import { toasts, FormField, ToggleField, Button, cn } from '@heyclaude/web-runtime/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { type Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { ListItemManager } from '@/src/components/core/forms/list-items-editor';
import { ProfileAvatarUpload } from './profile-avatar-upload';
import { ProfileHeroUpload } from './profile-hero-upload';
import { ProfileCompletionProgress } from './profile-completion-progress';
import { ProfileLivePreview } from './profile-live-preview';

// Profile data consolidated into users table - use generated types
type ProfileData = Pick<
  public_usersModel,
  | 'bio'
  | 'display_name'
  | 'follow_email'
  | 'interests'
  | 'profile_public'
  | 'social_x_link'
  | 'website'
  | 'work'
  | 'username'
>;

// Optional URL schema - accepts empty string or valid URL
// Defined locally to avoid client/server boundary issues
const optionalUrlSchema = z
  .string()
  .refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Must be a valid URL',
  })
  .optional();

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  // Username validation is handled by database constraint (users_username_format_check)
  // Database enforces: lowercase alphanumeric + hyphens, 3-30 chars, no leading/trailing hyphens
  // Client-side: basic string validation only, database will provide detailed error messages
  username: z.string().optional(),
  bio: z.string().max(500).optional(),
  work: z.string().max(100).optional(),
  website: optionalUrlSchema,
  social_x_link: optionalUrlSchema,
  interests: z.array(z.string()).max(10).optional(),
  public: z.boolean(),
  follow_email: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  profile: ProfileData;
  avatarUrl?: string | null;
  heroUrl?: string | null;
}

/**
 * Renders an editable profile form populated from `profile`, validates input, and submits updates to the server.
 *
 * The component manages form state, displays field-level validation errors, shows success/error toasts on submission,
 * and resets the form to submitted values on successful update.
 *
 * @param props.profile - Initial profile values used to populate the form (bio, work, website, social_x_link, interests, profile_public, follow_email).
 * @param props.avatarUrl - Current avatar image URL (optional).
 * @param props.heroUrl - Current hero image URL (optional).
 * @returns The profile edit form element.
 *
 * @see profileFormSchema
 * @see updateProfile
 * @see toasts
 */
export function ProfileEditForm({ profile, avatarUrl, heroUrl }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const { user, status } = useAuthenticatedUser({ context: 'ProfileEditForm' });
  const { openAuthModal } = useAuthModal();
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
      // Defensive: Ensure display_name is a string, not a serialized tuple
      name: (() => {
        if (!profile.display_name) {
          return '';
        }
        // Check if it's a PostgreSQL tuple string
        if (isPostgresTupleString(profile.display_name)) {
          const extracted = extractFirstFieldFromTuple(profile.display_name);
          return extracted ?? '';
        }
        // If it's already a string, use it
        if (typeof profile.display_name === 'string') {
          return profile.display_name;
        }
        // Otherwise, convert to string
        return String(profile.display_name);
      })(),
      username: profile.username ?? undefined,
      bio: typeof profile.bio === 'string' ? profile.bio : '',
      work: typeof profile.work === 'string' ? profile.work : '',
      website: typeof profile['website'] === 'string' ? profile['website'] : '',
      social_x_link: typeof profile['social_x_link'] === 'string' ? profile['social_x_link'] : '',
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      public: typeof profile.profile_public === 'boolean' ? profile.profile_public : true,
      follow_email: typeof profile.follow_email === 'boolean' ? profile.follow_email : true,
    },
  });

  const interests = watch('interests') || [];
  const isPublic = watch('public');
  const followEmail = watch('follow_email');

  const onSubmit = useCallback(
    (data: ProfileFormData) => {
      // Proactive auth check - show modal before attempting action
      if (status === 'loading') {
        // Wait for auth check to complete
        return;
      }

      if (!user) {
        // User is not authenticated - show auth modal
        openAuthModal({
          valueProposition: 'Sign in to update your profile',
          redirectTo: pathname ?? undefined,
        });
        return;
      }

      // User is authenticated - proceed with profile update
      startTransition(async () => {
        try {
          await runLoggedAsync(
            async () => {
              const result = await updateProfile({
                display_name: data.name || undefined,
                ...(data.username && { username: data.username }),
                bio: data.bio || '',
                work: data.work || '',
                website: data['website'] || '',
                social_x_link: data['social_x_link'] || '',
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
          const normalized = normalizeError(error, 'Failed to update profile');
          const errorMessage = normalized.message;

          // Check if error is auth-related and show modal if so
          if (
            errorMessage.includes('signed in') ||
            errorMessage.includes('auth') ||
            errorMessage.includes('unauthorized')
          ) {
            openAuthModal({
              valueProposition: 'Sign in to update your profile',
              redirectTo: pathname ?? undefined,
            });
          } else {
            // Non-auth errors - show toast with retry option
            toasts.raw.error('Failed to update profile', {
              action: {
                label: 'Retry',
                onClick: () => {
                  onSubmit(data);
                },
              },
            });
          }
        }
      });
    },
    [user, status, openAuthModal, pathname, runLoggedAsync, reset]
  );

  // Calculate profile completion for progress bar
  const profileFields = {
    name: watch('name'),
    username: watch('username'),
    bio: watch('bio'),
    work: watch('work'),
    website: watch('website'),
    social_x_link: watch('social_x_link'),
    interests: watch('interests') || [],
    avatarUrl,
    heroUrl,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Completion Progress */}
      <ProfileCompletionProgress profile={profileFields} />

      {/* Profile Images Section */}
      <div className="border-border/50 bg-card/50 space-y-4 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Profile Images</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProfileAvatarUpload currentAvatarUrl={avatarUrl} />
          <ProfileHeroUpload currentHeroUrl={heroUrl} />
        </div>
      </div>

      {/* Live Preview */}
      <ProfileLivePreview
        profile={{
          name: watch('name'),
          username: watch('username'),
          bio: watch('bio'),
          work: watch('work'),
          website: watch('website'),
          social_x_link: watch('social_x_link'),
          interests: watch('interests') || [],
          avatarUrl,
          heroUrl,
        }}
      />

      <FormField
        variant="input"
        label="Name"
        value={watch('name')}
        onChange={(e) => setValue('name', e.target.value, { shouldDirty: true })}
        placeholder="Your name"
        maxLength={100}
        required
        error={!!errors.name}
        {...(errors.name?.message && { errorMessage: errors.name.message })}
      />

      <FormField
        variant="input"
        label="Username"
        value={watch('username') || ''}
        onChange={(e) => setValue('username', e.target.value.toLowerCase(), { shouldDirty: true })}
        placeholder="slick-rabbit29"
        maxLength={30}
        description="Your profile URL will be /u/your-username. Only lowercase letters, numbers, and hyphens."
        error={!!errors.username}
        {...(errors.username?.message && { errorMessage: errors.username.message })}
      />

      <FormField
        variant="textarea"
        label="Bio"
        value={watch('bio') || ''}
        onChange={(e) => setValue('bio', e.target.value, { shouldDirty: true })}
        placeholder="Tell us about yourself..."
        maxLength={500}
        showCharCount
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
        error={!!errors['website']}
        {...(errors['website']?.message && { errorMessage: errors['website'].message })}
      />

      <FormField
        variant="input"
        label="X / Twitter"
        type="url"
        value={watch('social_x_link') || ''}
        onChange={(e) => setValue('social_x_link', e.target.value, { shouldDirty: true })}
        placeholder="https://x.com/yourhandle"
        error={!!errors['social_x_link']}
        {...(errors['social_x_link']?.message && { errorMessage: errors['social_x_link'].message })}
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
        noDuplicates
        showCounter
        badgeStyle="secondary"
        description="Press Enter or click Add"
      />

      <div className={cn('space-y-4', 'pt-3')}>
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

      <div className={cn('flex', 'gap-2', 'pt-4')}>
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        {isDirty ? (
          <Button type="button" variant="outline" onClick={() => reset()}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function RefreshProfileButton({ providerLabel }: { providerLabel: string }) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

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
            // Check if server error is auth-related
            const serverError = result.serverError || '';
            if (
              serverError.includes('signed in') ||
              serverError.includes('auth') ||
              serverError.includes('unauthorized')
            ) {
              openAuthModal({
                valueProposition: 'Sign in to update your profile',
                redirectTo: pathname ?? undefined,
              });
            } else {
              toasts.error.serverError(result.serverError);
            }
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
