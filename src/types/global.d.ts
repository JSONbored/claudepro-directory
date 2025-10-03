/**
 * Global type declarations for the application
 * All types are sourced from Zod schemas for runtime validation
 */

import type { UmamiEventData, UmamiGlobal } from '@/src/lib/schemas/analytics.schema';

declare global {
  interface Window {
    umami?: UmamiGlobal;
    gtag?: (command: string, action: string, options?: UmamiEventData) => void;
  }

  const umami: UmamiGlobal | undefined;
}
