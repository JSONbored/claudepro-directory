import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';
import { LoginPanelClient } from './login-panel-client';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/login');
}

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  let redirectTo: string | undefined;
  try {
    const resolvedSearchParams = await searchParams;
    redirectTo = resolvedSearchParams.redirect;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to resolve login search params');
    logger.error('LoginPage: resolving searchParams failed', normalized);
    redirectTo = undefined;
  }

  return (
    <Suspense fallback={null}>
      <SplitAuthLayout
        brandPanel={<AuthBrandPanel />}
        mobileHeader={<AuthMobileHeader />}
        authPanel={<LoginPanelClient redirectTo={redirectTo} />}
      />
    </Suspense>
  );
}
