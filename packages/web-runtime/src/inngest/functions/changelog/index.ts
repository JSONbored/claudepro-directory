/**
 * Changelog Inngest Functions
 */

// processChangelogQueue removed - replaced by /api/changelog/sync endpoint
// export { processChangelogQueue } from './process';
export { processChangelogNotifyQueue } from './notify';
