/**
 * MFA Guard Component
 * Wraps authenticated content and shows MFA challenge if needed
 */

'use client';

import { requiresMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { MFAChallengeDialog } from '@/src/components/features/account/mfa/mfa-challenge-dialog';

interface MFAGuardProps {
  children: React.ReactNode;
}

/**
 * Guards wrapped content by showing an MFA challenge dialog when a multi-factor authentication challenge is required.
 *
 * On mount, checks whether an MFA challenge is required and, if so, opens the dialog and keeps the guarded content hidden until verification completes.
 * If the MFA check fails, the component defaults to allowing access (fail-open). After successful verification the component closes the dialog and refreshes the page to obtain the updated session.
 *
 * @param children - The content to render when MFA is not required or after successful MFA verification.
 * @returns A React element that renders either the MFA challenge dialog (when required) or the provided `children`.
 *
 * @see MFAChallengeDialog
 * @see requiresMFAChallenge
 * @see createSupabaseBrowserClient
 */
export function MFAGuard({ children }: MFAGuardProps) {
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
        setMfaDialogOpen(requires);
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
    return null;
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