#!/usr/bin/env tsx
import { runReplayWebhook } from '../commands/replay-webhook.js';
import { logger } from '../toolkit/logger.js';

runReplayWebhook()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Failed to replay webhook event', error, { script: 'webhooks:replay' });
    process.exit(1);
  });
