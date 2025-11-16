type EnvValue = string | undefined;

const envCache = new Map<string, EnvValue>();

function readEnv(name: string): EnvValue {
  if (envCache.has(name)) {
    return envCache.get(name) ?? undefined;
  }
  const raw = Deno.env.get(name) ?? undefined;
  const value = raw !== '' ? raw : undefined;
  envCache.set(name, value);
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return readEnv(name);
}

export function getEnvOrDefault(name: string, fallback: string): string {
  return readEnv(name) ?? fallback;
}

export function requireEnv(name: string, message?: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(message ?? `Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNumberEnv(name: string, fallback?: number): number | undefined {
  const value = readEnv(name);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  statsig: {
    apiUrl: string;
    serverSecret?: string;
    configName: string;
    refreshIntervalMs: number;
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
  statsig: {
    apiUrl: getEnvOrDefault('STATSIG_CACHE_ENDPOINT', 'https://api.statsig.com/v1/get_config'),
    serverSecret: getOptionalEnv('STATSIG_SERVER_SECRET'),
    configName: getEnvOrDefault('STATSIG_CACHE_CONFIG_NAME', 'cache_configs'),
    refreshIntervalMs: getNumberEnv('STATSIG_CACHE_REFRESH_MS', 5 * 60 * 1000) ?? 5 * 60 * 1000,
  },
  newsletter: {
    countTtlSeconds: getNumberEnv('NEWSLETTER_COUNT_TTL_S', 300) ?? 300,
  },
  betterstack: {
    weeklyTasks: getOptionalEnv('BETTERSTACK_HEARTBEAT_WEEKLY_TASKS'),
    emailSequences: getOptionalEnv('BETTERSTACK_HEARTBEAT_EMAIL_SEQUENCES'),
  },
  resend: {
    apiKey: getOptionalEnv('RESEND_API_KEY'),
    audienceId: getOptionalEnv('RESEND_AUDIENCE_ID'),
    webhookSecret: getOptionalEnv('RESEND_WEBHOOK_SECRET'),
  },
  sendEmailHook: {
    secret: getOptionalEnv('SEND_EMAIL_HOOK_SECRET'),
  },
  github: {
    token: getOptionalEnv('GITHUB_TOKEN'),
    repoOwner: getOptionalEnv('GITHUB_REPO_OWNER'),
    repoName: getOptionalEnv('GITHUB_REPO_NAME'),
  },
  revalidate: {
    secret: getOptionalEnv('REVALIDATE_SECRET'),
  },
  vercel: {
    webhookSecret: getOptionalEnv('VERCEL_WEBHOOK_SECRET'),
  },
  discord: {
    defaultWebhook: getOptionalEnv('DISCORD_WEBHOOK_URL'),
    jobs: getOptionalEnv('DISCORD_WEBHOOK_JOBS'),
    announcements: getOptionalEnv('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL'),
    errors: getOptionalEnv('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK'),
    changelog: getOptionalEnv('DISCORD_CHANGELOG_WEBHOOK_URL'),
  },
  polar: {
    accessToken: getOptionalEnv('POLAR_ACCESS_TOKEN'),
    environment: getEnvOrDefault('POLAR_ENVIRONMENT', 'production'),
    webhookSecret: getOptionalEnv('POLAR_WEBHOOK_SECRET'),
    productPrices: {
      oneTimeStandard: getOptionalEnv('POLAR_PRODUCT_PRICE_ONETIME_STANDARD'),
      oneTimeFeatured: getOptionalEnv('POLAR_PRODUCT_PRICE_ONETIME_FEATURED'),
      subscriptionStandard: getOptionalEnv('POLAR_PRODUCT_PRICE_SUBSCRIPTION_STANDARD'),
      subscriptionFeatured: getOptionalEnv('POLAR_PRODUCT_PRICE_SUBSCRIPTION_FEATURED'),
    },
  },
  indexNow: {
    apiKey: getOptionalEnv('INDEXNOW_API_KEY'),
    triggerKey: getOptionalEnv('INDEXNOW_TRIGGER_KEY'),
  },
};
