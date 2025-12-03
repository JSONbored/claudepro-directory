import { getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import {
  marginBottom,
  weight,
  muted,
  size,
  padding,
  spaceY,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

/**
 * Produce the page metadata for the Cookies page used by Next.js routing and SEO.
 *
 * @returns The Metadata object for the "/cookies" page.
 *
 * @see generatePageMetadata - helper that builds standard page metadata
 * @see {@link export const revalidate} - this page is statically generated (no revalidation)
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/cookies');
}

/**
 * Static Generation: Legal pages are fully static and never change
 * revalidate: false = Static generation at build time (no automatic revalidation)
 */
export const revalidate = false;

/**
 * Render the site's Cookie Policy page.
 *
 * Displays the Cookie Policy content with an embedded "Last updated" date retrieved on the server.
 *
 * The component reads the site's last updated date via `getLastUpdatedDate()` and renders semantic
 * sections describing cookie types, third-party services, management options, and contact links.
 *
 * This page is statically generated at build time and does not revalidate (see `export const revalidate = false`).
 *
 * @returns The Cookie Policy page as JSX for server-side rendering.
 *
 * @see getLastUpdatedDate - retrieves the "Last updated" date shown on the page.
 * @see NavLink - used for internal navigation links to contact and privacy pages.
 */
export default function CookiesPage() {
  const lastUpdated = getLastUpdatedDate();

  return (
    <div
      className={`container mx-auto ${maxWidth['4xl']} ${padding.xDefault} ${padding.yRelaxed} sm:py-12`}
    >
      <div className={`prose prose-invert ${maxWidth.none}`}>
        <h1
          className={`${marginBottom.comfortable} ${weight.bold} ${size['3xl']} sm:${size['4xl']}`}
        >
          Cookie Policy
        </h1>
        <p className={`${marginBottom.relaxed} ${muted.default}`}>Last updated: {lastUpdated}</p>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            1. What Are Cookies
          </h2>
          <p className={marginBottom.default}>
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and
            understanding how you use our service.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            2. How We Use Cookies
          </h2>
          <p className={marginBottom.default}>We use cookies for the following purposes:</p>
          <ul className={`list-disc ${spaceY.compact} pl-6`}>
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

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            3. Types of Cookies We Use
          </h2>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>
              Essential Cookies
            </h3>
            <p className={marginBottom.tight}>
              These cookies are necessary for the website to function and cannot be disabled:
            </p>
            <ul className={`list-disc ${spaceY.tight} pl-6`}>
              <li>Session management cookies</li>
              <li>Authentication cookies (better-auth)</li>
              <li>Security and fraud prevention cookies</li>
            </ul>
          </div>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>
              Analytics Cookies
            </h3>
            <p className={marginBottom.tight}>
              We use privacy-focused analytics to understand usage patterns:
            </p>
            <ul className={`list-disc ${spaceY.tight} pl-6`}>
              <li>Umami Analytics (privacy-focused, no personal data tracked)</li>
              <li>Vercel Analytics (performance monitoring)</li>
            </ul>
          </div>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>
              Preference Cookies
            </h3>
            <p className={marginBottom.tight}>These cookies remember your choices:</p>
            <ul className={`list-disc ${spaceY.tight} pl-6`}>
              <li>Theme preference (dark/light mode)</li>
              <li>Newsletter subscription status</li>
            </ul>
          </div>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            4. Third-Party Cookies
          </h2>
          <p className={marginBottom.default}>
            We use the following third-party services that may set cookies:
          </p>
          <ul className={`list-disc ${spaceY.compact} pl-6`}>
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

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            5. Managing Cookies
          </h2>
          <p className={marginBottom.default}>
            You can control and manage cookies in several ways:
          </p>

          <div className={marginBottom.default}>
            <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.lg}`}>
              Browser Settings
            </h3>
            <p className={marginBottom.tight}>Most browsers allow you to:</p>
            <ul className={`list-disc ${spaceY.tight} pl-6`}>
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </div>

          <div className={marginBottom.default}>
            <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.lg}`}>
              Browser-Specific Instructions
            </h3>
            <ul className={`list-disc ${spaceY.tight} pl-6`}>
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

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            6. Impact of Disabling Cookies
          </h2>
          <p className={marginBottom.default}>
            If you disable cookies, some features of our website may not function properly:
          </p>
          <ul className={`list-disc ${spaceY.compact} pl-6`}>
            <li>You may not be able to stay logged in</li>
            <li>Your preferences may not be saved</li>
            <li>Some features may not work correctly</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            7. Updates to This Policy
          </h2>
          <p className={marginBottom.default}>
            We may update this Cookie Policy from time to time. Any changes will be posted on this
            page with an updated "Last updated" date.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            8. Contact Us
          </h2>
          <p className={marginBottom.default}>
            If you have questions about our use of cookies, please{' '}
            <NavLink href="/contact">contact us</NavLink> or review our{' '}
            <NavLink href="/privacy">Privacy Policy</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}