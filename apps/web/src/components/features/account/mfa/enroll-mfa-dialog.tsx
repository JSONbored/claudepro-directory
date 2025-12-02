/**
 * MFA Enrollment Dialog
 * Allows users to enroll a TOTP factor for multi-factor authentication
 */

'use client';

import { createMFAChallenge, enrollTOTPFactor, verifyMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2, Shield } from '@heyclaude/web-runtime/icons';
import { iconLeading, iconSize, cluster, spaceY, muted, helper  , padding , gap , radius , size, flexDir,
  tracking,
  bgColor,
  alignItems,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import { errorToasts, successToasts } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';

interface EnrollMFADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
}

/**
 * Controlled dialog that guides a user through enrolling a TOTP MFA factor and verifying it.
 *
 * Renders a two-step flow: generate an enrollment QR code and secret, then create and verify a 6-digit
 * code from the user's authenticator app; calls `onEnrolled` and closes the dialog after successful verification.
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback invoked with the new open state when the dialog is opened or closed
 * @param onEnrolled - Callback invoked after successful MFA enrollment
 * @returns The dialog JSX element for enrolling and verifying a TOTP MFA factor
 *
 * @see createSupabaseBrowserClient
 * @see enrollTOTPFactor
 * @see createMFAChallenge
 * @see verifyMFAChallenge
 */
export function EnrollMFADialog({ open, onOpenChange, onEnrolled }: EnrollMFADialogProps) {
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const supabase = createSupabaseBrowserClient();
  const runLoggedAsync = useLoggedAsync({
    scope: 'EnrollMFADialog',
    defaultMessage: 'MFA enrollment failed',
    defaultRethrow: false,
  });

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);

    try {
      await runLoggedAsync(
        async () => {
          const { data, error: enrollError } = await enrollTOTPFactor(supabase);

          if (enrollError || !data) {
            throw enrollError || new Error('Enrollment failed');
          }

          setFactorId(data.id);
          setQrCode(data.qr_code);
          setSecret(data.secret);
          setStep('verify');
          // challengeId will be created during verification
        },
        {
          message: 'Failed to enroll MFA factor',
          level: 'warn',
        }
      );
    } catch (err) {
      // Error already logged by useLoggedAsync
      const message = err instanceof Error ? err.message : 'Failed to enroll MFA factor';
      setError(message);
      errorToasts.actionFailed('enroll MFA', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!(factorId && verifyCode.trim()) || verifyCode.length !== 6) {
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
            factorId
          );

          if (challengeError || !challengeData) {
            throw challengeError || new Error('Failed to create challenge');
          }

          // challengeId stored in challengeData, used in verify call

          // Verify challenge
          const { success, error: verifyError } = await verifyMFAChallenge(
            supabase,
            factorId,
            challengeData.id,
            verifyCode
          );

          if (verifyError || !success) {
            throw verifyError || new Error('Verification failed');
          }

          successToasts.actionCompleted('MFA factor enrolled successfully');
          onEnrolled();
          onOpenChange(false);
          resetDialog();
        },
        {
          message: 'MFA verification failed',
          context: {
            factorId,
            hasCode: !!verifyCode,
          },
        }
      );
    } catch (err) {
      // Error already logged by useLoggedAsync
      const message = err instanceof Error ? err.message : 'Failed to verify MFA code';
      setError(message);
      errorToasts.actionFailed('verify MFA', message);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep('enroll');
    setError(null);
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerifyCode('');
  };

  const handleClose = (open: boolean) => {
    if (!(open || loading)) {
      resetDialog();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={cluster.compact}>
            <Shield className={iconSize.sm} />
            Enable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === 'enroll'
              ? 'Scan the QR code with your authenticator app to add an extra layer of security.'
              : 'Enter the 6-digit code from your authenticator app to complete setup.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className={`${cluster.compact} ${radius.md} ${bgColor['destructive/10']} ${padding.compact} ${helper.destructive}`}>
            <AlertCircle className={iconSize.sm} />
            <span>{error}</span>
          </div>
        )}

        {step === 'enroll' && (
          <div className={spaceY.comfortable}>
            <div className={muted.sm}>
              Click &quot;Start Setup&quot; to generate a QR code. Scan it with an authenticator app
              like Google Authenticator, Authy, or 1Password.
            </div>
            <Button onClick={handleEnroll} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className={`${iconLeading.sm} animate-spin`} />
                  Generating QR Code...
                </>
              ) : (
                'Start Setup'
              )}
            </Button>
          </div>
        )}

        {step === 'verify' && qrCode && (
          <div className={spaceY.comfortable}>
            <div className={`flex ${flexDir.col} ${alignItems.center} ${gap.comfortable}`}>
              <div className={`${radius.lg} border ${bgColor.background} ${padding.default}`}>
                {qrCode && (
                  <Image
                    src={qrCode}
                    alt="MFA QR Code"
                    width={192}
                    height={192}
                    className={squareSize.avatar6xl}
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                )}
              </div>
              {secret && (
                <div className={`w-full ${spaceY.compact}`}>
                  <Label htmlFor="secret" className={size.xs}>
                    Or enter this secret manually:
                  </Label>
                  <Input
                    id="secret"
                    value={secret}
                    readOnly={true}
                    className={`font-mono ${size.xs}`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
              )}
            </div>

            <div className={spaceY.compact}>
              <Label htmlFor="verify-code">Enter 6-digit code</Label>
              <Input
                id="verify-code"
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
                className={`text-center font-mono ${size.lg} ${tracking.widest}`}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className={`${iconLeading.sm} animate-spin`} />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            {step === 'verify' ? 'Back' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}