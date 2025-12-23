/**
 * OAuth Success Page
 *
 * Confirmation page shown after successful OAuth authorization.
 * Matches Vercel's design with:
 * - Dark theme with minimal layout
 * - Success message
 * - Connected icons visual
 * - Auto-redirect to client's redirect_uri after 2-3 seconds
 * - "You can now close this tab" message
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { OAuthLayout } from '@/src/components/core/auth/oauth-layout';

import { OAuthSuccessClient } from './oauth-success-client';

/**
 * Provide the page metadata for the OAuth success route.
 *
 * @returns The Next.js page `Metadata` object for the "/oauth/success" route.
 */
export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  return await generatePageMetadata('/oauth/success');
}

/**
 * Render the OAuth success page.
 *
 * Displays confirmation message and auto-redirects to client's redirect_uri.
 *
 * @param searchParams - Promise resolving to an object containing `redirect_uri` string
 * @returns The React element for the OAuth success page
 */
export default async function OAuthSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const redirectUri = params.redirect_uri;

  return (
    <OAuthLayout>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-black">Loading...</div>
        }
      >
        <OAuthSuccessClient redirectUri={redirectUri ?? null} />
      </Suspense>
    </OAuthLayout>
  );
}

