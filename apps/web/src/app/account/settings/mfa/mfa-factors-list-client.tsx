'use client';

import { iconLeading, spaceY } from '@heyclaude/web-runtime/design-system';
import { Shield } from '@heyclaude/web-runtime/icons';
import { Button  } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

import { EnrollMFADialog } from '@/src/components/features/account/mfa/enroll-mfa-dialog';
import { MFAFactorsList } from '@/src/components/features/account/mfa/mfa-factors-list';

/**
 * Renders the client-side MFA factors UI with controls to add and refresh authenticators.
 *
 * The component shows an "Add Authenticator" button that opens an enrollment dialog,
 * renders the MFA factors list, and refreshes the list whenever an authenticator is
 * enrolled or unenrolled.
 *
 * @returns A JSX element containing:
 *  - a right-aligned "Add Authenticator" button,
 *  - an MFAFactorsList that re-mounts on changes to trigger refreshes,
 *  - an EnrollMFADialog controlled by the button and callbacks.
 *
 * @see {@link MFAFactorsList}
 * @see {@link EnrollMFADialog}
 * @see {@link Button}
 */
export function MFAFactorsListClient() {
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEnrolled = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={spaceY.comfortable}>
      <div className="flex justify-end">
        <Button onClick={() => setEnrollDialogOpen(true)}>
          <Shield className={iconLeading.sm} />
          Add Authenticator
        </Button>
      </div>

      <MFAFactorsList key={refreshKey} onFactorUnenrolled={handleEnrolled} />

      <EnrollMFADialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        onEnrolled={handleEnrolled}
      />
    </div>
  );
}