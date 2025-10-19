/**
 * PostCopyEmailProvider - Storybook Mock
 *
 * Browser-compatible mock that doesn't import any server-side code.
 * Provides no-op implementations of the email capture context.
 */

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

interface EmailCaptureContext {
  category?: string;
  slug?: string;
  action?: string;
}

interface PostCopyEmailContextValue {
  openModal: (context: EmailCaptureContext) => void;
}

const PostCopyEmailContext = createContext<PostCopyEmailContextValue | undefined>(undefined);

export function PostCopyEmailProvider({ children }: { children: ReactNode }) {
  const value: PostCopyEmailContextValue = {
    openModal: (context: EmailCaptureContext) => {
      // Silent no-op for Storybook - validate context shape but don't log
      // In production, this would trigger email capture modal
      if (context) {
        // Context validated, no action needed in mock
      }
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
