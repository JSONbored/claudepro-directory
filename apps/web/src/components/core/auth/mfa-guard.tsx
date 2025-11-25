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
      {requiresMFA && <MFAChallengeDialog open={mfaDialogOpen} onVerified={handleMFAVerified} />}
      {!requiresMFA && children}
    </>
  );
}
