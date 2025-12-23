'use client';

import { useEffect, useState } from 'react';

/**
 * Options for useScreen hook
 */
export interface UseScreenOptions {
  /**
   * Whether to initialize with screen values immediately
   * Set to `false` for SSR to prevent hydration mismatches
   * @default true
   */
  initializeWithValue?: boolean;
  /**
   * Delay in milliseconds for debounced updates to improve performance
   */
  debounceDelay?: number;
}

/**
 * Screen information object
 */
export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  orientation: ScreenOrientation | null;
}

/**
 * React hook for tracking screen hardware properties.
 *
 * Monitors display dimensions, orientation, and capabilities with real-time updates.
 * Tracks physical screen hardware, not browser viewport (use `useWindowSize` for viewport).
 *
 * **When to use:**
 * - ✅ Device capability detection - Check screen resolution and color depth for optimal graphics
 * - ✅ Multi-monitor applications - Detect multiple displays and available screen real estate
 * - ✅ Orientation-aware interfaces - Respond to device rotation with layout changes
 * - ✅ High-DPI optimization - Adapt content quality based on pixel density
 * - ✅ Analytics and monitoring - Track user display capabilities for optimization insights
 * - ✅ Kiosk or fullscreen apps - Utilize full screen dimensions for immersive experiences
 * - ❌ For basic responsive design - CSS media queries and viewport units are usually better
 *
 * **Key Differences:**
 * - `useScreen` - Physical screen hardware (1920x1080 monitor)
 * - `useWindowSize` - Browser viewport (actual visible area)
 *
 * **Features:**
 * - Screen properties tracking - Comprehensive display information
 * - Orientation support - Automatic updates for device rotation
 * - Debounced updates - Performance optimization for high-frequency resize events
 * - SSR compatible - Proper server-side rendering support
 * - Type-safe implementation - Complete TypeScript definitions
 *
 * **Note:** The hook reports the primary display's properties. True multi-monitor
 * detection requires additional browser APIs beyond the standard screen object.
 *
 * @param options - Configuration options
 * @returns Screen information object with dimensions, color depth, and orientation
 *
 * @example
 * ```tsx
 * // Device capability detection
 * const screen = useScreen();
 *
 * {screen.colorDepth >= 24 && <HighQualityGraphics />}
 * ```
 *
 * @example
 * ```tsx
 * // Orientation detection
 * const screen = useScreen();
 *
 * {screen.orientation?.type.includes('landscape') && <LandscapeLayout />}
 * ```
 *
 * @example
 * ```tsx
 * // SSR-safe
 * const screen = useScreen({ initializeWithValue: false });
 *
 * if (!screen) return <Loading />;
 * ```
 */
export function useScreen(options: UseScreenOptions = {}): ScreenInfo | undefined {
  const { initializeWithValue = true, debounceDelay } = options;

  const [screenInfo, setScreenInfo] = useState<ScreenInfo | undefined>(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!initializeWithValue) {
      return undefined;
    }

    try {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        orientation: window.screen.orientation || null,
      };
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateScreenInfo = () => {
      try {
        if (!window.screen) {
          return;
        }
        setScreenInfo({
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth,
          orientation: window.screen.orientation || null,
        });
      } catch {
        // Screen API not available
      }
    };

    let timeoutId: NodeJS.Timeout | undefined;

    const handleResize = () => {
      if (debounceDelay) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(updateScreenInfo, debounceDelay);
      } else {
        updateScreenInfo();
      }
    };

    const handleOrientationChange = () => {
      updateScreenInfo();
    };

    // Set initial value
    if (initializeWithValue && !screenInfo) {
      updateScreenInfo();
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Listen for orientation changes (if supported)
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [initializeWithValue, debounceDelay, screenInfo]);

  return screenInfo;
}
