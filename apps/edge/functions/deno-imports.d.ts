/**
 * Deno Import Scheme Declarations
 *
 * TypeScript doesn't natively understand Deno's import schemes (jsr:, npm:, https:, etc.)
 * This file provides ambient module declarations so TypeScript recognizes these imports
 * as valid, allowing IDEs to properly type-check code that uses Deno imports.
 *
 * These declarations don't provide actual types - they just tell TypeScript the modules exist.
 * Actual types come from the packages themselves at runtime via Deno's type resolution.
 *
 * This file intentionally uses `any` types and `export *` for Deno module compatibility.
 * All biome linting rules are disabled for this file via overrides in biome.json.
 */

// JSR (JavaScript Registry) imports
declare module 'jsr:@supabase/supabase-js@*' {
  export * from '@supabase/supabase-js';
}

// npm: imports - declare as any to allow imports without type errors
declare module 'npm:resend@*' {
  const content: any;
  export default content;
  export * from 'resend';
}

declare module 'npm:react@*' {
  import * as React from 'react';
  export default React;
  export = React;
  export * from 'react';

  // Export namespace for type imports like `import type * as React from 'npm:react@*'`
  namespace React {
    export type CSSProperties = import('react').CSSProperties;
    export type ReactElement = import('react').ReactElement;
    export type ComponentType<P = Record<string, never>> = import('react').ComponentType<P>;
    export type FC<P = Record<string, never>> = import('react').FC<P>;
    export type ReactNode = import('react').ReactNode;
  }
}

declare module 'npm:@react-email/components@*' {
  const content: any;
  export default content;
  export * from '@react-email/components';
}

declare module 'npm:sugar-high@*' {
  const content: any;
  export default content;
  export * from 'sugar-high';
}

// HTTPS imports - declare as any to allow imports
// Supports both default and named exports
// Note: TypeScript doesn't support index signatures in module declarations,
// so we only declare the specific exports we use. Other exports will work at runtime
// but won't have types in the IDE.
declare module 'https://*' {
  const content: any;
  export default content;
  export const __esModule: boolean;
  // Common named exports from HTTPS modules
  export const Webhook: any;
  export const ImageResponse: any;
  export const React: any;
}

declare module 'http://*' {
  const content: any;
  export default content;
  export const __esModule: boolean;
}

// Generic npm: pattern for any npm package
declare module 'npm:*' {
  const content: any;
  export default content;
  export const __esModule: boolean;
}

// Generic jsr: pattern for any JSR package
declare module 'jsr:*' {
  const content: any;
  export default content;
  export const __esModule: boolean;
}
