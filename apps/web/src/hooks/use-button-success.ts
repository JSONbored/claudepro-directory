/**
 * Shared button success state management with auto-reset
 */

import { getTimeoutConfig, logClientWarning } from '@heyclaude/web-runtime';
import { useCallback, useState } from 'react';

// Default value (will be overridden by Dynamic Config)
let DEFAULT_SUCCESS_DURATION = 2000;

// Load config from Statsig on module initialization
getTimeoutConfig({})
  .then((result) => {
    if (result?.data) {
      DEFAULT_SUCCESS_DURATION = result.data['timeout.ui.button_success_duration_ms'];
    }
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
