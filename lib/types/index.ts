/**
 * Centralized TypeScript Types
 *
 * This file re-exports all types from the generated types file.
 * The generated file handles all the complex export logic to avoid conflicts.
 *
 * Types are automatically inferred from their corresponding Zod schemas to
 * maintain synchronization between runtime validation and compile-time types.
 */

// Re-export everything from the generated file
export * from './generated';

// Additional utility types that aren't generated
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;
