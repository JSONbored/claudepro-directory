/**
 * Deno global type declarations for Biome linting
 * Using namespace augmentation to avoid conflicts with Deno's built-in types
 */

declare namespace Deno {
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
