'use client';

/**
 * Preferences Form
 * Allows users to manage their account preferences
 * 
 * Note: Currently uses localStorage for preferences. In production, this should be extended
 * to use a user_preferences database table for persistence across devices.
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, ToggleField, toasts } from '@heyclaude/web-runtime/ui';
import { useState, useEffect } from 'react';

interface PreferencesFormProps {
  section: 'language' | 'email' | 'content' | 'accessibility';
}

interface Preferences {
  language: string;
  timezone: string;
  dateFormat: string;
  emailFrequency: string;
  emailNotifications: boolean;
  contentFilters: {
    showNSFW: boolean;
    showSpoilers: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: string;
  };
}

const defaultPreferences: Preferences = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  emailFrequency: 'weekly',
  emailNotifications: true,
  contentFilters: {
    showNSFW: false,
    showSpoilers: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
};

export function PreferencesForm({ section }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const runLoggedAsync = useLoggedAsync({
    scope: 'PreferencesForm',
    defaultMessage: 'Failed to save preferences',
    defaultRethrow: false,
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
      if (preferences.accessibility.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }

      if (preferences.accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }

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
        <FormField label="Language" required>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </FormField>

        <FormField label="Timezone" required>
          <select
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Intl.supportedValuesOf('timeZone').map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Date Format" required>
          <select
            value={preferences.dateFormat}
            onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
          </select>
        </FormField>

        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'email') {
    return (
      <div className="space-y-4">
        <FormField label="Email Frequency" required>
          <select
            value={preferences.emailFrequency}
            onChange={(e) => setPreferences({ ...preferences, emailFrequency: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </FormField>

        <ToggleField
          label="Email Notifications"
          description="Receive email notifications for important account updates"
          checked={preferences.emailNotifications}
          onCheckedChange={(checked) =>
            setPreferences({ ...preferences, emailNotifications: checked })
          }
        />

        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'content') {
    return (
      <div className="space-y-4">
        <ToggleField
          label="Show NSFW Content"
          description="Display content marked as not safe for work"
          checked={preferences.contentFilters.showNSFW}
          onCheckedChange={(checked) =>
            setPreferences({
              ...preferences,
              contentFilters: { ...preferences.contentFilters, showNSFW: checked },
            })
          }
        />

        <ToggleField
          label="Show Spoilers"
          description="Display content that may contain spoilers"
          checked={preferences.contentFilters.showSpoilers}
          onCheckedChange={(checked) =>
            setPreferences({
              ...preferences,
              contentFilters: { ...preferences.contentFilters, showSpoilers: checked },
            })
          }
        />

        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  if (section === 'accessibility') {
    return (
      <div className="space-y-4">
        <ToggleField
          label="Reduce Motion"
          description="Reduce animations and motion effects for better accessibility"
          checked={preferences.accessibility.reducedMotion}
          onCheckedChange={(checked) => {
            setPreferences({
              ...preferences,
              accessibility: { ...preferences.accessibility, reducedMotion: checked },
            });
            // Apply immediately
            if (checked) {
              document.documentElement.classList.add('reduce-motion');
            } else {
              document.documentElement.classList.remove('reduce-motion');
            }
          }}
        />

        <ToggleField
          label="High Contrast"
          description="Increase contrast for better visibility"
          checked={preferences.accessibility.highContrast}
          onCheckedChange={(checked) => {
            setPreferences({
              ...preferences,
              accessibility: { ...preferences.accessibility, highContrast: checked },
            });
            // Apply immediately
            if (checked) {
              document.documentElement.classList.add('high-contrast');
            } else {
              document.documentElement.classList.remove('high-contrast');
            }
          }}
        />

        <FormField label="Font Size" required>
          <select
            value={preferences.accessibility.fontSize}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                accessibility: { ...preferences.accessibility, fontSize: e.target.value },
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </FormField>

        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    );
  }

  return null;
}

