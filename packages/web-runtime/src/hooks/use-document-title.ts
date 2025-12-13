'use client';

import { useEffect } from 'react';

/**
 * React hook for dynamic browser tab title updates.
 *
 * Updates the document title and automatically syncs with component state changes.
 * Handles SSR gracefully to prevent hydration mismatches.
 *
 * **When to use:**
 * - ✅ Dashboard notifications - Show unread counts and status updates in browser tabs
 * - ✅ Chat applications - Display new message indicators and active conversation names
 * - ✅ Progress tracking - Task completion percentages and project status updates
 * - ✅ E-commerce carts - Shopping cart item counts and checkout progress
 * - ✅ Status dashboards - User presence indicators and system health monitoring
 * - ✅ Tab navigation - Active page tracking and route-based title updates
 * - ❌ For static titles - Regular HTML `<title>` tags are simpler
 *
 * **Features:**
 * - Document title management - Automatic DOM updates and React state synchronization
 * - SSR safety - Handles server-side rendering without document access errors
 * - Real-time updates - Syncs with your component state changes instantly
 * - Automatic cleanup - Proper useEffect dependency handling
 * - Zero dependencies - Lightweight implementation with just React hooks
 *
 * **Note:** Title updates on every render change. Make sure you're not creating new
 * title strings on every render unless that's what you want. Use `useMemo` for
 * complex title calculations.
 *
 * @param title - The title text to set for the document
 *
 * @example
 * ```tsx
 * // Dynamic title with state
 * const [unreadCount, setUnreadCount] = useState(0);
 * useDocumentTitle(unreadCount > 0 ? `(${unreadCount}) My App` : 'My App');
 * ```
 *
 * @example
 * ```tsx
 * // Route-based titles
 * const pathname = usePathname();
 * useDocumentTitle(`${pathname} | My App`);
 * ```
 *
 * @example
 * ```tsx
 * // Complex title with useMemo
 * const title = useMemo(() => {
 *   return `${user.name} | ${unreadCount} messages | MyApp`;
 * }, [user.name, unreadCount]);
 * useDocumentTitle(title);
 * ```
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
}
