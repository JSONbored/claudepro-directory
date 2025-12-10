'use client';

import { type DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';

interface RecentlySavedGridProps {
  items: DisplayableContent[];
}

export function RecentlySavedGrid({ items }: RecentlySavedGridProps) {
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  const handleAuthRequired = useCallback(() => {
    openAuthModal({
      valueProposition: 'Sign in to save bookmarks',
      redirectTo: pathname ?? undefined,
    });
  }, [openAuthModal, pathname]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const slug = (item as { slug?: null | string }).slug ?? undefined;
        const category = (item as { category?: null | string }).category ?? 'agents';
        const contentId = (item as { id?: null | string }).id ?? undefined;
        const createdAt = (item as { created_at?: null | string }).created_at ?? '';
        const key = contentId ?? slug ?? `${category}-${createdAt || 'recent'}`;

        return (
          <ConfigCard
            key={key}
            item={item}
            showCategory
            showActions
            enableSwipeGestures={false}
            useViewTransitions
            onAuthRequired={handleAuthRequired}
          />
        );
      })}
    </div>
  );
}
