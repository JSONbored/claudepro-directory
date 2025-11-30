/**
 * MFA Challenge Dialog
 * Shown during login when user needs to verify MFA factor
 */

'use client';

import type { MFAFactor } from '@heyclaude/web-runtime';
import { createMFAChallenge, listMFAFactors, verifyMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2, Shield } from '@heyclaude/web-runtime/icons';
import { iconLeading, iconSize } from '@heyclaude/web-runtime/design-system';
import { errorToasts } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';

interface MFAChallengeDialogProps {
  open: boolean;
  onVerified: () => void;
}

/**
 * Renders a modal dialog that prompts the user for a 6-digit MFA code, verifies the selected verified MFA factor, and notifies the parent when verification succeeds.
 *
 * The dialog loads the user's verified MFA factors, allows selecting one (when multiple exist), accepts a 6-digit code, performs challenge creation and verification, displays loading and error states, and calls `onVerified` after a successful verification and brief session refresh wait.
 *
 * @param open - Whether the dialog is visible.
 * @param onVerified - Callback invoked after successful MFA verification.
 *
 * @returns The dialog element that handles MFA factor selection, code entry, verification flow, and user-facing error/loading states.
 *
 * @see listMFAFactors
 * @see createMFAChallenge
 * @see verifyMFAChallenge
 * @see useLoggedAsync
 * @see createSupabaseBrowserClient
 */
export function MFAChallengeDialog({ open, onVerified }: MFAChallengeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<MFAFactor | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const supabase = createSupabaseBrowserClient();
  const runLoggedAsync = useLoggedAsync({
    scope: 'MFAChallengeDialog',
    defaultMessage: 'MFA operation failed',
    defaultRethrow: false,
  });

  const loadFactors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await runLoggedAsync(
        async () => {
          const { factors: userFactors, error: listError } = await listMFAFactors(supabase);

          if (listError) {
            throw listError;
          }

          const verifiedFactors = userFactors.filter((f) => f.status === 'verified');
          if (verifiedFactors.length === 0) {
            throw new Error('No verified MFA factors found');
          }

          setFactors(verifiedFactors);
          setSelectedFactor(verifiedFactors[0] || null);
        },
        {
          message: 'Failed to load MFA factors',
          level: 'warn',
        }
      );
    } catch (err) {
      // Error already logged by useLoggedAsync
      const message = err instanceof Error ? err.message : 'Failed to load MFA factors';
      setError(message);
      errorToasts.actionFailed('load MFA factors', message);
    } finally {
      setLoading(false);
    }
  }, [supabase, runLoggedAsync]);

  const handleVerify = useCallback(async () => {
    if (!(selectedFactor && verifyCode.trim()) || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await runLoggedAsync(
        async () => {
          // Create challenge
          const { data: challengeData, error: challengeError } = await createMFAChallenge(
            supabase,
            selectedFactor.id
          );

          if (challengeError || !challengeData) {
            throw challengeError || new Error('Failed to create challenge');
          }

          // challengeId from challengeData is used directly in verify call

          // Verify challenge
          const { success, error: verifyError } = await verifyMFAChallenge(
            supabase,
            selectedFactor.id,
            challengeData.id,
            verifyCode
          );

          if (verifyError || !success) {
            throw verifyError || new Error('Invalid verification code');
          }

          // Session will be refreshed automatically by Supabase
          // Wait a moment for session to update
          await new Promise((resolve) => setTimeout(resolve, 500));

          onVerified();
        },
        {
          message: 'MFA verification failed',
          context: {
            factorId: selectedFactor.id,
            hasCode: !!verifyCode,
          },
        }
      );
    } catch (err) {
      // Error already logged by useLoggedAsync
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      errorToasts.actionFailed('verify MFA', message);
      setVerifyCode('');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedFactor, verifyCode, onVerified, runLoggedAsync]);

  useEffect(() => {
    if (open) {
      loadFactors().catch(() => {
        // Error already handled in loadFactors
      });
    }
  }, [open, loadFactors]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Dialog should not be closed by user during MFA challenge
        if (!isOpen) {
          // Prevent closing
        }
      }}
    >
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className={iconSize.sm} />
            Two-Factor Authentication Required
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to continue.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
            <AlertCircle className={iconSize.sm} />
            <span>{error}</span>
          </div>
        )}

        {loading && factors.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`${iconSize.xl} animate-spin text-muted-foreground`} />
          </div>
        ) : (
          <div className="space-y-4">
            {factors.length > 1 && (
              <div className="space-y-2">
                <Label>Select authenticator</Label>
                <select
                  value={selectedFactor?.id || ''}
                  onChange={(e) => {
                    const factor = factors.find((f) => f.id === e.target.value);
                    setSelectedFactor(factor || null);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  disabled={loading}
                >
                  {factors.map((factor) => (
                    <option key={factor.id} value={factor.id}>
                      {factor.friendly_name || `${factor.factor_type.toUpperCase()} Factor`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mfa-code">Enter 6-digit code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerifyCode(value);
                  setError(null);
                }}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
                disabled={loading}
                autoFocus={true}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && verifyCode.length === 6 && !loading) {
                    handleVerify().catch(() => {
                      // Error already handled in handleVerify
                    });
                  }
                }}
              />
            </div>

            <Button
              onClick={() => {
                handleVerify().catch(() => {
                  // Error already handled in handleVerify
                });
              }}
              disabled={loading || verifyCode.length !== 6 || !selectedFactor}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className={`${iconLeading.sm} animate-spin`} />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}