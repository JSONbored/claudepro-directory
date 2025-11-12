/**
 * Shared Button Types
 * Common types and interfaces used across all button variants
 */

export interface ButtonStyleProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  disabled?: boolean;
}

export interface AsyncActionHelpers {
  setLoading: (loading: boolean) => void;
  setSuccess: (success: boolean) => void;
  showError: (message: string, description?: string) => void;
  showSuccess: (message: string, description?: string) => void;
  logError: (message: string, error: Error, context?: Record<string, unknown>) => void;
}
