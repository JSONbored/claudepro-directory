/**
 * Troubleshooting Components - Specialized components for troubleshooting documentation
 * Components for error handling, diagnostics, and issue resolution
 */

// Re-export types from shared schema
export type {
  DiagnosticFlowProps,
  DiagnosticStep,
  ErrorItem,
  ErrorTableProps,
} from '@/lib/schemas';
export { DiagnosticFlow } from './diagnostic-flow';
export { ErrorTable } from './error-table';
