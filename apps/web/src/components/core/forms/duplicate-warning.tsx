'use client';

import type { content_category } from '@prisma/client';
import { getTimeoutConfig } from '@heyclaude/web-runtime/config/static-configs';
import { AlertTriangle } from '@heyclaude/web-runtime/icons';
import { Alert, AlertDescription, AlertTitle } from '@heyclaude/web-runtime/ui';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { useDebounceValue } from '@heyclaude/web-runtime/hooks/use-debounce-value';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface DuplicateWarningProps {
  contentType: content_category;
  name: string;
}

/**
 * Display a suggestion when a provided name appears too generic.
 *
 * Evaluates the `name` (debounced by a configurable timeout) and renders:
 * - a transient "Checking for duplicates..." indicator while evaluating,
 * - an Alert suggesting a more specific name when the evaluated name is considered generic,
 * - nothing when no suggestion is needed.
 *
 * @param contentType - The content category of the item being named (currently unused by this component)
 * @param name - The name to evaluate for genericness and duplicate suggestions
 * @returns A React node containing a suggestion Alert when applicable, a checking indicator while evaluating, or `null`
 *
 * @see getTimeoutConfig
 * @see useDebounceValue
 */
export function DuplicateWarning({ contentType: _contentType, name }: DuplicateWarningProps) {
  const { value: checking, setTrue: setCheckingTrue, setFalse: setCheckingFalse } = useBoolean();
  const [warning, setWarning] = useState<null | string>(null);
  const [debounceMs, setDebounceMs] = useState(300);
  const shouldReduceMotion = useReducedMotion();

  // Load debounce value from config
  useEffect(() => {
    const config = getTimeoutConfig();
    setDebounceMs(config['timeout.ui.form_debounce_ms']);
  }, []);

  const [debouncedName] = useDebounceValue(name, debounceMs);

  useEffect(() => {
    if (!debouncedName || debouncedName.length < 3) {
      setWarning(null);
      return;
    }

    setCheckingTrue();

    // Simple client-side duplicate detection
    // Check if name is too generic
    const genericNames = [
      'test',
      'example',
      'demo',
      'sample',
      'default',
      'new',
      'my',
      'untitled',
      'temp',
      'temporary',
    ];

    const lowerName = debouncedName.toLowerCase();
    const isGeneric = genericNames.some(
      (generic) => lowerName === generic || lowerName.startsWith(`${generic} `)
    );

    if (isGeneric) {
      setWarning('This name seems generic. Consider a more specific, descriptive name.');
    } else {
      setWarning(null);
    }

    setCheckingFalse();
  }, [debouncedName]);

  if (checking) {
    return (
      <motion.div
        className="text-muted-foreground text-sm"
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0.5, 1] }}
        transition={
          shouldReduceMotion
            ? {}
            : { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
        }
      >
        Checking for duplicates...
      </motion.div>
    );
  }

  if (!warning) {
    return null;
  }

  return (
    <Alert className="border-warning-border bg-warning-bg">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning">Suggestion</AlertTitle>
      <AlertDescription>
        <p className="text-muted-foreground text-sm">{warning}</p>
      </AlertDescription>
    </Alert>
  );
}
