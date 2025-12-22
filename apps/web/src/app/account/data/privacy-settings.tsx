'use client';

/**
 * Privacy Settings Component
 * Allows users to manage their privacy preferences
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { ToggleField, Button, toasts } from '@heyclaude/web-runtime/ui';
import { useState, useEffect } from 'react';
import { updateProfile } from '@heyclaude/web-runtime/actions/user';

interface PrivacySettingsProps {
  userId: string;
}

export function PrivacySettings({ userId }: PrivacySettingsProps) {
  const [profilePublic, setProfilePublic] = useState(true);
  const [followEmail, setFollowEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const runLoggedAsync = useLoggedAsync({
    scope: 'PrivacySettings',
    defaultMessage: 'Failed to save privacy settings',
    defaultRethrow: false,
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
        profile_public: profilePublic,
        follow_email: followEmail,
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
        label="Public Profile"
        description="Allow others to view your public profile"
        checked={profilePublic}
        onCheckedChange={setProfilePublic}
      />

      <ToggleField
        label="Email on Follow"
        description="Receive email notifications when someone follows you"
        checked={followEmail}
        onCheckedChange={setFollowEmail}
      />

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Privacy Settings'}
      </Button>
    </div>
  );
}

