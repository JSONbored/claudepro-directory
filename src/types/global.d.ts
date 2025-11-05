/**
 * Global type declarations for the application
 */

// Umami analytics types (no schema validation needed for global window object)
export type UmamiEventData = Record<string, string | number | boolean | null>;

export interface UmamiGlobal {
  track: (eventName: string, data?: UmamiEventData) => void;
  identify: (data: UmamiEventData) => void;
}

declare global {
  interface Window {
    umami?: UmamiGlobal;
    gtag?: (command: string, action: string, options?: UmamiEventData) => void;
  }

  const umami: UmamiGlobal | undefined;
}
