/**
 * Deno global type declarations
 * Using interface augmentation to extend Deno's built-in types without conflicts
 */

/// <reference lib="deno.ns" />
/// <reference lib="dom" />

// Deno namespace is provided by deno.ns lib reference above
// This declaration ensures Deno.serve is properly typed
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
}
