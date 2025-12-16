/**
 * MFA Challenge Dialog
 * Shown during login when user needs to verify MFA factor
 */

'use client';

import { type MFAFactor } from '@heyclaude/web-runtime';
import { createMFAChallenge, listMFAFactors, verifyMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2, Shield } from '@heyclaude/web-runtime/icons';
import {
  errorToasts,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@heyclaude/web-runtime/ui';
import { useBoolean } from '@heyclaude/web-runtime/hooks';
import { useCallback, useEffect, useState } from 'react';
import { iconSize, marginRight, gap, padding, paddingY, spaceY, paddingX } from "@heyclaude/web-runtime/design-system";

interface MFAChallengeDialogProps {
  onVerified: () => void;
  open: boolean;
}

export function MFAChallengeDialog({ open, onVerified }: MFAChallengeDialogProps) {
  const { value: loading, setTrue: setLoadingTrue, setFalse: setLoadingFalse } = useBoolean();
  const [error, setError] = useState<null | string>(null);
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
    setLoadingTrue();
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
    } catch (error_) {
      // Error already logged by useLoggedAsync
      const message = error_ instanceof Error ? error_.message : 'Failed to load MFA factors';
      setError(message);
      errorToasts.actionFailed('load MFA factors', message);
    } finally {
      setLoadingFalse();
    }
  }, [supabase, runLoggedAsync]);

  const handleVerify = useCallback(async () => {
    if (!(selectedFactor && verifyCode.trim()) || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoadingTrue();
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
    } catch (error_) {
      // Error already logged by useLoggedAsync
      const message = error_ instanceof Error ? error_.message : 'Verification failed';
      setError(message);
      errorToasts.actionFailed('verify MFA', message);
      setVerifyCode('');
    } finally {
      setLoadingFalse();
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
          <DialogTitle className={`flex items-center ${gap.tight}`}>
            <Shield className={iconSize.sm} />
            Two-Factor Authentication Required
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to continue.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className={`bg-destructive/10 text-destructive flex items-center ${gap.tight} rounded-md ${padding.compact} text-sm`}>
            <AlertCircle className={iconSize.sm} />
            <span>{error}</span>
          </div>
        ) : null}

        {loading && factors.length === 0 ? (
          <div className={`flex items-center justify-center ${paddingY.relaxed}`}>
            <Loader2 className={`${iconSize.xl} text-muted-foreground animate-spin`} />
          </div>
        ) : (
          <div className={`${spaceY.comfortable}`}>
            {factors.length > 1 && (
              <div className={`${spaceY.compact}`}>
                <Label>Select authenticator</Label>
                <select
                  value={selectedFactor?.id || ''}
                  onChange={(e) => {
                    const factor = factors.find((f) => f.id === e.target.value);
                    setSelectedFactor(factor || null);
                  }}
                  className={`border-input bg-background ring-offset-background flex h-10 w-full rounded-md border ${paddingX.compact} ${paddingY.tight} text-sm`}
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

            <div className={`${spaceY.compact}`}>
              <Label htmlFor="mfa-code">Enter 6-digit code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => {
                  const value = e.target.value.replaceAll(/\D/g, '').slice(0, 6);
                  setVerifyCode(value);
                  setError(null);
                }}
                placeholder="000000"
                className="text-center font-mono text-lg tracking-widest"
                disabled={loading}
                autoFocus
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
                  <Loader2 className={`${iconSize.sm} ${marginRight.compact} animate-spin`} />
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
