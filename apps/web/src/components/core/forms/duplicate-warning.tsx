'use client';

import type { Database } from '@heyclaude/database-types';
import { iconSize } from '@heyclaude/web-runtime/design-system';
import { getTimeoutConfig } from '@heyclaude/web-runtime/data';
import { AlertTriangle } from '@heyclaude/web-runtime/icons';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@heyclaude/web-runtime/ui';

interface DuplicateWarningProps {
  contentType: Database['public']['Enums']['content_category'];
  name: string;
}

/**
 * Debounces a value and returns the most recent value only after it has remained unchanged for the specified delay.
 *
 * This hook updates the returned value when `value` has not changed for `delay` milliseconds.
 *
 * @param value - The input value to debounce
 * @param delay - Time in milliseconds to wait after the last change before updating the returned value
 * @returns The debounced `value` that updates only after `delay` ms of no changes
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Shows a contextual suggestion when a provided name appears generic.
 *
 * Checks the debounced `name` against a short list of common generic names and, when matched,
 * renders a warning Alert recommending a more specific, descriptive name. While the check is
 * running it renders a subtle "Checking for duplicates..." animated message; if no warning is
 * necessary the component renders `null`.
 *
 * @param props.contentType - Ignored in this component; present for callers that pass a content category.
 * @param props.name - The name to evaluate for genericness; names shorter than 3 characters are ignored.
 * @returns A JSX element with a suggestion Alert when a generic name is detected, or `null` when no warning is needed.
 *
 * @see getTimeoutConfig — loads the debounce delay used for name evaluation
 * @see useDebounce — debounces `name` before performing the check
 * @see Alert, AlertTitle, AlertDescription, AlertTriangle — UI primitives used to render the suggestion
 */
export function DuplicateWarning({ contentType: _contentType, name }: DuplicateWarningProps) {
  const [checking, setChecking] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [debounceMs, setDebounceMs] = useState(300);

  // Load debounce value from config
  useEffect(() => {
    const config = getTimeoutConfig();
    setDebounceMs(config['timeout.ui.form_debounce_ms']);
  }, []);

  const debouncedName = useDebounce(name, debounceMs);

  useEffect(() => {
    if (!debouncedName || debouncedName.length < 3) {
      setWarning(null);
      return;
    }

    setChecking(true);

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

    setChecking(false);
  }, [debouncedName]);

  if (checking) {
    return (
      <motion.div
        className={'text-muted-foreground text-sm'}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        Checking for duplicates...
      </motion.div>
    );
  }

  if (!warning) {
    return null;
  }

  return (
    <Alert className="border-yellow-500/20 bg-yellow-500/5">
      <AlertTriangle className={`${iconSize.sm} text-yellow-400`} />
      <AlertTitle className="text-yellow-400">Suggestion</AlertTitle>
      <AlertDescription>
        <p className={'text-muted-foreground text-sm'}>{warning}</p>
      </AlertDescription>
    </Alert>
  );
}