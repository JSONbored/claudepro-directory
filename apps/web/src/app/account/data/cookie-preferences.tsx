'use client';

/**
 * Cookie Preferences Component
 * Allows users to manage their cookie preferences
 */

import { Button, toasts, ToggleField } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

export function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    analytics: false,
    essential: true, // Always required
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load cookie preferences from localStorage
    const stored = localStorage.getItem('cookie_preferences');
    if (stored) {
      try {
        setPreferences({ ...preferences, ...JSON.parse(stored) });
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Save to localStorage
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));

    // In production, you'd also set actual cookies based on preferences
    // and communicate with your analytics/marketing services

    toasts.success('Cookie preferences saved');
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Manage your cookie preferences. Essential cookies are required for the site to function.
      </p>

      <ToggleField
        checked={preferences.essential}
        description="Required for the site to function properly"
        disabled
        label="Essential Cookies"
      />

      <ToggleField
        checked={preferences.analytics}
        description="Help us understand how visitors interact with our site"
        label="Analytics Cookies"
        onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
      />

      <ToggleField
        checked={preferences.marketing}
        description="Used to deliver personalized advertisements"
        label="Marketing Cookies"
        onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
      />

      <Button disabled={isSaving} onClick={handleSave}>
        {isSaving ? 'Saving...' : 'Save Cookie Preferences'}
      </Button>
    </div>
  );
}
