'use client';

import { iconLeading, spaceY, justify, display,
} from '@heyclaude/web-runtime/design-system';
import { Shield } from '@heyclaude/web-runtime/icons';
import { Button  } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

import { EnrollMFADialog } from '@/src/components/features/account/mfa/enroll-mfa-dialog';
import { MFAFactorsList } from '@/src/components/features/account/mfa/mfa-factors-list';

/**
 * Client-side UI that displays MFA factors and provides controls to add and refresh authenticators.
 *
 * Shows an "Add Authenticator" button that opens an enrollment dialog and re-renders the factors list
 * when an authenticator is enrolled or unenrolled.
 *
 * @returns A JSX element containing the MFA factors list, an "Add Authenticator" button, and the enrollment dialog
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
      <div className={`${display.flex} ${justify.end}`}>
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