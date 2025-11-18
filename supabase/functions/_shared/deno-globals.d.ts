/**
 * Deno global type declarations
 * Using namespace augmentation to avoid conflicts with Deno's built-in types
 */

declare namespace Deno {
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

/**
 * Supabase global type for AI functionality
 * Provided by Supabase Edge Runtime
 */
// Make this a module by importing something (even if empty)
import type {} from './database.types.ts';

declare global {
  // deno-lint-ignore no-var
  var Supabase: {
    ai: {
      Session: new (
        model: string
      ) => {
        run: (
          text: string,
          options?: { mean_pool?: boolean; normalize?: boolean }
        ) => Promise<number[]>;
      };
    };
  };

  // Console API (available in Deno runtime)
  // eslint-disable-next-line no-var
  var console: {
    log(...args: unknown[]): void;
    error(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    info(...args: unknown[]): void;
    debug(...args: unknown[]): void;
  };

  // Web Crypto API (available in Deno runtime)
  // eslint-disable-next-line no-var
  var crypto: {
    randomUUID(): string;
    subtle: {
      importKey(
        format: string,
        keyData: BufferSource,
        algorithm: { name: string; hash?: string },
        extractable: boolean,
        keyUsages: string[]
      ): Promise<unknown>;
      sign(algorithm: string, key: unknown, data: BufferSource): Promise<ArrayBuffer>;
    };
  };

  // Timer APIs (available in Deno runtime)
  function setTimeout(
    callback: (...args: unknown[]) => void,
    delay?: number,
    ...args: unknown[]
  ): number;
  function clearTimeout(id: number): void;
  function setInterval(
    callback: (...args: unknown[]) => void,
    delay?: number,
    ...args: unknown[]
  ): number;
  function clearInterval(id: number): void;

  // BufferSource type (Web API standard)
  type BufferSource = ArrayBufferView | ArrayBuffer;

  // Web API types (available in Deno runtime)
  type HeadersInit = Headers | Record<string, string> | [string, string][];
}
