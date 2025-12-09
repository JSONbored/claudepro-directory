/**
 * Re-export normalizeError from shared-runtime for consistency
 * This ensures all error normalization uses the same standardized implementation
 * 
 * Importing directly from source TypeScript files since tsx can handle TS imports
 * and the package is configured with emitDeclarationOnly (no JS output)
 */
export { normalizeError } from '../../../shared-runtime/src/error-handling.ts';
