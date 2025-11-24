import { cookies } from 'next/headers';

interface StatsigStore {
  feature_gates: Record<string, { value: boolean; rule_id: string }>;
  dynamic_configs: Record<string, { value: Record<string, unknown>; rule_id: string }>;
  layer_configs: Record<string, unknown>;
  time?: number;
}

const EMPTY_STORE: StatsigStore = { 
  feature_gates: {}, 
  dynamic_configs: {}, 
  layer_configs: {} 
};

export async function getFlagsServer() {
  const cookieStore = await cookies();
  const flagCookie = cookieStore.get('x-flags');
  
  let store: StatsigStore = EMPTY_STORE;

  if (flagCookie?.value) {
    try {
        const json = atob(flagCookie.value);
        store = JSON.parse(json);
    } catch (e) {
        console.error('Failed to parse x-flags cookie', e);
    }
  }

  return {
    isEnabled: (key: string) => {
        return store.feature_gates[key]?.value ?? false;
    },
    getConfig: <T>(key: string, fallback: T): T => {
        const config = store.dynamic_configs[key]?.value;
        return (config as T) ?? fallback;
    },
    // Helper to check experiments (often treated as configs or gates in Statsig)
    getExperiment: <T>(key: string, fallback: T): T => {
         // Experiments are usually dynamic configs in Statsig
        const config = store.dynamic_configs[key]?.value;
        return (config as T) ?? fallback;
    },
    getAll: () => store
  };
}
