/**
 * Contact Terminal Error Boundary
 * Catches React errors in the terminal component and provides graceful fallback
 */

'use client';

import { AlertTriangle } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { Terminal, Button } from '@heyclaude/web-runtime/ui';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
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
    const route = globalThis.window === undefined ? '/contact' : globalThis.location.pathname;
    logClientErrorBoundary(
      'Contact terminal error boundary triggered',
      error,
      route,
      errorInfo.componentStack || 'unknown',
      {
        segment: 'contact-terminal',
        userAgent: globalThis.window === undefined ? '' : globalThis.navigator?.userAgent || '',
        url: globalThis.window === undefined ? '' : globalThis.location?.href || '',
      }
    );
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Terminal className="relative flex min-h-[500px] flex-col">
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md space-y-4 text-center">
              <AlertTriangle className="text-destructive mx-auto h-12 w-12" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Terminal Error</h3>
                <p className="text-muted-foreground text-sm">
                  Something went wrong with the interactive terminal.
                  {this.state.error?.message ? (
                    <span className="text-destructive mt-2 block max-w-full break-all font-mono text-xs">
                      {this.state.error.message}
                    </span>
                  ) : null}
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
                <Button variant="outline" size="sm" onClick={() => globalThis.location.reload()}>
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
