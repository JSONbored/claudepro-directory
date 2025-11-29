type EnvRecord = Record<string, string | undefined>;

interface GlobalEnv {
  Deno?: {
    env?: {
      get?(key: string): string | undefined;
      toObject?(): Record<string, string>;
    };
  };
  process?: {
    env?: EnvRecord;
  };
}

const globalEnv = globalThis as GlobalEnv;
const envCache = new Map<string, string | undefined>();

function normalizeValue(value: null | string | undefined): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}

function readEnv(name: string): string | undefined {
  if (envCache.has(name)) {
    return envCache.get(name);
  }

  let value: string | undefined;

  const denoEnv = globalEnv.Deno?.env;
  if (!value && denoEnv?.get) {
    try {
      value = normalizeValue(denoEnv.get(name));
    } catch {
      value = undefined;
    }
  }

  const nodeEnv = globalEnv.process?.env;
  if (!value && nodeEnv) {
    value = normalizeValue(nodeEnv[name]);
  }

  envCache.set(name, value);
  return value;
}

export function getEnvVar(name: string): string | undefined {
  return readEnv(name);
}

export function requireEnvVar(name: string, message?: string): string {
  const value = readEnv(name);
  if (value === undefined) {
    throw new Error(message ?? `Missing required environment variable: ${name}`);
  }
  return value;
}

export function getNumberEnvVar(name: string, fallback?: number): number | undefined {
  const value = readEnv(name);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getBooleanEnvVar(name: string, fallback?: boolean): boolean | undefined {
  const value = readEnv(name);
  if (value === undefined) {
    return fallback;
  }
  if (/^(true|1|yes|on)$/i.test(value)) {
    return true;
  }
  if (/^(false|0|no|off)$/i.test(value)) {
    return false;
  }
  return fallback;
}

export function getEnvObject(): EnvRecord {
  const denoEnv = globalEnv.Deno?.env;
  if (denoEnv?.toObject) {
    const denoRecord = denoEnv.toObject();
    const record: EnvRecord = {};
    for (const [key, value] of Object.entries(denoRecord)) {
      record[key] = normalizeValue(value);
    }
    return record;
  }

  const nodeEnv = globalEnv.process?.env;
  if (nodeEnv) {
    return { ...nodeEnv };
  }

  return {};
}

export function clearEnvCache(): void {
  envCache.clear();
}

export function getNodeEnv(): string | undefined {
  return readEnv('NODE_ENV');
}

export const isDevelopment = getNodeEnv() === 'development';
export const isProduction = getNodeEnv() === 'production';
export const isVercel = readEnv('VERCEL') === '1';
