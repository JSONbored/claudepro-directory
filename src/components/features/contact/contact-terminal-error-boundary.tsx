/**
 * Contact Terminal Error Boundary
 * Catches React errors in the terminal component and provides graceful fallback
 */

'use client';

import { Component, type ReactNode } from 'react';
import { Terminal } from '@/src/components/primitives/display/terminal';
import { Button } from '@/src/components/primitives/ui/button';
import { AlertTriangle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ContactTerminalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    const normalized = normalizeError(error, 'Contact terminal error boundary triggered');
    logger.error('ContactTerminal error boundary caught error', normalized, {
      componentStack: errorInfo.componentStack || 'unknown',
      segment: 'contact-terminal',
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : '',
      timestamp: new Date().toISOString(),
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Terminal className="relative flex min-h-[500px] flex-col">
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md space-y-4 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Terminal Error</h3>
                <p className="text-muted-foreground text-sm">
                  Something went wrong with the interactive terminal.
                  {this.state.error?.message && (
                    <span className="mt-2 block font-mono text-destructive text-xs">
                      {this.state.error.message}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                  }}
                >
                  Try Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                You can still use the contact options below.
              </p>
            </div>
          </div>
        </Terminal>
      );
    }

    return this.props.children;
  }
}
