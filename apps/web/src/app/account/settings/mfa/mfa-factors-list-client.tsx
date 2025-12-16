'use client';

import { useBoolean } from '@heyclaude/web-runtime/hooks';
import { Shield } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';
import { iconSize, marginRight, spaceY } from '@heyclaude/web-runtime/design-system';
import { useState } from 'react';

import { EnrollMFADialog } from '@/src/components/features/account/mfa/enroll-mfa-dialog';
import { MFAFactorsList } from '@/src/components/features/account/mfa/mfa-factors-list';

export function MFAFactorsListClient() {
  const {
    setTrue: setEnrollDialogOpenTrue,
    setValue: setEnrollDialogOpen,
    value: enrollDialogOpen,
  } = useBoolean();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEnrolled = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={`${spaceY.comfortable}`}>
      <div className={`flex justify-end`}>
        <Button onClick={setEnrollDialogOpenTrue}>
          <Shield className={`${iconSize.sm} ${marginRight.compact}`} />
          Add Authenticator
        </Button>
      </div>

      <MFAFactorsList key={refreshKey} onFactorUnenrolled={handleEnrolled} />

      <EnrollMFADialog
        onEnrolled={handleEnrolled}
        onOpenChange={setEnrollDialogOpen}
        open={enrollDialogOpen}
      />
    </div>
  );
}
