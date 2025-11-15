/**
 * Shared button success state management with auto-reset
 */
import { useCallback, useState } from 'react';
import { getTimeoutConfig } from '@/src/lib/actions/feature-flags.actions';
import { logClientWarning } from '@/src/lib/utils/error.utils';

// Default value (will be overridden by Dynamic Config)
let DEFAULT_SUCCESS_DURATION = 2000;

// Load config from Statsig on module initialization
getTimeoutConfig()
  .then((config: Record<string, unknown>) => {
    DEFAULT_SUCCESS_DURATION = (config['timeout.ui.button_success_duration_ms'] as number) ?? 2000;
  })
  .catch((error) => {
    logClientWarning('useButtonSuccess: failed to load success duration', error);
  });

export function useButtonSuccess(duration = DEFAULT_SUCCESS_DURATION) {
  const [isSuccess, setIsSuccess] = useState(false);

  const triggerSuccess = useCallback(() => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), duration);
  }, [duration]);

  const reset = useCallback(() => {
    setIsSuccess(false);
  }, []);

  return { isSuccess, triggerSuccess, reset };
}
