'use client';

/**
 * ConfigCardWithAuth - Wrapper component that provides auth modal callback to ConfigCard
 *
 * This wrapper component integrates the auth modal with ConfigCard, allowing
 * bookmark actions to open the auth modal instead of redirecting to login.
 *
 * @module apps/web/src/components/core/shared/config-card-with-auth
 */

import { ConfigCard } from '@heyclaude/web-runtime/ui';
import type { ConfigCardProps } from '@heyclaude/web-runtime/types/component.types';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

/**
 * ConfigCard with integrated auth modal support
 *
 * Automatically provides the auth modal callback to ConfigCard's BookmarkButton,
 * so unauthenticated users see the modal instead of being redirected to login.
 */
export function ConfigCardWithAuth(props: ConfigCardProps) {
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      valueProposition: 'Sign in to save bookmarks',
      redirectTo: pathname ?? undefined,
    });
  }, [openAuthModal, pathname]);

  return <ConfigCard {...props} onAuthRequired={handleAuthRequired} />;
}
