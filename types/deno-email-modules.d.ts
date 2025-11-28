/**
 * Type declarations for Deno npm: imports used in edge-runtime email templates
 * These are Deno-specific imports that TypeScript doesn't understand natively.
 * This file provides type declarations so TypeScript can type-check code that
 * imports from edge-runtime even though the email templates themselves use
 * Deno-specific npm: imports.
 */

declare module 'npm:react@18.3.1' {
  export * from 'react';
  export { default } from 'react';
}

declare module 'npm:@react-email/components@0.0.22' {
  export * from '@react-email/components';
}

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
    interface Element extends ReactJSX.Element {}
  }
}
