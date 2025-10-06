'use client';

/**
 * Bookmark Button Component
 * Toggle bookmark on/off for any content
 * 
 * Follows existing patterns from card-copy-action.tsx
 */

import { useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck } from '@/src/lib/icons';
import { Button } from '@/src/components/ui/button';
import { addBookmark, removeBookmark } from '@/src/lib/actions/bookmark-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  contentType: string;
  contentSlug: string;
  initialBookmarked?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function BookmarkButton({
  contentType,
  contentSlug,
  initialBookmarked = false,
  showLabel = false,
  className,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation

    startTransition(async () => {
      try {
        if (isBookmarked) {
          // Remove bookmark
          const result = await removeBookmark({
            content_type: contentType as any,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(false);
            toast.success('Bookmark removed');
          }
        } else {
          // Add bookmark
          const result = await addBookmark({
            content_type: contentType as any,
            content_slug: contentSlug,
          });

          if (result?.data?.success) {
            setIsBookmarked(true);
            toast.success('Bookmarked!');
          }
        }

        // Refresh to update UI
        router.refresh();
      } catch (error) {
        // Check if it's an auth error
        if (error instanceof Error && error.message.includes('signed in')) {
          toast.error('Please sign in to bookmark content', {
            action: {
              label: 'Sign In',
              onClick: () => router.push(`/login?redirect=${window.location.pathname}`),
            },
          });
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to update bookmark');
        }
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${className}`}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-3 w-3 fill-current text-primary" aria-hidden="true" />
      ) : (
        <Bookmark className="h-3 w-3" aria-hidden="true" />
      )}
      {showLabel && (
        <span className="ml-1 text-xs">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  );
}
