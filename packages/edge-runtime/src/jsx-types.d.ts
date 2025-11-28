/**
 * JSX Type Definitions for React Email
 * Provides JSX.IntrinsicElements for React Email components
 */

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {
      // React Email specific elements
      // deno-lint-ignore no-explicit-any
      // biome-ignore lint/suspicious/noExplicitAny: React Email uses dynamic element names that require any
      [elemName: string]: any;
    }
  }
}
