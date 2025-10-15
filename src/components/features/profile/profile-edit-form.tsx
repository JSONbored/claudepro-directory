'use client';

/**
 * Profile Edit Form
 * Form for editing user profile information
 */

import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Switch } from '@/src/components/ui/switch';
import { Textarea } from '@/src/components/ui/textarea';
import { refreshProfileFromOAuth, updateProfile } from '@/src/lib/actions/user.actions';
import { X } from '@/src/lib/icons';
import type { ProfileData } from '@/src/lib/schemas/profile.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface ProfileEditFormProps {
  profile: ProfileData;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);

  // Generate unique IDs for form fields
  const nameId = useId();
  const bioId = useId();
  const workId = useId();
  const websiteId = useId();
  const socialXId = useId();
  const interestsId = useId();

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
  const [newInterest, setNewInterest] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateProfile({
        name: name || undefined,
        bio: bio || undefined,
        work: work || undefined,
        website: website || undefined,
        social_x_link: socialXLink || undefined,
        interests,
        public: isPublic,
        follow_email: followEmail,
      });

      if (result?.data?.success) {
        toast.success('Profile updated successfully');
        setHasChanges(false);
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    });
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) return;

    if (interests.length >= 10) {
      toast.error('Maximum 10 interests allowed');
      return;
    }

    if (interests.includes(trimmed)) {
      toast.error('Interest already added');
      return;
    }

    if (trimmed.length > 30) {
      toast.error('Interest must be less than 30 characters');
      return;
    }

    setInterests([...interests, trimmed]);
    setNewInterest('');
    setHasChanges(true);
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
    setHasChanges(true);
  };

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name *</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleFieldChange();
          }}
          placeholder="Your name"
          maxLength={100}
          required
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor={bioId}>Bio</Label>
        <Textarea
          id={bioId}
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            handleFieldChange();
          }}
          placeholder="Tell us about yourself..."
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
      </div>

      {/* Work */}
      <div className="space-y-2">
        <Label htmlFor={workId}>Work</Label>
        <Input
          id={workId}
          value={work}
          onChange={(e) => {
            setWork(e.target.value);
            handleFieldChange();
          }}
          placeholder="e.g., Software Engineer at Company"
          maxLength={100}
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor={websiteId}>Website</Label>
        <Input
          id={websiteId}
          type="url"
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            handleFieldChange();
          }}
          placeholder="https://yourwebsite.com"
        />
      </div>

      {/* X/Twitter Link */}
      <div className="space-y-2">
        <Label htmlFor={socialXId}>X / Twitter</Label>
        <Input
          id={socialXId}
          type="url"
          value={socialXLink}
          onChange={(e) => {
            setSocialXLink(e.target.value);
            handleFieldChange();
          }}
          placeholder="https://x.com/yourhandle"
        />
      </div>

      {/* Interests/Tags */}
      <div className="space-y-2">
        <Label htmlFor={interestsId}>Interests & Skills</Label>
        <div className="flex gap-2">
          <Input
            id={interestsId}
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterest();
              }
            }}
            placeholder="Add an interest..."
            maxLength={30}
          />
          <Button type="button" onClick={handleAddInterest} variant="outline">
            Add
          </Button>
        </div>

        {/* Display interests */}
        {interests.length > 0 && (
          <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-3`}>
            {interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${interest}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {interests.length}/10 interests (press Enter or click Add)
        </p>
      </div>

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
            toast.success(`Refreshed from ${providerLabel}`);
          } else if (result?.serverError) {
            toast.error(result.serverError);
          } else {
            toast.error('Failed to refresh profile');
          }
        })
      }
      disabled={isPending}
    >
      {isPending ? 'Refreshing...' : 'Refresh from ' + providerLabel}
    </Button>
  );
}
