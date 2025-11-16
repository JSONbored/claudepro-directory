/**
 * Database Type Extensions
 *
 * Extends the auto-generated Database type to include extension schemas
 * that are not included in the generated types (e.g., pgmq_public).
 *
 * This file is NOT auto-generated and should be manually maintained.
 */

import type { Database } from './database.types.ts';

/**
 * pgmq_public schema types for PostgreSQL Message Queue extension
 * These RPCs are provided by the pgmq extension
 */
interface PgmqPublicSchema {
  Functions: {
    send: {
      Args: {
        queue_name: string;
        msg: Record<string, unknown>;
      };
      Returns: { msg_id: bigint } | null;
    };
    read: {
      Args: {
        queue_name: string;
        sleep_seconds?: number;
        n?: number;
      };
      Returns: Array<{
        msg_id: bigint;
        read_ct: number;
        enqueued_at: string;
        vt: string;
        message: Record<string, unknown>;
      }> | null;
    };
    delete: {
      Args: {
        queue_name: string;
        message_id: bigint; // pgmq.delete uses 'message_id' parameter name
      };
      Returns: boolean | null;
    };
  };
}

/**
 * Extended Database type that includes extension schemas
 * Properly extends Database to preserve all type inference while adding pgmq_public
 */
export interface ExtendedDatabase extends Database {
  pgmq_public: PgmqPublicSchema;
}
