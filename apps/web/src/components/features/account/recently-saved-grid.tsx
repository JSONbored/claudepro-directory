'use client';

import type { DisplayableContent } from '@heyclaude/web-runtime/types/component.types';
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';

interface RecentlySavedGridProps {
  items: DisplayableContent[];
}

export function RecentlySavedGrid({ items }: RecentlySavedGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const slug = (item as { slug?: string | null }).slug ?? undefined;
        const category = (item as { category?: string | null }).category ?? 'agents';
        const contentId = (item as { id?: string | null }).id ?? undefined;
        const createdAt = (item as { created_at?: string | null }).created_at ?? '';
        const key = contentId ?? slug ?? `${category}-${createdAt || 'recent'}`;

        return (
          <ConfigCard
            key={key}
            item={item}
            showCategory={true}
            showActions={true}
            enableSwipeGestures={false}
            useViewTransitions={true}
          />
        );
      })}
    </div>
  );
}
