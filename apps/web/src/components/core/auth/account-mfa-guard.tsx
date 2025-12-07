/**
 * Account MFA Guard
 * Client component that wraps account pages and checks for MFA requirement
 */

'use client';

import { requiresMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
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
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const checkMFARequirement = useCallback(async () => {
    try {
      const { requires, error } = await requiresMFAChallenge(supabase);

      if (error) {
        // If error checking, assume no MFA required (fail open)
        setRequiresMFA(false);
      } else {
        setRequiresMFA(requires);
        if (requires) {
          setMfaDialogOpen(true);
        }
      }
    } catch {
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

  return (
    <>
      {requiresMFA ? (
        <MFAChallengeDialog open={mfaDialogOpen} onVerified={handleMFAVerified} />
      ) : null}
      {!requiresMFA && children}
    </>
  );
}