import { type announcementsModel } from '@heyclaude/data-layer/prisma';

/**
 * Layout data interface
 */
export interface LayoutData {
  announcement: announcementsModel | null;
  /** Navigation data - kept for backward compatibility, always returns empty structure */
  navigationData: {
    actions: null;
    primary: null;
    secondary: null;
  };
}

/**
 * Default layout data fallback
 * Used when layout data fetching fails
 */
export const DEFAULT_LAYOUT_DATA: LayoutData = {
  announcement: null,
  navigationData: {
    actions: null,
    primary: null,
    secondary: null,
  },
};
