/**
 * Database Type Extensions for PGMQ
 *
 * Minimal type definition for pgmq_public schema operations.
 * Since we're migrating to Prisma, this is only needed for PGMQ RPC typing.
 *
 * This file is NOT auto-generated and should be manually maintained.
 */

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
 * Extended type for PGMQ operations only (minimal, no Database dependency)
 * Minimal type that only includes pgmq_public schema (no Database extension)
 */
export interface ExtendedDatabase {
  pgmq_public: PgmqPublicSchema;
}
