/**
 * App Settings - Database-First Feature Flags
 * All settings loaded from app_settings table via get_app_settings() RPC.
 * Zero-downtime config changes, instant feature toggles.
 */

import { unstable_cache } from 'next/cache';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

type AppSetting = Tables<'app_settings'>;
type Environment = 'development' | 'preview' | 'production';

interface SettingValue<T = unknown> {
  value: T;
  type: string;
  description: string;
  category: string;
  environment: string | null;
}

type AppSettingsMap = Record<string, SettingValue>;

async function fetchAppSettings(environment?: string, category?: string): Promise<AppSettingsMap> {
  const supabase = createAnonClient();

  // Build RPC params with proper optional handling for exactOptionalPropertyTypes
  const params: { p_environment?: string; p_category?: string } = {};
  if (environment !== undefined) params.p_environment = environment;
  if (category !== undefined) params.p_category = category;

  const { data, error } = await supabase.rpc('get_app_settings', params);

  if (error) throw new Error(`Failed to load app settings: ${error.message}`);
  // RPC returns Json type - cast to our expected structure
  return (data as unknown as AppSettingsMap) || {};
}

const getCachedAppSettings = unstable_cache(fetchAppSettings, ['app-settings'], {
  revalidate: 900, // 15 minutes
  tags: ['app-settings'],
});

export async function getAppSettings(
  environment?: Environment,
  category?: AppSetting['category']
): Promise<AppSettingsMap> {
  return getCachedAppSettings(environment, category);
}

export async function getAppSetting<T = unknown>(
  key: string,
  environment?: Environment
): Promise<T | null> {
  const settings = await getAppSettings(environment);
  const setting = settings[key];
  return setting ? (setting.value as T) : null;
}

// Typed helper functions for common settings
export async function isFeatureEnabled(key: string, environment?: Environment): Promise<boolean> {
  const value = await getAppSetting<boolean>(key, environment);
  return value ?? false;
}

export async function getConfigValue<T = string>(
  key: string,
  defaultValue: T,
  environment?: Environment
): Promise<T> {
  const value = await getAppSetting<T>(key, environment);
  return value ?? defaultValue;
}

// Server-only environment detection
export function getServerEnvironment(): Environment | undefined {
  if (typeof window !== 'undefined') return undefined; // Client-side

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  return 'development';
}
