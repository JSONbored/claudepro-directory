'use client';

/**
 * Profile Edit Form
 * Form for editing user profile information
 */

import { useState, useTransition } from 'react';
import { refreshProfileFromOAuth, updateProfile } from '#lib/actions/user';
import { FormField } from '@/src/components/forms/utilities/form-field';
import { ListItemManager } from '@/src/components/forms/utilities/list-item-manager';
import { Button } from '@/src/components/primitives/button';
import { Label } from '@/src/components/primitives/label';
import { Switch } from '@/src/components/primitives/switch';
import type { ProfileData } from '@/src/lib/schemas/profile.schema';
import { toasts } from '@/src/lib/utils/toast.utils';

interface ProfileEditFormProps {
  profile: ProfileData;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState(profile.name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [work, setWork] = useState(profile.work || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [socialXLink, setSocialXLink] = useState(profile.social_x_link || '');
  const [isPublic, setIsPublic] = useState<boolean>(profile.public ?? true);
  const [followEmail, setFollowEmail] = useState<boolean>(profile.follow_email ?? true);
  const [interests, setInterests] = useState<string[]>(() => {
    if (
      Array.isArray(profile.interests) &&
      profile.interests.every((item): item is string => typeof item === 'string')
    ) {
      return profile.interests;
    }
    return [];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateProfile({
        name: name || undefined,
        bio: bio || '',
        work: work || '',
        website: website || '',
        social_x_link: socialXLink || '',
        interests,
        public: isPublic,
        follow_email: followEmail,
      });

      if (result?.data?.success) {
        toasts.success.profileUpdated();
        setHasChanges(false);
      } else if (result?.serverError) {
        toasts.error.serverError(result.serverError);
      }
    });
  };

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <FormField
        variant="input"
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          handleFieldChange();
        }}
        placeholder="Your name"
        maxLength={100}
        required
      />

      {/* Bio */}
      <FormField
        variant="textarea"
        label="Bio"
        value={bio}
        onChange={(e) => {
          setBio(e.target.value);
          handleFieldChange();
        }}
        placeholder="Tell us about yourself..."
        maxLength={500}
        showCharCount
        rows={4}
      />

      {/* Work */}
      <FormField
        variant="input"
        label="Work"
        value={work}
        onChange={(e) => {
          setWork(e.target.value);
          handleFieldChange();
        }}
        placeholder="e.g., Software Engineer at Company"
        maxLength={100}
      />

      {/* Website */}
      <FormField
        variant="input"
        label="Website"
        type="url"
        value={website}
        onChange={(e) => {
          setWebsite(e.target.value);
          handleFieldChange();
        }}
        placeholder="https://yourwebsite.com"
      />

      {/* X/Twitter Link */}
      <FormField
        variant="input"
        label="X / Twitter"
        type="url"
        value={socialXLink}
        onChange={(e) => {
          setSocialXLink(e.target.value);
          handleFieldChange();
        }}
        placeholder="https://x.com/yourhandle"
      />

      {/* Interests/Tags */}
      <ListItemManager
        variant="badge"
        label="Interests & Skills"
        items={interests}
        onChange={setInterests}
        onFieldChange={handleFieldChange}
        placeholder="Add an interest..."
        maxItems={10}
        maxLength={30}
        noDuplicates
        showCounter
        badgeStyle="secondary"
        description="Press Enter or click Add"
      />

      {/* Privacy & Notifications */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <Label>Public profile</Label>
            <p className="text-xs text-muted-foreground mt-1">Allow others to view your profile</p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => {
              setIsPublic(!!checked);
              setHasChanges(true);
            }}
            aria-label="Toggle public profile visibility"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Email on new followers</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Send me an email when someone follows me
            </p>
          </div>
          <Switch
            checked={followEmail}
            onCheckedChange={(checked) => {
              setFollowEmail(!!checked);
              setHasChanges(true);
            }}
            aria-label="Toggle follower email notifications"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isPending || !hasChanges}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        {hasChanges && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Reset to original values
              setName(profile.name || '');
              setBio(profile.bio || '');
              setWork(profile.work || '');
              setWebsite(profile.website || '');
              setSocialXLink(profile.social_x_link || '');
              setIsPublic(profile.public ?? true);
              setFollowEmail(profile.follow_email ?? true);
              setInterests(
                Array.isArray(profile.interests) &&
                  profile.interests.every((item): item is string => typeof item === 'string')
                  ? profile.interests
                  : []
              );
              setHasChanges(false);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// Small client button to refresh profile data from OAuth provider.
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
