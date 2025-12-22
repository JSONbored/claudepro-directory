'use client';

/**
 * Cookie Preferences Component
 * Allows users to manage their cookie preferences
 */

import { ToggleField, Button, toasts } from '@heyclaude/web-runtime/ui';
import { useState, useEffect } from 'react';

export function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
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
        label="Essential Cookies"
        description="Required for the site to function properly"
        checked={preferences.essential}
        disabled
      />

      <ToggleField
        label="Analytics Cookies"
        description="Help us understand how visitors interact with our site"
        checked={preferences.analytics}
        onCheckedChange={(checked) =>
          setPreferences({ ...preferences, analytics: checked })
        }
      />

      <ToggleField
        label="Marketing Cookies"
        description="Used to deliver personalized advertisements"
        checked={preferences.marketing}
        onCheckedChange={(checked) =>
          setPreferences({ ...preferences, marketing: checked })
        }
      />

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Cookie Preferences'}
      </Button>
    </div>
  );
}

