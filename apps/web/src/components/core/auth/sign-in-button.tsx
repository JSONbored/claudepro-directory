'use client';

/**
 * SignInButton - Client Component for Account Pages
 *
 * Replaces server-side "Go to login" redirect buttons with client-side auth modal.
 * Provides better UX by keeping users on the current page while signing in.
 *
 * @param valueProposition - Contextual message explaining why sign-in is needed
 * @param redirectTo - Optional path to redirect to after successful auth (defaults to current pathname)
 * @param children - Optional button content (defaults to "Sign In")
 * @param className - Optional additional CSS classes
 * @param variant - Button variant style
 * @param size - Button size
 *
 * @example
 * ```tsx
 * <SignInButton
 *   valueProposition="Sign in to view your dashboard"
 *   redirectTo="/account"
 * />
 * ```
 */

import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { usePathname } from 'next/navigation';
import { Button, type ButtonProps } from '@heyclaude/web-runtime/ui';
import { useCallback } from 'react';

export interface SignInButtonProps extends Omit<ButtonProps, 'onClick' | 'asChild'> {
  /** Contextual message explaining why sign-in is needed */
  valueProposition: string;
  /** Optional path to redirect to after successful auth (defaults to current pathname) */
  redirectTo?: string;
  /** Optional button content (defaults to "Sign In") */
  children?: React.ReactNode;
}

export function SignInButton({
  valueProposition,
  redirectTo,
  children = 'Sign In',
  className,
  variant = 'default',
  size = 'default',
  ...buttonProps
}: SignInButtonProps) {
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  const handleClick = useCallback(() => {
    openAuthModal({
      valueProposition,
      redirectTo: redirectTo ?? pathname ?? undefined,
    });
  }, [openAuthModal, valueProposition, redirectTo, pathname]);

  return (
    <Button onClick={handleClick} className={className} variant={variant} size={size} {...buttonProps}>
      {children}
    </Button>
  );
}
