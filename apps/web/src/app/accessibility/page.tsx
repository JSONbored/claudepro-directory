import { getContactChannels, getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { marginBottom, marginTop, muted, weight ,size  , padding , spaceY , maxWidth, container, paddingLeft } from '@heyclaude/web-runtime/design-system';
import { NavLink } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';


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
 * Render the site's Accessibility Statement page, including conformance status, accessibility features, known limitations, testing approach, compatible technologies, feedback channels, and a last-updated timestamp.
 *
 * The page displays the organization name from APP_CONFIG and uses contact information from getContactChannels and the timestamp from getLastUpdatedDate. It is produced as a statically generated page and participates in the file's ISR/revalidation behavior.
 *
 * @returns The React element representing the Accessibility Statement page.
 * @see getLastUpdatedDate
 * @see getContactChannels
 * @see APP_CONFIG
 * @see revalidate
 */
export default function AccessibilityPage() {
  const lastUpdated = getLastUpdatedDate();
  const channels = getContactChannels();

  return (
    <div className={`${container.default} ${maxWidth['4xl']} ${padding.xDefault} ${padding.yRelaxed} sm:${padding.ySection}`}>
      <div className={`prose prose-invert ${maxWidth.none}`}>
        <h1 className={`${marginBottom.comfortable} ${weight.bold} ${size['3xl']} sm:${size['4xl']}`}>Accessibility Statement</h1>
        <p className={`${marginBottom.relaxed} ${muted.default}`}>Page generated: {lastUpdated}</p>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Our Commitment</h2>
          <p className={marginBottom.default}>
            {APP_CONFIG.name} is committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and applying
            the relevant accessibility standards.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Conformance Status</h2>
          <p className={marginBottom.default}>
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

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Accessibility Features</h2>
          <p className={marginBottom.default}>Our website includes the following accessibility features:</p>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>Keyboard Navigation</h3>
            <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
              <li>All interactive elements are keyboard accessible</li>
              <li>Skip to main content link for screen reader users</li>
              <li>Keyboard shortcuts (⌘K/Ctrl+K for search)</li>
              <li>Logical tab order throughout the site</li>
            </ul>
          </div>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>Visual Design</h3>
            <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
              <li>High contrast color ratios (WCAG AA compliant)</li>
              <li>Dark mode support for reduced eye strain</li>
              <li>Responsive design that works at different zoom levels</li>
              <li>Clear visual focus indicators</li>
              <li>Readable font sizes and line spacing</li>
            </ul>
          </div>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>Screen Reader Support</h3>
            <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
              <li>Semantic HTML structure</li>
              <li>ARIA labels and descriptions where appropriate</li>
              <li>Alternative text for all meaningful images</li>
              <li>Proper heading hierarchy</li>
              <li>Form labels and error messages</li>
            </ul>
          </div>

          <div className={marginBottom.comfortable}>
            <h3 className={`${marginBottom.compact} ${weight.semibold} ${size.xl}`}>Content</h3>
            <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
              <li>Clear and simple language</li>
              <li>Descriptive link text</li>
              <li>Consistent navigation</li>
              <li>Breadcrumb navigation for context</li>
            </ul>
          </div>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Known Limitations</h2>
          <p className={marginBottom.default}>
            Despite our efforts, some areas may not be fully accessible. We are actively working to
            address these:
          </p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Some third-party embedded content may not be fully accessible</li>
            <li>Complex interactive components are being continuously improved</li>
            <li>Some user-generated content may not meet accessibility standards</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Testing and Validation</h2>
          <p className={marginBottom.default}>We regularly test our website using:</p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Automated accessibility testing tools</li>
            <li>Screen reader testing (NVDA, JAWS, VoiceOver)</li>
            <li>Keyboard-only navigation testing</li>
            <li>Color contrast validation</li>
            <li>Manual accessibility audits</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Compatible Technologies</h2>
          <p className={marginBottom.default}>Our website is designed to be compatible with:</p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Modern web browsers (Chrome, Firefox, Safari, Edge)</li>
            <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
            <li>Browser extensions for accessibility</li>
            <li>Assistive technologies following web standards</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Feedback and Support</h2>
          <p className={marginBottom.default}>
            We welcome feedback on the accessibility of {APP_CONFIG.name}. If you encounter any
            accessibility barriers or have suggestions for improvement, please let us know:
          </p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
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
          <p className={marginTop.default}>
            We will respond to accessibility feedback within 5 business days and work to resolve
            issues as quickly as possible.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Formal Complaints</h2>
          <p className={marginBottom.default}>
            If you are not satisfied with our response to your accessibility concern, please contact
            us directly through the channels listed above.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Ongoing Improvements</h2>
          <p className={marginBottom.default}>Accessibility is an ongoing effort. We regularly:</p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Review and update our accessibility practices</li>
            <li>Train our team on accessibility best practices</li>
            <li>Conduct accessibility audits of new features</li>
            <li>Incorporate user feedback into improvements</li>
            <li>Stay informed about evolving accessibility standards</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>Assessment Approach</h2>
          <p className={marginBottom.default}>
            This accessibility statement was created using automated and manual testing methods,
            including:
          </p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
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