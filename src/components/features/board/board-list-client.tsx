/**
 * Board List Client - Real-time post list with Supabase Realtime subscriptions
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Avatar, AvatarFallback } from '@/src/components/primitives/avatar';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { MessageSquare, Plus, User as UserIcon } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { formatRelativeDate } from '@/src/lib/utils/data.utils';
import type { Tables } from '@/src/types/database.types';

type Post = Tables<'posts'>;

interface BoardListClientProps {
  initialPosts: Post[];
}

export function BoardListClient({ initialPosts }: BoardListClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          const updated = payload.new as Post;
          setPosts((prev) => {
            const oldPost = prev.find((p) => p.id === updated.id);

            if (!oldPost) return prev;

            if (oldPost.vote_count !== updated.vote_count) {
              const filtered = prev.filter((p) => p.id !== updated.id);
              const insertIndex = filtered.findIndex(
                (p) =>
                  (p.vote_count || 0) < (updated.vote_count || 0) ||
                  ((p.vote_count || 0) === (updated.vote_count || 0) &&
                    new Date(p.created_at) < new Date(updated.created_at))
              );

              if (insertIndex === -1) {
                return [...filtered, updated];
              }
              return [...filtered.slice(0, insertIndex), updated, ...filtered.slice(insertIndex)];
            }

            return prev.map((p) => (p.id === updated.id ? updated : p));
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== (payload.old as Post).id));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardContent className={'flex flex-col items-center py-12'}>
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className={'text-muted-foreground text-center max-w-md mb-4'}>
            Be the first to share something with the community!
          </p>
          <Button asChild>
            <Link href={ROUTES.BOARD_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className={UI_CLASSES.CARD_GRADIENT_HOVER}>
          <CardHeader>
            <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  <span>{post.title}</span>
                </CardTitle>

                {post.content && (
                  <CardDescription className="mt-2 whitespace-pre-wrap">
                    {post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content}
                  </CardDescription>
                )}

                <div className={'flex items-center gap-3 text-xs text-muted-foreground mt-3'}>
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                    <Avatar className="w-4 h-4">
                      <AvatarFallback>
                        <UserIcon className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>User</span>
                  </div>
                  <span>•</span>
                  <span>{formatRelativeDate(post.created_at)}</span>
                  {post.vote_count && post.vote_count > 0 && (
                    <>
                      <span>•</span>
                      <UnifiedBadge variant="base" style="secondary" className="text-xs">
                        {post.vote_count} {post.vote_count === 1 ? 'vote' : 'votes'}
                      </UnifiedBadge>
                    </>
                  )}
                  {post.comment_count && post.comment_count > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
