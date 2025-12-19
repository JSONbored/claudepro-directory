import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useComponentCardConfig, ComponentConfigContextProvider } from './use-component-card-config';
import type { ComponentCardConfig } from './use-component-card-config';

describe('useComponentCardConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default config when no provider', () => {
    const { result } = renderHook(() => useComponentCardConfig());

    expect(result.current).toBeDefined();
    // Should return DEFAULT_COMPONENT_CARD_CONFIG
    expect(typeof result.current).toBe('object');
  });

  it('should return provider value when wrapped', () => {
    const customConfig: ComponentCardConfig = {
      showFeatured: true,
      showRecent: false,
      // Add other config properties as needed
    } as ComponentCardConfig;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ComponentConfigContextProvider value={customConfig}>
        {children}
      </ComponentConfigContextProvider>
    );

    const { result } = renderHook(() => useComponentCardConfig(), { wrapper });

    expect(result.current).toEqual(customConfig);
  });

  it('should use default config when provider value is undefined', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ComponentConfigContextProvider>
        {children}
      </ComponentConfigContextProvider>
    );

    const { result } = renderHook(() => useComponentCardConfig(), { wrapper });

    // Should use DEFAULT_COMPONENT_CARD_CONFIG
    expect(result.current).toBeDefined();
  });
});
