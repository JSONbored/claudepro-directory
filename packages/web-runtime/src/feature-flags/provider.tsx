'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface StatsigStore {
  feature_gates: Record<string, { value: boolean }>;
  dynamic_configs: Record<string, { value: Record<string, unknown> }>;
  layer_configs: Record<string, unknown>;
}

const FeatureFlagsContext = createContext<StatsigStore | null>(null);

export function FeatureFlagsProvider({ 
  children, 
  initialFlags 
}: { 
  children: React.ReactNode; 
  initialFlags: StatsigStore | null
}) {
  const [flags, setFlags] = useState<StatsigStore | null>(initialFlags);

  useEffect(() => {
    if (flags) return; // Already have flags (e.g. from server)

    // Read from cookie
    // Note: Cookie is set by middleware with httpOnly: false
    const match = document.cookie.match(new RegExp('(^| )x-flags=([^;]+)'));
    if (match && match[2]) {
      try {
        const json = atob(match[2]);
        const parsed = JSON.parse(json);
        setFlags(parsed);
      } catch (e) {
        console.error('Failed to parse x-flags cookie on client', e);
      }
    }
  }, [flags]);

  return (
    // If no flags provided, we could provide empty or null. 
    // Null allows us to detect "not initialized".
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const flags = useContext(FeatureFlagsContext);
  
  // Safe fallback if used outside provider or if provider has null flags (middleware failure)
  // We return a "safe" object that returns defaults.
  if (!flags) {
      return {
          isEnabled: (_key: string) => false,
          getConfig: <T,>(_key: string, fallback: T): T => fallback,
          getExperiment: <T,>(_key: string, fallback: T): T => fallback,
          isLoading: true
      };
  }
  
  return {
    isEnabled: (key: string) => !!flags.feature_gates[key]?.value,
    getConfig: <T,>(key: string, fallback: T): T => {
        return (flags.dynamic_configs[key]?.value as T) ?? fallback;
    },
    getExperiment: <T,>(key: string, fallback: T): T => {
        return (flags.dynamic_configs[key]?.value as T) ?? fallback;
    },
    isLoading: false
  };
}
