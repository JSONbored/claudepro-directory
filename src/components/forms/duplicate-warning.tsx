'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/primitives/alert';
import { AlertTriangle } from '@/src/lib/icons';

interface DuplicateWarningProps {
  contentType: string;
  name: string;
}

/**
 * Simple debounce hook
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

export function DuplicateWarning({ contentType: _contentType, name }: DuplicateWarningProps) {
  const [checking, setChecking] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Debounce name input (500ms)
  const debouncedName = useDebounce(name, 500);

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
      <AlertTriangle className="h-4 w-4 text-yellow-400" />
      <AlertTitle className="text-yellow-400">Suggestion</AlertTitle>
      <AlertDescription>
        <p className={'text-muted-foreground text-sm'}>{warning}</p>
      </AlertDescription>
    </Alert>
  );
}
