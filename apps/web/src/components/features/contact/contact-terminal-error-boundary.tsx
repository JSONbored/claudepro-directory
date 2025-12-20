/**
 * Contact Terminal Error Boundary
 * Catches React errors in the terminal component and provides graceful fallback
 */

'use client';

import { AlertCircle, RefreshCw } from '@heyclaude/web-runtime/icons';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { Button } from '@heyclaude/web-runtime/ui';
import { Terminal } from '@/src/components/ui/terminal';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  hasError: boolean;
  isResetting: boolean;
}

export class ContactTerminalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isResetting: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isResetting: false };
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
        <Terminal className={`relative flex min-h-[500px] flex-col`}>
          <motion.div
            className={`flex flex-1 items-center justify-center p-8`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING.smooth}
          >
            <motion.div
              className="max-w-md space-y-6 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING.smooth}
            >
              <motion.div
                className="bg-destructive/10 mx-auto w-fit rounded-full p-3"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ ...SPRING.bouncy, delay: 0.1 }}
              >
                <AlertCircle className="text-destructive h-12 w-12" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Terminal Error</h3>
                <p className="text-muted-foreground text-sm">
                  Something went wrong with the interactive terminal.
                  {this.state.error?.message ? (
                    <span className="text-destructive mt-2 block max-w-full font-mono text-xs break-all">
                      {this.state.error.message}
                    </span>
                  ) : null}
                </p>
              </div>
              <motion.div
                className={`flex justify-center gap-2`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...SPRING.smooth, delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  disabled={this.state.isResetting}
                  onClick={() => {
                    this.setState({ isResetting: true, hasError: false, error: null });
                  }}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${this.state.isResetting ? 'animate-spin' : ''}`}
                  />
                  {this.state.isResetting ? 'Retrying...' : 'Try Again'}
                </Button>
                <Button variant="outline" size="lg" onClick={() => globalThis.location.reload()}>
                  Refresh Page
                </Button>
              </motion.div>
              <motion.p
                className="text-muted-foreground text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...SPRING.smooth, delay: 0.3 }}
              >
                You can still use the contact options below.
              </motion.p>
            </motion.div>
          </motion.div>
        </Terminal>
      );
    }

    return this.props.children;
  }
}
