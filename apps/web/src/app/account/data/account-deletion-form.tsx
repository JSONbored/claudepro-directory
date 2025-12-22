'use client';

/**
 * Account Deletion Form
 * Allows users to permanently delete their account
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';

interface AccountDeletionFormProps {
  userId: string;
  userEmail: string;
}

export function AccountDeletionForm({ userId, userEmail }: AccountDeletionFormProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const runLoggedAsync = useLoggedAsync({
    scope: 'AccountDeletionForm',
    defaultMessage: 'Account deletion failed',
    defaultRethrow: false,
  });

  const canDelete =
    confirmEmail === userEmail &&
    confirmText.toLowerCase() === 'delete my account';

  const handleDelete = async () => {
    if (!canDelete) {
      toasts.error('Please confirm all fields correctly');
      return;
    }

    setIsDeleting(true);
    await runLoggedAsync(async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        // Delete account via Supabase Auth
        // Note: This requires proper RLS policies and may need admin API access
        // For now, we'll show a message that account deletion should be handled via support
        toasts.error(
          'Account deletion must be processed through support. Please contact us to delete your account.'
        );

        // TODO: Implement proper account deletion via RPC or Admin API
        // const { error } = await supabase.auth.admin.deleteUser(userId);
        // if (error) throw error;
        // router.push('/');
      } catch (error) {
        console.error('Account deletion error:', error);
        toasts.error('Failed to delete account. Please contact support.');
      }
    });
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 border-destructive/50 rounded-lg border p-4">
        <p className="text-destructive font-semibold text-sm mb-2">
          Warning: This action cannot be undone
        </p>
        <p className="text-muted-foreground text-sm">
          Deleting your account will permanently remove all your data including:
        </p>
        <ul className="text-muted-foreground list-inside list-disc mt-2 space-y-1 text-sm">
          <li>Your profile and all profile information</li>
          <li>All bookmarks and collections</li>
          <li>All job listings and submissions</li>
          <li>All activity history</li>
          <li>All settings and preferences</li>
        </ul>
      </div>

      <FormField
        label="Confirm Email"
        description="Enter your email address to confirm"
        required
      >
        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder={userEmail}
        />
      </FormField>

      <FormField
        label="Type 'delete my account' to confirm"
        description="This confirms you understand this action is permanent"
        required
      >
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="delete my account"
        />
      </FormField>

      <Button
        onClick={handleDelete}
        disabled={!canDelete || isDeleting}
        variant="destructive"
      >
        {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
      </Button>
    </div>
  );
}

