import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';

import { LoginPanelClient } from './login-panel-client';

/**
 * Provide the page metadata for the login route.
 *
 * @returns The Next.js page `Metadata` object for the "/login" route.
 * @see generatePageMetadata
 * @see {@link Metadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/login');
}

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because searchParams is async (Next.js 15+) and requires runtime resolution.
 */
export const dynamic = 'force-dynamic';

/**
 * Render the login page layout, resolving an optional redirect target from the incoming search parameters.
 *
 * The component resolves the provided `searchParams` promise to extract a `redirect` value (if present), creates a request-scoped logger for this render, and passes the resolved `redirect` to the client-side login panel when available. Errors while resolving `searchParams` are logged and the page renders without a redirect target.
 *
 * @param props.searchParams - A promise that resolves to an object that may contain a `redirect` string.
 * @returns The React element for the login page layout.
 *
 * @see {@link LoginPanelClient}
 * @see {@link SplitAuthLayout}
 * @see {@link AuthBrandPanel}
 * @see {@link AuthMobileHeader}
 * @see {@link generateRequestId}
 * @see {@link logger}
 * @see {@link normalizeError}
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'LoginPage';
  const route = '/login';
  const module = 'apps/web/src/app/(auth)/login/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  let redirectTo: string | undefined;
  try {
    const resolvedSearchParameters = await searchParams;
    redirectTo = resolvedSearchParameters.redirect;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to resolve login search params');
    reqLogger.error('LoginPage: resolving searchParams failed', normalized);
    redirectTo = undefined;
  }

  return (
    <Suspense fallback={null}>
      <SplitAuthLayout
        brandPanel={<AuthBrandPanel />}
        mobileHeader={<AuthMobileHeader />}
        authPanel={
          <LoginPanelClient {...(redirectTo ? { redirectTo } : {})} />
        }
      />
    </Suspense>
  );
}