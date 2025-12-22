'use client';

/**
 * Data Export Form
 * Allows users to export their account data (GDPR compliant)
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';

interface DataExportFormProps {
  userId: string;
}

export function DataExportForm({ userId }: DataExportFormProps) {
  const [isExporting, setIsExporting] = useState(false);

  const runLoggedAsync = useLoggedAsync({
    scope: 'DataExportForm',
    defaultMessage: 'Data export failed',
    defaultRethrow: false,
  });

  const handleExport = async () => {
    setIsExporting(true);
    await runLoggedAsync(async () => {
      try {
        // Fetch user data
        const userData = await getUserCompleteData(userId);

        if (!userData) {
          toasts.error('Failed to fetch user data');
          return;
        }

        // Create JSON blob
        const jsonData = JSON.stringify(userData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Download file
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toasts.success('Data exported successfully');
      } catch (error) {
        console.error('Data export error:', error);
        toasts.error('Failed to export data');
      }
    });
    setIsExporting(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Download a complete copy of your account data including:
      </p>
      <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
        <li>Profile information</li>
        <li>Bookmarks and collections</li>
        <li>Activity history</li>
        <li>Job listings</li>
        <li>Submissions</li>
        <li>Settings and preferences</li>
      </ul>
      <Button onClick={handleExport} disabled={isExporting} variant="outline">
        {isExporting ? 'Exporting...' : 'Export Data (JSON)'}
      </Button>
    </div>
  );
}

