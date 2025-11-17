/**
 * Deno global type declarations for Biome linting
 * Using namespace augmentation to avoid conflicts with Deno's built-in types
 */

declare namespace Deno {
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

/**
 * Supabase global type for AI functionality
 * Provided by Supabase Edge Runtime
 */
// eslint-disable-next-line no-var
declare var Supabase: {
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
