/**
 * Shared button success state management with auto-reset
 */
import { useCallback, useState } from 'react';

export function useButtonSuccess(duration = 2000) {
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
