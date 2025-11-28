/**
 * MFA Factors List
 * Displays enrolled MFA factors with unenroll functionality
 */

'use client';

import { listMFAFactors, type MFAFactor, unenrollMFAFactor } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertTriangle, CheckCircle, Loader2, Shield, Trash } from '@heyclaude/web-runtime/icons';
import { errorToasts, successToasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';

interface MFAFactorsListProps {
  onFactorUnenrolled?: () => void;
}

export function MFAFactorsList({ onFactorUnenrolled }: MFAFactorsListProps) {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [factorToUnenroll, setFactorToUnenroll] = useState<MFAFactor | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  const supabase = createSupabaseBrowserClient();
  const runLoggedAsync = useLoggedAsync({
    scope: 'MFAFactorsList',
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

          setFactors(userFactors);
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

  useEffect(() => {
    loadFactors().catch(() => {
      // Error already handled in loadFactors
    });
  }, [loadFactors]);

  const handleUnenroll = async () => {
    if (!factorToUnenroll) return;

    // Check if this is the last verified factor
    const verifiedFactors = factors.filter((f) => f.status === 'verified');
    if (verifiedFactors.length <= 1 && factorToUnenroll.status === 'verified') {
      errorToasts.actionFailed(
        'unenroll MFA factor',
        'Cannot unenroll your last verified MFA factor. Please add another factor first.'
      );
      setUnenrollDialogOpen(false);
      return;
    }

    setUnenrolling(true);

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

          successToasts.actionCompleted('MFA factor unenrolled');
          setUnenrollDialogOpen(false);
          setFactorToUnenroll(null);
          await loadFactors();
          onFactorUnenrolled?.();
        },
        {
          message: 'Failed to unenroll MFA factor',
          context: {
            factorId: factorToUnenroll.id,
            factorType: factorToUnenroll.factor_type,
          },
        }
      );
    } catch (err) {
      // Error already logged by useLoggedAsync
      const message = err instanceof Error ? err.message : 'Failed to unenroll MFA factor';
      errorToasts.actionFailed('unenroll MFA factor', message);
    } finally {
      setUnenrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className={`${UI_CLASSES.ICON_XL} animate-spin text-muted-foreground`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (factors.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-center text-muted-foreground text-sm">
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
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full border bg-accent/5 p-3">
                <Shield className={UI_CLASSES.ICON_LG} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {factor.friendly_name || `${factor.factor_type.toUpperCase()} Factor`}
                  </h3>
                  {factor.status === 'verified' ? (
                    <UnifiedBadge variant="base" style="default" className="gap-1">
                      <CheckCircle className={UI_CLASSES.ICON_XS} />
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
                  {factor.factor_type === 'phone' && factor.phone && <p>Phone: {factor.phone}</p>}
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
                  setUnenrollDialogOpen(true);
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash className={UI_CLASSES.ICON_SM_LEADING} />
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Remove MFA Factor?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this MFA factor? You will no longer be able to use it
              for two-factor authentication.
              <br />
              <br />
              {factorToUnenroll && (
                <span className="font-medium">
                  Factor:{' '}
                  {factorToUnenroll.friendly_name || factorToUnenroll.factor_type.toUpperCase()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnenrollDialogOpen(false)}
              disabled={unenrolling}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenroll} disabled={unenrolling}>
              {unenrolling ? (
                <>
                  <Loader2 className={`${UI_CLASSES.ICON_SM_LEADING} animate-spin`} />
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
