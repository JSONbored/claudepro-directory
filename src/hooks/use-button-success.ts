/**
 * Shared button success state management with auto-reset
 */
import { useCallback, useState } from 'react';
import { timeoutConfigs } from '@/src/lib/flags';

// Default value (will be overridden by Dynamic Config)
let DEFAULT_SUCCESS_DURATION = 2000;

// Load config from Statsig on module initialization
timeoutConfigs()
  .then((config: Record<string, unknown>) => {
    DEFAULT_SUCCESS_DURATION = (config['timeout.button_success_ms'] as number) ?? 2000;
  })
  .catch(() => {
    // Use default if config load fails
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
