import {
  getNumberEnvVar,
  getEnvVar as getOptionalEnvVar,
  getEnvVar as getEnvVarOrDefault,
  requireEnvVar,
} from '@heyclaude/shared-runtime';

export function getOptionalEnv(name: string): string | undefined {
  return getOptionalEnvVar(name);
}

export function getEnvOrDefault(name: string, fallback: string): string {
  return getEnvVarOrDefault(name) ?? fallback;
}

export function requireEnv(name: string, message?: string): string {
  return requireEnvVar(name, message);
}

export function getNumberEnv(name: string, fallback?: number): number | undefined {
  return getNumberEnvVar(name, fallback);
}

/**
 * Helper to conditionally include a property only if value is defined
 * This ensures exactOptionalPropertyTypes compatibility
 */
function optionalProp<T>(
  key: string,
  value: T | undefined
): Record<string, T> | Record<string, never> {
  return value !== undefined ? { [key]: value } : {};
}

export interface EdgeEnv {
  nodeEnv: string;
  site: {
    siteUrl: string;
    appUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  newsletter: {
    countTtlSeconds: number;
  };
  betterstack: {
    weeklyTasks?: string;
    emailSequences?: string;
  };
  resend: {
    apiKey?: string;
    audienceId?: string;
    webhookSecret?: string;
  };
  sendEmailHook: {
    secret?: string;
  };
  github: {
    token?: string;
    repoOwner?: string;
    repoName?: string;
  };
  revalidate: {
    secret?: string;
  };
  vercel: {
    webhookSecret?: string;
  };
  discord: {
    defaultWebhook?: string;
    jobs?: string;
    announcements?: string;
    errors?: string;
    changelog?: string;
  };
  polar: {
    accessToken?: string;
    environment: string;
    webhookSecret?: string;
    productPrices: {
      oneTimeStandard?: string;
      oneTimeFeatured?: string;
      subscriptionStandard?: string;
      subscriptionFeatured?: string;
    };
  };
  indexNow: {
    apiKey?: string;
    triggerKey?: string;
  };
}

export const edgeEnv: EdgeEnv = {
  nodeEnv: getEnvOrDefault('NODE_ENV', 'production'),
  site: {
    siteUrl: getEnvOrDefault('NEXT_PUBLIC_SITE_URL', 'https://claudepro.directory'),
    appUrl: getEnvOrDefault('APP_URL', 'https://claudepro.directory'),
  },
  supabase: {
      url: requireEnv('SUPABASE_URL', 'SUPABASE_URL is required for edge functions'),
      anonKey: requireEnv('SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY is required for edge functions'),
      serviceRoleKey: requireEnv(
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY is required for edge functions'
    ),
  },
  newsletter: {
      countTtlSeconds: getNumberEnv('NEWSLETTER_COUNT_TTL_S', 300) ?? 300,
  },
  betterstack: {
    ...optionalProp('weeklyTasks', getOptionalEnv('BETTERSTACK_HEARTBEAT_WEEKLY_TASKS')),
    ...optionalProp('emailSequences', getOptionalEnv('BETTERSTACK_HEARTBEAT_EMAIL_SEQUENCES')),
  },
  resend: {
    ...optionalProp('apiKey', getOptionalEnv('RESEND_API_KEY')),
    ...optionalProp('audienceId', getOptionalEnv('RESEND_AUDIENCE_ID')),
    ...optionalProp('webhookSecret', getOptionalEnv('RESEND_WEBHOOK_SECRET')),
  },
  sendEmailHook: {
    ...optionalProp('secret', getOptionalEnv('SEND_EMAIL_HOOK_SECRET')),
  },
  github: {
    ...optionalProp('token', getOptionalEnv('GITHUB_TOKEN')),
    ...optionalProp('repoOwner', getOptionalEnv('GITHUB_REPO_OWNER')),
    ...optionalProp('repoName', getOptionalEnv('GITHUB_REPO_NAME')),
  },
  revalidate: {
    ...optionalProp('secret', getOptionalEnv('REVALIDATE_SECRET')),
  },
  vercel: {
    ...optionalProp('webhookSecret', getOptionalEnv('VERCEL_WEBHOOK_SECRET')),
  },
  discord: {
    ...optionalProp('defaultWebhook', getOptionalEnv('DISCORD_WEBHOOK_URL')),
    ...optionalProp('jobs', getOptionalEnv('DISCORD_WEBHOOK_JOBS')),
    ...optionalProp('announcements', getOptionalEnv('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL')),
    ...optionalProp('errors', getOptionalEnv('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK')),
    ...optionalProp('changelog', getOptionalEnv('DISCORD_CHANGELOG_WEBHOOK_URL')),
  },
  polar: {
    ...optionalProp('accessToken', getOptionalEnv('POLAR_ACCESS_TOKEN')),
    environment: getEnvOrDefault('POLAR_ENVIRONMENT', 'production'),
    ...optionalProp('webhookSecret', getOptionalEnv('POLAR_WEBHOOK_SECRET')),
    productPrices: {
      ...optionalProp('oneTimeStandard', getOptionalEnv('POLAR_PRODUCT_PRICE_ONETIME_STANDARD')),
      ...optionalProp('oneTimeFeatured', getOptionalEnv('POLAR_PRODUCT_PRICE_ONETIME_FEATURED')),
      ...optionalProp(
        'subscriptionStandard',
        getOptionalEnv('POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD')
      ),
      ...optionalProp(
        'subscriptionFeatured',
        getOptionalEnv('POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED')
      ),
    },
  },
  indexNow: {
      ...optionalProp('apiKey', getOptionalEnv('INDEXNOW_API_KEY')),
      ...optionalProp('triggerKey', getOptionalEnv('INDEXNOW_TRIGGER_KEY')),
  },
};
