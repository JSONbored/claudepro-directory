'use client';

/**
 * Preferences Form
 * Allows users to manage their account preferences
 *
 * Note: Currently uses localStorage for preferences. In production, this should be extended
 * to use a user_preferences database table for persistence across devices.
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, toasts, ToggleField } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

interface PreferencesFormProps {
  section: 'accessibility' | 'content' | 'email' | 'language';
}

interface Preferences {
  accessibility: {
    fontSize: string;
    highContrast: boolean;
    reducedMotion: boolean;
  };
  contentFilters: {
    showNSFW: boolean;
    showSpoilers: boolean;
  };
  dateFormat: string;
  emailFrequency: string;
  emailNotifications: boolean;
  language: string;
  timezone: string;
}

const defaultPreferences: Preferences = {
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
  },
  contentFilters: {
    showNSFW: false,
    showSpoilers: true,
  },
  dateFormat: 'MM/DD/YYYY',
  emailFrequency: 'weekly',
  emailNotifications: true,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function PreferencesForm({ section }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Failed to save preferences',
    defaultRethrow: false,
    scope: 'PreferencesForm',
  });

  useEffect(() => {
    // Load preferences from localStorage
    // In production, this would load from a database table
    const stored = localStorage.getItem('user_preferences');
    if (stored) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      } catch (error) {
        console.error('Failed to parse stored preferences:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const savePreferences = async () => {
    setIsSaving(true);
    await runLoggedAsync(async () => {
      // Save to localStorage
      // In production, this would save to a database table via server action
      localStorage.setItem('user_preferences', JSON.stringify(preferences));

      // Apply accessibility preferences immediately
      document.documentElement.classList.toggle(
        'reduce-motion',
        preferences.accessibility.reducedMotion
      );

      document.documentElement.classList.toggle(
        'high-contrast',
        preferences.accessibility.highContrast
      );

      toasts.success('Preferences saved successfully');
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading preferences...</div>;
  }

  if (section === 'language') {
    return (
      <div className="space-y-4">
        <FormField required label="Language">
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            value={preferences.language}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </FormField>

        <FormField required label="Timezone">
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
            value={preferences.timezone}
          >
            {Intl.supportedValuesOf('timeZone').map((tz) => (
              <option key={tz} value={tz}>
                {tz.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </FormField>

        <FormField required label="Date Format">
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
            value={preferences.dateFormat}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
          </select>
        </FormField>

        <Button disabled={isSaving} onClick={savePreferences}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'email') {
    return (
      <div className="space-y-4">
        <FormField required label="Email Frequency">
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e) => setPreferences({ ...preferences, emailFrequency: e.target.value })}
            value={preferences.emailFrequency}
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </FormField>

        <ToggleField
          checked={preferences.emailNotifications}
          description="Receive email notifications for important account updates"
          label="Email Notifications"
          onCheckedChange={(checked) =>
            setPreferences({ ...preferences, emailNotifications: checked })
          }
        />

        <Button disabled={isSaving} onClick={savePreferences}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'content') {
    return (
      <div className="space-y-4">
        <ToggleField
          checked={preferences.contentFilters.showNSFW}
          description="Display content marked as not safe for work"
          label="Show NSFW Content"
          onCheckedChange={(checked) =>
            setPreferences({
              ...preferences,
              contentFilters: { ...preferences.contentFilters, showNSFW: checked },
            })
          }
        />

        <ToggleField
          checked={preferences.contentFilters.showSpoilers}
          description="Display content that may contain spoilers"
          label="Show Spoilers"
          onCheckedChange={(checked) =>
            setPreferences({
              ...preferences,
              contentFilters: { ...preferences.contentFilters, showSpoilers: checked },
            })
          }
        />

        <Button disabled={isSaving} onClick={savePreferences}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'accessibility') {
    return (
      <div className="space-y-4">
        <ToggleField
          checked={preferences.accessibility.reducedMotion}
          description="Reduce animations and motion effects for better accessibility"
          label="Reduce Motion"
          onCheckedChange={(checked) => {
            setPreferences({
              ...preferences,
              accessibility: { ...preferences.accessibility, reducedMotion: checked },
            });
            // Apply immediately
            document.documentElement.classList.toggle('reduce-motion', checked);
          }}
        />

        <ToggleField
          checked={preferences.accessibility.highContrast}
          description="Increase contrast for better visibility"
          label="High Contrast"
          onCheckedChange={(checked) => {
            setPreferences({
              ...preferences,
              accessibility: { ...preferences.accessibility, highContrast: checked },
            });
            // Apply immediately
            document.documentElement.classList.toggle('high-contrast', checked);
          }}
        />

        <FormField required label="Font Size">
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e) =>
              setPreferences({
                ...preferences,
                accessibility: { ...preferences.accessibility, fontSize: e.target.value },
              })
            }
            value={preferences.accessibility.fontSize}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </FormField>

        <Button disabled={isSaving} onClick={savePreferences}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  return null;
}
