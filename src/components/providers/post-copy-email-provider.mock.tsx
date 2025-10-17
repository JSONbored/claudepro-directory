/**
 * PostCopyEmailProvider - Storybook Mock
 *
 * Browser-compatible mock that doesn't import any server-side code.
 * Provides no-op implementations of the email capture context.
 */

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

interface PostCopyEmailContextValue {
  openModal: (context: any) => void;
}

const PostCopyEmailContext = createContext<PostCopyEmailContextValue | undefined>(undefined);

export function PostCopyEmailProvider({ children }: { children: ReactNode }) {
  const value: PostCopyEmailContextValue = {
    openModal: () => {
      console.log('[STORYBOOK MOCK] PostCopyEmailProvider.openModal called');
    },
  };

  return <PostCopyEmailContext.Provider value={value}>{children}</PostCopyEmailContext.Provider>;
}

export function usePostCopyEmail() {
  const context = useContext(PostCopyEmailContext);
  if (!context) {
    throw new Error('usePostCopyEmail must be used within PostCopyEmailProvider');
  }
  return context;
}
