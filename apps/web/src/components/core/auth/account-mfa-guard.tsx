/**
 * Account MFA Guard
 * Client component that wraps account pages and checks for MFA requirement
 */

'use client';

import { requiresMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { muted, minHeight, justify,
  alignItems,
} from '@heyclaude/web-runtime/design-system';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MFAChallengeDialog } from '@/src/components/features/account/mfa/mfa-challenge-dialog';

interface AccountMFAGuardProps {
  children: React.ReactNode;
}

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
      <div className={`flex ${minHeight.screen} ${alignItems.center} ${justify.center}`}>
        <div className={`text-center ${muted.default}`}>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {requiresMFA && <MFAChallengeDialog open={mfaDialogOpen} onVerified={handleMFAVerified} />}
      {!requiresMFA && children}
    </>
  );
}
