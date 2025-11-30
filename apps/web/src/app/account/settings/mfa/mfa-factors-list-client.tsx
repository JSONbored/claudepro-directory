'use client';

import { iconLeading } from '@heyclaude/web-runtime/design-system';
import { Shield } from '@heyclaude/web-runtime/icons';
import { Button  } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

import { EnrollMFADialog } from '@/src/components/features/account/mfa/enroll-mfa-dialog';
import { MFAFactorsList } from '@/src/components/features/account/mfa/mfa-factors-list';

/**
 * Render the client-side MFA factors UI with controls to add authenticators and refresh the list.
 *
 * Shows an "Add Authenticator" button that opens an enrollment dialog, renders the MFA factors list,
 * and refreshes the list when an authenticator is enrolled or unenrolled.
 *
 * @returns A JSX element containing the "Add Authenticator" button, the MFAFactorsList, and the EnrollMFADialog.
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
    <div className="space-y-4">
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