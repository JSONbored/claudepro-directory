
/**
 * Jobs Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions + Polar.sh API
 */

// Re-export generated actions for backward compatibility
export * from './create-job.generated.ts';
export * from './update-job.generated.ts';
export * from './delete-job.generated.ts';
export * from './toggle-job-status.generated.ts';

// Removed createJob, updateJob, deleteJob, toggleJobStatus - migrated to generated actions
