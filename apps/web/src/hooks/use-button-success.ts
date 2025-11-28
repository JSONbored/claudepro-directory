/**
 * Shared button success state management with auto-reset
 */

import { logClientWarning } from '@heyclaude/web-runtime/core';
import { getTimeoutConfig } from '@heyclaude/web-runtime/config/static-configs';
import { useCallback, useMemo, useState } from 'react';

export function useButtonSuccess(duration?: number) {
  // Load config synchronously per hook instance (static config, no async needed)
  const defaultDuration = useMemo(() => {
    try {
      const config = getTimeoutConfig();
      return config['timeout.ui.button_success_duration_ms'] ?? 2000;
    } catch (error) {
      logClientWarning('useButtonSuccess: failed to load duration', error);
      return 2000; // Safe fallback
    }
  }, []);

  const actualDuration = duration ?? defaultDuration;
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerSuccess = useCallback(() => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), actualDuration);
  }, [actualDuration]);

  const reset = useCallback(() => {
    setIsSuccess(false);
  }, []);

  return { isSuccess, triggerSuccess, reset };
}
