/**
 * MFA Factors List
 * Displays enrolled MFA factors with unenroll functionality
 */

'use client';

import { listMFAFactors, type MFAFactor, unenrollMFAFactor } from '@heyclaude/web-runtime/auth/mfa';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync, useIsMounted, useBoolean } from '@heyclaude/web-runtime/hooks';
import { AlertTriangle, CheckCircle, Loader2, Shield, Trash } from '@heyclaude/web-runtime/icons';
import {
  errorToasts,
  successToasts,
  UnifiedBadge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useState } from 'react';

interface MFAFactorsListProps {
  onFactorUnenrolled?: () => void;
}

export function MFAFactorsList({ onFactorUnenrolled }: MFAFactorsListProps) {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const { value: loading, setTrue: setLoadingTrue, setFalse: setLoadingFalse } = useBoolean(true);
  const [error, setError] = useState<null | string>(null);
  const { value: unenrollDialogOpen, setTrue: setUnenrollDialogOpenTrue, setFalse: setUnenrollDialogOpenFalse, setValue: setUnenrollDialogOpen } = useBoolean();
  const [factorToUnenroll, setFactorToUnenroll] = useState<MFAFactor | null>(null);
  const { value: unenrolling, setTrue: setUnenrollingTrue, setFalse: setUnenrollingFalse } = useBoolean();

  const supabase = createSupabaseBrowserClient();
  const runLoggedAsync = useLoggedAsync({
    scope: 'MFAFactorsList',
    defaultMessage: 'MFA operation failed',
    defaultRethrow: false,
  });
  const isMounted = useIsMounted();

  const loadFactors = useCallback(async () => {
    if (!isMounted()) return;
    setLoadingTrue();
    setError(null);

    try {
      await runLoggedAsync(
        async () => {
          const { factors: userFactors, error: listError } = await listMFAFactors(supabase);

          if (listError) {
            throw listError;
          }

          if (isMounted()) {
            setFactors(userFactors);
          }
        },
        {
          message: 'Failed to load MFA factors',
          level: 'warn',
        }
      );
    } catch (error_) {
      // Error already logged by useLoggedAsync
      if (isMounted()) {
        const message = error_ instanceof Error ? error_.message : 'Failed to load MFA factors';
        setError(message);
        errorToasts.actionFailed('load MFA factors', message);
      }
    } finally {
      if (isMounted()) {
        setLoadingFalse();
      }
    }
  }, [supabase, runLoggedAsync, isMounted]);

  useEffect(() => {
    loadFactors().catch(() => {
      // Error already handled in loadFactors
    });
  }, [loadFactors]);

  const handleUnenroll = async () => {
    if (!factorToUnenroll || !isMounted()) return;

    // Check if this is the last verified factor
    const verifiedFactors = factors.filter((f) => f.status === 'verified');
    if (verifiedFactors.length <= 1 && factorToUnenroll.status === 'verified') {
      if (isMounted()) {
        errorToasts.actionFailed(
          'unenroll MFA factor',
          'Cannot unenroll your last verified MFA factor. Please add another factor first.'
        );
        setUnenrollDialogOpenFalse();
      }
      return;
    }

    if (isMounted()) {
      setUnenrollingTrue();
    }

    try {
      await runLoggedAsync(
        async () => {
          const { success, error: unenrollError } = await unenrollMFAFactor(
            supabase,
            factorToUnenroll.id
          );

          if (unenrollError || !success) {
            throw unenrollError || new Error('Unenrollment failed');
          }

          if (isMounted()) {
            successToasts.actionCompleted('MFA factor unenrolled');
            setUnenrollDialogOpenFalse();
            setFactorToUnenroll(null);
            await loadFactors();
            onFactorUnenrolled?.();
          }
        },
        {
          message: 'Failed to unenroll MFA factor',
          context: {
            factorId: factorToUnenroll.id,
            factorType: factorToUnenroll.factor_type,
          },
        }
      );
    } catch (error_) {
      // Error already logged by useLoggedAsync
      if (isMounted()) {
        const message = error_ instanceof Error ? error_.message : 'Failed to unenroll MFA factor';
        errorToasts.actionFailed('unenroll MFA factor', message);
      }
    } finally {
      if (isMounted()) {
        setUnenrollingFalse();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-base border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (factors.length === 0) {
    return (
      <div className="card-base bg-muted/30 p-4 text-center text-muted-foreground text-sm">
        No MFA factors enrolled. Enable two-factor authentication to get started.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className="flex items-center justify-between card-base p-4 transition-colors hover:bg-accent/5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full border bg-accent/5 p-2">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-medium">
                    {factor.friendly_name || `${factor.factor_type.toUpperCase()} Factor`}
                  </h3>
                  {factor.status === 'verified' ? (
                    <UnifiedBadge variant="base" style="default" className="gap-0.5">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </UnifiedBadge>
                  ) : (
                    <UnifiedBadge variant="base" style="secondary">
                      Pending
                    </UnifiedBadge>
                  )}
                </div>
                <div className="mt-1 text-muted-foreground text-sm">
                  <p>Type: {factor.factor_type.toUpperCase()}</p>
                  {factor.factor_type === 'phone' && factor.phone ? (
                    <p>Phone: {factor.phone}</p>
                  ) : null}
                  <p className="text-xs">
                    Added: {new Date(factor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {factor.status === 'verified' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFactorToUnenroll(factor);
                  setUnenrollDialogOpenTrue();
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash className="mr-1 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              <AlertTriangle className="text-destructive" />
              Remove MFA Factor?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this MFA factor? You will no longer be able to use it
              for two-factor authentication.
              <br />
              <br />
              {factorToUnenroll ? (
                <span className="font-medium">
                  Factor:{' '}
                  {factorToUnenroll.friendly_name || factorToUnenroll.factor_type.toUpperCase()}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={setUnenrollDialogOpenFalse}
              disabled={unenrolling}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenroll} disabled={unenrolling}>
              {unenrolling ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Factor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
