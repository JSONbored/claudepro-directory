import { type Database } from '@heyclaude/database-types';

/**
 * Layout data interface
 */
export interface LayoutData {
  announcement: Database['public']['Tables']['announcements']['Row'] | null;
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
    primary: null,
    secondary: null,
    actions: null,
  },
};
