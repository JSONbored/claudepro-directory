/**
 * MFA Factors List
 * Displays enrolled MFA factors with unenroll functionality
 */

'use client';

import { listMFAFactors, type MFAFactor, unenrollMFAFactor } from '@heyclaude/web-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { AlertTriangle, CheckCircle, Loader2, Shield, Trash } from '@heyclaude/web-runtime/icons';
import { iconLeading, iconSize, cluster, spaceY, marginTop, muted, helper, weight, radius , padding , gap } from '@heyclaude/web-runtime/design-system';
import { errorToasts, successToasts } from '@heyclaude/web-runtime/ui';
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

/**
 * Renders a list of the user's enrolled MFA factors and provides UI to remove verified factors.
 *
 * Fetches MFA factors on mount, displays loading/error/empty states, and allows unenrolling a verified
 * factor after confirmation while preventing removal of the last verified factor. On successful unenrollment
 * the list is reloaded and the optional callback is invoked.
 *
 * @param props.onFactorUnenrolled - Optional callback invoked after a factor is successfully unenrolled.
 * @returns The component's rendered JSX element tree.
 *
 * @see listMFAFactors
 * @see unenrollMFAFactor
 * @see useLoggedAsync
 */
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
      <div className={`flex items-center justify-center ${padding.yRelaxed}`}>
        <Loader2 className={`${iconSize.xl} animate-spin ${muted.default}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${radius.lg} border border-destructive/50 bg-destructive/10 ${padding.default} ${helper.destructive}`}>
        {error}
      </div>
    );
  }

  if (factors.length === 0) {
    return (
      <div className={`${radius.lg} border bg-muted/30 ${padding.default} text-center ${muted.sm}`}>
        No MFA factors enrolled. Enable two-factor authentication to get started.
      </div>
    );
  }

  return (
    <>
      <div className={spaceY.default}>
        {factors.map((factor) => (
          <div
            key={factor.id}
            className={`flex items-center justify-between ${radius.lg} border ${padding.default} transition-colors hover:bg-accent/5`}
          >
            <div className={cluster.comfortable}>
              <div className={`rounded-full border bg-accent/5 ${padding.compact}`}>
                <Shield className={iconSize.lg} />
              </div>
              <div>
                <div className={cluster.compact}>
                  <h3 className={weight.medium}>
                    {factor.friendly_name || `${factor.factor_type.toUpperCase()} Factor`}
                  </h3>
                  {factor.status === 'verified' ? (
                    <UnifiedBadge variant="base" style="default" className={`${gap.tight}`}>
                      <CheckCircle className={iconSize.xs} />
                      Active
                    </UnifiedBadge>
                  ) : (
                    <UnifiedBadge variant="base" style="secondary">
                      Pending
                    </UnifiedBadge>
                  )}
                </div>
                <div className={`${marginTop.tight} ${muted.sm}`}>
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
                <Trash className={iconLeading.sm} />
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={cluster.compact}>
              <AlertTriangle className="text-destructive" />
              Remove MFA Factor?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this MFA factor? You will no longer be able to use it
              for two-factor authentication.
              <br />
              <br />
              {factorToUnenroll && (
                <span className={weight.medium}>
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
                  <Loader2 className={`${iconLeading.sm} animate-spin`} />
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