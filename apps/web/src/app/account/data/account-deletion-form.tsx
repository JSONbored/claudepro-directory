'use client';

/**
 * Account Deletion Form
 * Allows users to permanently delete their account
 */

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AccountDeletionFormProps {
  userEmail: string;
  userId: string;
}

export function AccountDeletionForm({ userEmail, userId }: AccountDeletionFormProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Account deletion failed',
    defaultRethrow: false,
    scope: 'AccountDeletionForm',
  });

  const canDelete = confirmEmail === userEmail && confirmText.toLowerCase() === 'delete my account';

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
        <p className="text-destructive mb-2 text-sm font-semibold">
          Warning: This action cannot be undone
        </p>
        <p className="text-muted-foreground text-sm">
          Deleting your account will permanently remove all your data including:
        </p>
        <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
          <li>Your profile and all profile information</li>
          <li>All bookmarks and collections</li>
          <li>All job listings and submissions</li>
          <li>All activity history</li>
          <li>All settings and preferences</li>
        </ul>
      </div>

      <FormField required description="Enter your email address to confirm" label="Confirm Email">
        <input
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={userEmail}
          type="email"
          value={confirmEmail}
        />
      </FormField>

      <FormField
        description="This confirms you understand this action is permanent"
        label="Type 'delete my account' to confirm"
        required
      >
        <input
          className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="delete my account"
          type="text"
          value={confirmText}
        />
      </FormField>

      <Button disabled={!canDelete || isDeleting} variant="destructive" onClick={handleDelete}>
        {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
      </Button>
    </div>
  );
}
