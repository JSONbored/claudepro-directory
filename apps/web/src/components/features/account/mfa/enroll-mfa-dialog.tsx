/**
 * MFA Enrollment Dialog
 * Allows users to enroll a TOTP factor for multi-factor authentication
 */

'use client';

import { createMFAChallenge, enrollTOTPFactor, verifyMFAChallenge } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2, Shield } from '@heyclaude/web-runtime/icons';
import {
  errorToasts,
  successToasts,
  UI_CLASSES,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import { useState } from 'react';

interface EnrollMFADialogProps {
  onEnrolled: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EnrollMFADialog({ open, onOpenChange, onEnrolled }: EnrollMFADialogProps) {
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [qrCode, setQrCode] = useState<null | string>(null);
  const [secret, setSecret] = useState<null | string>(null);
  const [factorId, setFactorId] = useState<null | string>(null);
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
    } catch (error_) {
      // Error already logged by useLoggedAsync
      const message = error_ instanceof Error ? error_.message : 'Failed to enroll MFA factor';
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
    } catch (error_) {
      // Error already logged by useLoggedAsync
      const message = error_ instanceof Error ? error_.message : 'Failed to verify MFA code';
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
          <DialogTitle className="flex items-center gap-2">
            <Shield className={UI_CLASSES.ICON_SM} />
            Enable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === 'enroll'
              ? 'Scan the QR code with your authenticator app to add an extra layer of security.'
              : 'Enter the 6-digit code from your authenticator app to complete setup.'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm">
            <AlertCircle className={UI_CLASSES.ICON_SM} />
            <span>{error}</span>
          </div>
        ) : null}

        {step === 'enroll' && (
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Click &quot;Start Setup&quot; to generate a QR code. Scan it with an authenticator app
              like Google Authenticator, Authy, or 1Password.
            </div>
            <Button onClick={handleEnroll} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className={`${UI_CLASSES.ICON_SM_LEADING} animate-spin`} />
                  Generating QR Code...
                </>
              ) : (
                'Start Setup'
              )}
            </Button>
          </div>
        )}

        {step === 'verify' && qrCode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-background rounded-lg border p-4">
                {qrCode ? (
                  <Image
                    src={qrCode}
                    alt="MFA QR Code"
                    width={192}
                    height={192}
                    className="h-48 w-48"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                ) : null}
              </div>
              {secret ? (
                <div className="w-full space-y-2">
                  <Label htmlFor="secret" className="text-xs">
                    Or enter this secret manually:
                  </Label>
                  <Input
                    id="secret"
                    value={secret}
                    readOnly
                    className="font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter 6-digit code</Label>
              <Input
                id="verify-code"
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
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className={`${UI_CLASSES.ICON_SM_LEADING} animate-spin`} />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            {step === 'verify' ? 'Back' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
