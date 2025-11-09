import Link from 'next/link';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/cookies');

/**
 * ISR Configuration: Legal pages are static and never change
 * revalidate: false = Cache forever (no automatic revalidation)
 */
export const revalidate = false;

export default function CookiesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="prose prose-invert max-w-none">
        <h1 className="mb-6 font-bold text-3xl sm:text-4xl">Cookie Policy</h1>
        <p className="mb-8 text-muted-foreground">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">1. What Are Cookies</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and
            understanding how you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">2. How We Use Cookies</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">3. Types of Cookies We Use</h2>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-xl">Essential Cookies</h3>
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
            <h3 className="mb-3 font-semibold text-xl">Analytics Cookies</h3>
            <p className="mb-2">We use privacy-focused analytics to understand usage patterns:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Umami Analytics (privacy-focused, no personal data tracked)</li>
              <li>Vercel Analytics (performance monitoring)</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-xl">Preference Cookies</h3>
            <p className="mb-2">These cookies remember your choices:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Theme preference (dark/light mode)</li>
              <li>Newsletter subscription status</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">4. Third-Party Cookies</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">5. Managing Cookies</h2>
          <p className="mb-4">You can control and manage cookies in several ways:</p>

          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-lg">Browser Settings</h3>
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
            <h3 className="mb-2 font-semibold text-lg">Browser-Specific Instructions</h3>
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
          <h2 className="mb-4 font-semibold text-2xl">6. Impact of Disabling Cookies</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">7. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time. Any changes will be posted on this
            page with an updated "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">8. Contact Us</h2>
          <p className="mb-4">
            If you have questions about our use of cookies, please{' '}
            <Link href="/contact" className="text-accent hover:underline">
              contact us
            </Link>{' '}
            or review our{' '}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
