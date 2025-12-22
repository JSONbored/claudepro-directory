/**
 * Prismocker configuration options
 */
export interface PrismockerOptions {
  /**
   * Whether to log queries (useful for debugging)
   * @default false
   */
  logQueries?: boolean;

  /**
   * Custom logger function
   * @default console.log
   */
  logger?: (message: string, data?: any) => void;
}

