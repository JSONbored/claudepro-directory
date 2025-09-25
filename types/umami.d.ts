/**
 * TypeScript definitions for Umami Analytics
 * https://umami.is/docs/tracker-functions
 */

interface UmamiPayload {
  hostname?: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url?: string;
  website?: string;
  name?: string;
  data?: Record<string, any>;
}

interface Umami {
  /**
   * Track a pageview
   */
  track(): void;

  /**
   * Track with custom payload
   */
  track(payload: UmamiPayload): void;

  /**
   * Track with payload function
   */
  track(payloadFunction: (props: UmamiPayload) => UmamiPayload): void;

  /**
   * Track a custom event
   */
  track(eventName: string): void;

  /**
   * Track a custom event with data
   */
  track(eventName: string, data: Record<string, any>): void;

  /**
   * Identify a user session
   */
  identify(userId: string): void;

  /**
   * Identify a user session with data
   */
  identify(userId: string, data: Record<string, any>): void;

  /**
   * Identify session with data only
   */
  identify(data: Record<string, any>): void;
}

declare global {
  interface Window {
    umami?: Umami;
  }

  const umami: Umami | undefined;
}

export {};