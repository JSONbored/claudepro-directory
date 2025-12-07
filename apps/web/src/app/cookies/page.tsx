import { getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

/**
 * Provides page metadata for the Cookies page used by Next.js.
 *
 * Metadata is generated at build time for the '/cookies' route; revalidation is disabled (static generation, no ISR).
 *
 * @returns Metadata object describing the Cookies page.
 *
 * @see generatePageMetadata
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/generate-metadata Next.js generate metadata}
 */
/**
 * Produce page metadata for the Cookies page for static generation.
 *
 * Awaits a runtime connection to allow non-deterministic operations during metadata generation and returns the metadata for the '/cookies' route. The metadata is generated at build time and the page is not automatically revalidated.
 *
 * @returns The Next.js Metadata object for the Cookies page.
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/cookies');
}

/**
 * Server component that renders the Cookie Policy page, showing the current "Last updated" date.
 *
 * This async component defers non-deterministic operations to request time, establishes a
 * request-scoped logger, and renders the page content inside a Suspense boundary.
 *
 * @returns The React element for the Cookie Policy page.
 *
 * @see getLastUpdatedDate
 * @see NavLink
 * @see generatePageMetadata
 */
export default async function CookiesPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'CookiesPage',
    route: '/cookies',
    module: 'apps/web/src/app/cookies',
  });

  return (
    <Suspense
      fallback={<div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">Loading...</div>}
    >
      <CookiesPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the Cookie Policy page content and logs a page-render event.
 *
 * @param reqLogger - Request-scoped logger (result of `logger.child`) used to record rendering telemetry.
 * @returns The JSX element containing the Cookie Policy content, including the last-updated date and internal navigation links.
 *
 * @see getLastUpdatedDate
 * @see CookiesPage
 */
function CookiesPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  const lastUpdated = getLastUpdatedDate();

  reqLogger.info('CookiesPage: rendering page', {
    section: 'page-render',
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="prose prose-invert max-w-none">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">1. What Are Cookies</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and
            understanding how you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">2. How We Use Cookies</h2>
          <p className="mb-4">We use cookies for the following purposes:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Essential Cookies:</strong> Required for the website to function properly
              (authentication, security)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our
              website
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings and preferences (theme,
              language)
            </li>
            <li>
              <strong>Performance Cookies:</strong> Monitor and improve website performance
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">3. Types of Cookies We Use</h2>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Essential Cookies</h3>
            <p className="mb-2">
              These cookies are necessary for the website to function and cannot be disabled:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Session management cookies</li>
              <li>Authentication cookies (better-auth)</li>
              <li>Security and fraud prevention cookies</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Analytics Cookies</h3>
            <p className="mb-2">We use privacy-focused analytics to understand usage patterns:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Umami Analytics (privacy-focused, no personal data tracked)</li>
              <li>Vercel Analytics (performance monitoring)</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Preference Cookies</h3>
            <p className="mb-2">These cookies remember your choices:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Theme preference (dark/light mode)</li>
              <li>Newsletter subscription status</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">4. Third-Party Cookies</h2>
          <p className="mb-4">We use the following third-party services that may set cookies:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Vercel:</strong> Hosting and performance monitoring
            </li>
            <li>
              <strong>Cloudflare:</strong> Security and content delivery
            </li>
            <li>
              <strong>Umami:</strong> Privacy-focused analytics (self-hosted, no tracking)
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">5. Managing Cookies</h2>
          <p className="mb-4">You can control and manage cookies in several ways:</p>

          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold">Browser Settings</h3>
            <p className="mb-2">Most browsers allow you to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold">Browser-Specific Instructions</h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site
                data
              </li>
              <li>
                <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </li>
              <li>
                <strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site
                data
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">6. Impact of Disabling Cookies</h2>
          <p className="mb-4">
            If you disable cookies, some features of our website may not function properly:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>You may not be able to stay logged in</li>
            <li>Your preferences may not be saved</li>
            <li>Some features may not work correctly</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time. Any changes will be posted on this
            page with an updated "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions about our use of cookies, please{' '}
            <NavLink href="/contact">contact us</NavLink> or review our{' '}
            <NavLink href="/privacy">Privacy Policy</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}