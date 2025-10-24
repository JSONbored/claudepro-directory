import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/src/lib/constants';

export const metadata: Metadata = {
  title: `Cookie Policy - ${APP_CONFIG.name}`,
  description: `Cookie Policy for ${APP_CONFIG.name}. Learn about the cookies we use and how to manage your cookie preferences when using our Claude AI configuration directory.`,
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p className="mb-4">
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and
            understanding how you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="mb-4">We use cookies for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
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
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Essential Cookies</h3>
            <p className="mb-2">
              These cookies are necessary for the website to function and cannot be disabled:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Session management cookies</li>
              <li>Authentication cookies (better-auth)</li>
              <li>Security and fraud prevention cookies</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Analytics Cookies</h3>
            <p className="mb-2">We use privacy-focused analytics to understand usage patterns:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Umami Analytics (privacy-focused, no personal data tracked)</li>
              <li>Vercel Analytics (performance monitoring)</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Preference Cookies</h3>
            <p className="mb-2">These cookies remember your choices:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Theme preference (dark/light mode)</li>
              <li>Newsletter subscription status</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
          <p className="mb-4">We use the following third-party services that may set cookies:</p>
          <ul className="list-disc pl-6 space-y-2">
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
          <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
          <p className="mb-4">You can control and manage cookies in several ways:</p>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Browser Settings</h3>
            <p className="mb-2">Most browsers allow you to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Browser-Specific Instructions</h3>
            <ul className="list-disc pl-6 space-y-1">
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
          <h2 className="text-2xl font-semibold mb-4">6. Impact of Disabling Cookies</h2>
          <p className="mb-4">
            If you disable cookies, some features of our website may not function properly:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You may not be able to stay logged in</li>
            <li>Your preferences may not be saved</li>
            <li>Some features may not work correctly</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
          <p className="mb-4">
            We may update this Cookie Policy from time to time. Any changes will be posted on this
            page with an updated "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
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
