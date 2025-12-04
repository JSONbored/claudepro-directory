import { getContactChannels, getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

/**
 * Generate page metadata for the /accessibility route.
 *
 * Used by Next.js to populate the document head for the accessibility page.
 *
 * @returns The Metadata object for the /accessibility page.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata('/accessibility');
}

/**
 * Accessibility statement should reflect the latest compliance status.
 * revalidate: 3600 = Revalidate every hour
 *
 * Note: With hourly revalidation, getLastUpdatedDate() will effectively show
 * the last regeneration time (up to an hour old). This aligns the displayed
 * "last updated" timestamp with the actual page regeneration cycle, ensuring
 * users see a timestamp that reflects when the page was last rebuilt rather
 * than a fixed "statement last updated" date from config or content.
 */
export const revalidate = 3600;

/**
 * Render the site's Accessibility Statement page.
 *
 * This server component reads the site's last-updated timestamp and contact channels at render time
 * and is intended to be statically generated as part of the page's ISR/revalidation cycle.
 *
 * @returns The React element for the full Accessibility Statement page.
 * @see getLastUpdatedDate
 * @see getContactChannels
 * @see APP_CONFIG
 * @see revalidate
 */
export default function AccessibilityPage() {
  const lastUpdated = getLastUpdatedDate();
  const channels = getContactChannels();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="prose prose-invert max-w-none">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Accessibility Statement</h1>
        <p className="text-muted-foreground mb-8">Page generated: {lastUpdated}</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Our Commitment</h2>
          <p className="mb-4">
            {APP_CONFIG.name} is committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and applying
            the relevant accessibility standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Conformance Status</h2>
          <p className="mb-4">
            We aim to conform to the{' '}
            <NavLink
              href="https://www.w3.org/WAI/WCAG21/quickref/"
              external
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Content Accessibility Guidelines (WCAG) 2.1
            </NavLink>{' '}
            at the AA level. These guidelines explain how to make web content more accessible for
            people with disabilities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Accessibility Features</h2>
          <p className="mb-4">Our website includes the following accessibility features:</p>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Keyboard Navigation</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>All interactive elements are keyboard accessible</li>
              <li>Skip to main content link for screen reader users</li>
              <li>Keyboard shortcuts (⌘K/Ctrl+K for search)</li>
              <li>Logical tab order throughout the site</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Visual Design</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>High contrast color ratios (WCAG AA compliant)</li>
              <li>Dark mode support for reduced eye strain</li>
              <li>Responsive design that works at different zoom levels</li>
              <li>Clear visual focus indicators</li>
              <li>Readable font sizes and line spacing</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Screen Reader Support</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Semantic HTML structure</li>
              <li>ARIA labels and descriptions where appropriate</li>
              <li>Alternative text for all meaningful images</li>
              <li>Proper heading hierarchy</li>
              <li>Form labels and error messages</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-xl font-semibold">Content</h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>Clear and simple language</li>
              <li>Descriptive link text</li>
              <li>Consistent navigation</li>
              <li>Breadcrumb navigation for context</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Known Limitations</h2>
          <p className="mb-4">
            Despite our efforts, some areas may not be fully accessible. We are actively working to
            address these:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Some third-party embedded content may not be fully accessible</li>
            <li>Complex interactive components are being continuously improved</li>
            <li>Some user-generated content may not meet accessibility standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Testing and Validation</h2>
          <p className="mb-4">We regularly test our website using:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Automated accessibility testing tools</li>
            <li>Screen reader testing (NVDA, JAWS, VoiceOver)</li>
            <li>Keyboard-only navigation testing</li>
            <li>Color contrast validation</li>
            <li>Manual accessibility audits</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Compatible Technologies</h2>
          <p className="mb-4">Our website is designed to be compatible with:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Modern web browsers (Chrome, Firefox, Safari, Edge)</li>
            <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
            <li>Browser extensions for accessibility</li>
            <li>Assistive technologies following web standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Feedback and Support</h2>
          <p className="mb-4">
            We welcome feedback on the accessibility of {APP_CONFIG.name}. If you encounter any
            accessibility barriers or have suggestions for improvement, please let us know:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Email:{' '}
              <NavLink href={`mailto:${channels.email}`} external>
                {channels.email}
              </NavLink>
            </li>
            <li>
              Contact form: <NavLink href="/contact">Contact Us</NavLink>
            </li>
            <li>
              GitHub Issues:{' '}
              <NavLink href={`${channels.github}/issues`} external>
                Report an Issue
              </NavLink>
            </li>
          </ul>
          <p className="mt-4">
            We will respond to accessibility feedback within 5 business days and work to resolve
            issues as quickly as possible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Formal Complaints</h2>
          <p className="mb-4">
            If you are not satisfied with our response to your accessibility concern, please contact
            us directly through the channels listed above.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Ongoing Improvements</h2>
          <p className="mb-4">Accessibility is an ongoing effort. We regularly:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Review and update our accessibility practices</li>
            <li>Train our team on accessibility best practices</li>
            <li>Conduct accessibility audits of new features</li>
            <li>Incorporate user feedback into improvements</li>
            <li>Stay informed about evolving accessibility standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Assessment Approach</h2>
          <p className="mb-4">
            This accessibility statement was created using automated and manual testing methods,
            including:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Self-evaluation using WCAG 2.1 criteria</li>
            <li>Automated accessibility testing tools (axe, Lighthouse)</li>
            <li>Manual testing with assistive technologies</li>
            <li>User feedback and testing</li>
          </ul>
        </section>
      </div>
    </div>
  );
}