'use client';

/**
 * Privacy Settings Component
 * Allows users to manage their privacy preferences
 */

import { updateProfile } from '@heyclaude/web-runtime/actions/user';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, toasts, ToggleField } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

interface PrivacySettingsProps {
  userId: string;
}

export function PrivacySettings({ userId }: PrivacySettingsProps) {
  const [profilePublic, setProfilePublic] = useState(true);
  const [followEmail, setFollowEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Failed to save privacy settings',
    defaultRethrow: false,
    scope: 'PrivacySettings',
  });

  useEffect(() => {
    // Load current privacy settings
    // In production, this would load from getUserCompleteData
    // For now, using defaults
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await runLoggedAsync(async () => {
      const result = await updateProfile({
        follow_email: followEmail,
        profile_public: profilePublic,
      });

      if (result?.serverError) {
        toasts.error(result.serverError);
        return;
      }

      if (result?.data) {
        toasts.success('Privacy settings updated successfully');
      }
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <ToggleField
        checked={profilePublic}
        description="Allow others to view your public profile"
        label="Public Profile"
        onCheckedChange={setProfilePublic}
      />

      <ToggleField
        checked={followEmail}
        description="Receive email notifications when someone follows you"
        label="Email on Follow"
        onCheckedChange={setFollowEmail}
      />

      <Button disabled={isSaving} onClick={handleSave}>
        {isSaving ? 'Saving...' : 'Save Privacy Settings'}
      </Button>
    </div>
  );
}
