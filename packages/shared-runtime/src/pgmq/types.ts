/**
 * PGMQ Type Definitions
 * 
 * Type-safe interfaces for PostgreSQL Message Queue operations.
 * These types are runtime-agnostic and can be used by both edge-runtime and web-runtime.
 */

/**
 * Message structure returned from pgmq read operations
 */
export interface PgmqMessage<T = Record<string, unknown>> {
  msg_id: bigint;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: T;
}

/**
 * Options for pgmq send operation
 */
export interface PgmqSendOptions {
  /** Delay in seconds before message becomes visible (default: 0) */
  sleepSeconds?: number;
}

/**
 * Options for pgmq read operation
 */
export interface PgmqReadOptions {
  /** Visibility timeout in seconds (default: 30) */
  vt?: number;
  /** Number of messages to read (default: 10) */
  qty?: number;
}

/**
 * Queue metrics returned from pgmq metrics operation
 */
export interface PgmqQueueMetrics {
  queue_length: number;
  newest_msg_age_sec: number | null;
  oldest_msg_age_sec: number | null;
}

/**
 * Result of a send operation
 */
export interface PgmqSendResult {
  msg_id: bigint;
}

/**
 * Common queue names used in the application
 */
export const PGMQ_QUEUES = {
  // Discord notifications
  discord_jobs: 'discord_jobs',
  discord_submissions: 'discord_submissions',
  discord_errors: 'discord_errors',
  
  // Email queues
  email_subscribe: 'email_subscribe',
  email_welcome: 'email_welcome',
  email_transactional: 'email_transactional',
  email_contact: 'email_contact',
  email_job_lifecycle: 'email_job_lifecycle',
  
  // Content processing
  changelog_process: 'changelog_process',
  changelog_notify: 'changelog_notify',
  embedding_generation: 'embedding_generation',
  image_generation: 'image_generation',
  package_generation: 'package_generation',
  
  // Analytics
  pulse: 'pulse',
} as const;

export type PgmqQueueName = typeof PGMQ_QUEUES[keyof typeof PGMQ_QUEUES];
