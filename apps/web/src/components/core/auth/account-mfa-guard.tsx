/**
 * Account MFA Guard
 * Client component that wraps account pages and checks for MFA requirement
 */

'use client';

import { requiresMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { MFAChallengeDialog } from '@/src/components/features/account/mfa/mfa-challenge-dialog';

interface AccountMFAGuardProps {
  children: React.ReactNode;
}

/**
 * Ensures the current session meets MFA requirements and conditionally prompts for verification.
 *
 * On mount, checks whether MFA is required. While checking, renders a loading state.
 * If MFA is required, opens an MFAChallengeDialog; when verification succeeds, closes the dialog,
 * clears the requirement, and refreshes the router to obtain the updated session. If the check fails,
 * the component falls back to rendering the provided children.
 *
 * @param props.children - Content to render when MFA is not required.
 * @returns The loading UI while checking, the MFAChallengeDialog when verification is required, or the wrapped children otherwise.
 *
 * @see MFAChallengeDialog
 * @see requiresMFAChallenge
 */
export function AccountMFAGuard({ children }: AccountMFAGuardProps) {
  const [checking, setChecking] = useState(true);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [checkError, setCheckError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const checkMFARequirement = useCallback(async () => {
    try {
      const { requires, error } = await requiresMFAChallenge(supabase);

      if (error) {
        // Treat error as a failure that should be logged and shown to user
        const normalized = normalizeError(error, 'MFA check failed');
        logClientError(
          '[MFA] Failed to check MFA requirement',
          normalized,
          'AccountMFAGuard.checkMFARequirement',
          {
            component: 'AccountMFAGuard',
            action: 'check-mfa-requirement',
            category: 'auth',
            recoverable: false,
          }
        );
        setCheckError(normalized);
        setRequiresMFA(false);
      } else {
        setCheckError(null);
        setRequiresMFA(requires);
        if (requires) {
          setMfaDialogOpen(true);
        }
      }
    } catch (err) {
      const normalized = normalizeError(
        err instanceof Error ? err : new Error('Unknown MFA error'),
        'MFA check threw an exception'
      );
      logClientError(
        '[MFA] MFA check threw exception',
        normalized,
        'AccountMFAGuard.checkMFARequirement',
        {
          component: 'AccountMFAGuard',
          action: 'check-mfa-requirement',
          category: 'auth',
          recoverable: false,
        }
      );
      setCheckError(normalized);
      setRequiresMFA(false);
    } finally {
      setChecking(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkMFARequirement().catch(() => {
      // Error already handled in checkMFARequirement
    });
  }, [checkMFARequirement]);

  const handleMFAVerified = () => {
    setMfaDialogOpen(false);
    setRequiresMFA(false);
    // Refresh the page to get updated session with AAL2
    router.refresh();
  };

  if (checking) {
    // Show loading state while checking
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state instead of silently failing open
  if (checkError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-destructive mb-2 text-xl font-semibold">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to verify authentication requirements. Please refresh the page or contact support
            if the issue persists.
          </p>
          <button
            type="button"
            onClick={() => {
              setCheckError(null);
              setChecking(true);
              checkMFARequirement().catch(() => {
                // Error already handled in checkMFARequirement
              });
            }}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {requiresMFA ? (
        <MFAChallengeDialog open={mfaDialogOpen} onVerified={handleMFAVerified} />
      ) : null}
      {!requiresMFA && children}
    </>
  );
}