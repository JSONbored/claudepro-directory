/**
 * Service Registry
 *
 * Central registration point for all application services.
 * Services are registered with the ServiceFactory for dependency injection and lifecycle management.
 *
 * Production Standards:
 * - Type-safe service registration
 * - Configuration injection from environment
 * - Dependency graph management
 * - Health check configuration
 *
 * @module services/registry
 */

import { logger } from '@/src/lib/logger';
import { registerSingleton, serviceFactory } from './factory';

// Lazy imports to avoid circular dependencies
const getWebhookService = async () => (await import('./webhook.service')).webhookService;
const getResendService = async () => (await import('./resend.service')).resendService;
const getEmailSequenceService = async () =>
  (await import('./email-sequence.service')).emailSequenceService;
const getDigestService = async () => (await import('./digest.service')).digestService;
const getViewCountService = async () => (await import('./view-count.service')).viewCountService;
const getFeaturedLoaderService = async () =>
  (await import('./featured-loader.service')).featuredLoaderService;
const getFeaturedCalculatorService = async () =>
  (await import('./featured-calculator.service')).featuredCalculatorService;

// =====================================================
// SERVICE REGISTRATIONS
// =====================================================

/**
 * Register all application services
 * Call this once at application startup
 */
export async function registerServices(): Promise<void> {
  // Email Services
  registerSingleton(
    'resendService',
    async () => {
      return await getResendService();
    },
    {
      config: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
        fromName: process.env.RESEND_FROM_NAME || 'Claude Pro Directory',
      },
      healthCheck: async (service: Awaited<ReturnType<typeof getResendService>>) => {
        try {
          // Basic health check - service should be instantiated
          return !!service;
        } catch {
          return false;
        }
      },
    }
  );

  registerSingleton(
    'emailSequenceService',
    async () => {
      return await getEmailSequenceService();
    },
    {
      dependencies: ['resendService'],
      config: {
        sequenceIntervalDays: Number.parseInt(process.env.EMAIL_SEQUENCE_INTERVAL_DAYS || '7', 10),
        maxSequenceEmails: Number.parseInt(process.env.EMAIL_SEQUENCE_MAX_EMAILS || '5', 10),
      },
    }
  );

  registerSingleton('webhookService', async () => {
    return await getWebhookService();
  });

  registerSingleton(
    'digestService',
    async () => {
      const service = await getDigestService();
      return service;
    },
    {
      config: {
        digestFrequency: process.env.DIGEST_FREQUENCY || 'weekly',
        digestDayOfWeek: Number.parseInt(process.env.DIGEST_DAY_OF_WEEK || '1', 10), // Monday
      },
    }
  );

  // Analytics Services
  registerSingleton(
    'viewCountService',
    async () => {
      const service = await getViewCountService();
      return service;
    },
    {
      config: {
        batchSize: Number.parseInt(process.env.VIEW_COUNT_BATCH_SIZE || '100', 10),
        flushIntervalSeconds: Number.parseInt(process.env.VIEW_COUNT_FLUSH_INTERVAL || '60', 10),
      },
    }
  );

  // Featured Content Services
  registerSingleton('featuredLoaderService', async () => {
    const service = await getFeaturedLoaderService();
    return service;
  });

  registerSingleton(
    'featuredCalculatorService',
    async () => {
      return await getFeaturedCalculatorService();
    },
    {
      dependencies: ['featuredLoaderService'],
      config: {
        calculationIntervalHours: Number.parseInt(
          process.env.FEATURED_CALCULATION_INTERVAL || '24',
          10
        ),
        minViewsThreshold: Number.parseInt(process.env.FEATURED_MIN_VIEWS || '100', 10),
        minVotesThreshold: Number.parseInt(process.env.FEATURED_MIN_VOTES || '10', 10),
      },
    }
  );
}

/**
 * Initialize all services
 * Run health checks and log status
 */
export async function initializeServices(): Promise<void> {
  await registerServices();

  // Run health checks
  const healthResults = await serviceFactory.healthCheck();

  if (healthResults.size > 0) {
    const healthyServices = Array.from(healthResults.entries()).filter(([, healthy]) => healthy);
    const unhealthyServices = Array.from(healthResults.entries()).filter(([, healthy]) => !healthy);

    logger.info('Services initialized', { healthy: healthyServices.length });

    if (unhealthyServices.length > 0) {
      logger.warn('Unhealthy services detected', {
        unhealthyServices: unhealthyServices.map(([name]) => name).join(', '),
      });
    }
  }
}

// =====================================================
// TYPE-SAFE SERVICE ACCESS
// =====================================================

/**
 * Type-safe service access helpers
 * Use these instead of serviceFactory.resolve() for better type inference
 */
export const Services = {
  resend: () => getResendService(),
  webhook: () => getWebhookService(),
  emailSequence: () => getEmailSequenceService(),
  digest: () => getDigestService(),
  viewCount: () => getViewCountService(),
  featuredLoader: () => getFeaturedLoaderService(),
  featuredCalculator: () => getFeaturedCalculatorService(),
} as const;
