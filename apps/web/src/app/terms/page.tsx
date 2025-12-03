import { getContactChannels, getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  marginBottom,
  padding,
  stack,
  muted,
  weight,
  size,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

/**
 * Generate page metadata for the Terms of Service route.
 *
 * This function provides the Metadata object Next.js uses for the `/terms` page.
 *
 * @returns The metadata object for the `/terms` page.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/terms');
}

/**
 * Static Generation: Legal pages are fully static and never change
 * revalidate: false = Static generation at build time (no automatic revalidation)
 */
export const revalidate = false;

/**
 * Renders the Terms of Service page, embedding the last updated date and contact channels.
 *
 * @remarks
 * This server component sources runtime values for last-updated and contact channels and is intended for static rendering; the file exports `revalidate = false` (no ISR).
 *
 * @returns The Terms of Service page as a React element.
 *
 * @see generatePageMetadata
 * @see getLastUpdatedDate
 * @see getContactChannels
 * @see APP_CONFIG
 * @see NavLink
 */
export default function TermsPage() {
  const lastUpdated = getLastUpdatedDate();
  const channels = getContactChannels();

  return (
    <div
      className={`container mx-auto ${maxWidth['4xl']} ${padding.xDefault} ${padding.yRelaxed} sm:py-12`}
    >
      <div className={`prose prose-invert ${maxWidth.none}`}>
        <h1
          className={`${marginBottom.comfortable} ${weight.bold} ${size['3xl']} sm:${size['4xl']}`}
        >
          Terms of Service
        </h1>
        <p className={`${marginBottom.relaxed} ${muted.default}`}>Last updated: {lastUpdated}</p>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            1. Acceptance of Terms
          </h2>
          <p className={marginBottom.default}>
            By accessing and using {APP_CONFIG.name}, you accept and agree to be bound by these
            Terms of Service and our <NavLink href="/privacy">Privacy Policy</NavLink>. If you do
            not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            2. Use of Service
          </h2>
          <p className={marginBottom.default}>
            You agree to use our service only for lawful purposes and in accordance with these
            terms.
          </p>
          <p className={marginBottom.default}>You agree NOT to:</p>
          <ul className={`list-disc ${stack.compact} pl-6`}>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Upload malicious code or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
            <li>Impersonate another person or entity</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            3. User Content
          </h2>
          <p className={marginBottom.default}>
            You retain ownership of content you submit to {APP_CONFIG.name}. By submitting content,
            you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify,
            and display your content in connection with operating and promoting the service.
          </p>
          <p className={marginBottom.default}>You represent and warrant that:</p>
          <ul className={`list-disc ${stack.compact} pl-6`}>
            <li>You own or have the necessary rights to the content you submit</li>
            <li>Your content does not violate any third-party rights</li>
            <li>Your content complies with these Terms of Service</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            4. Intellectual Property
          </h2>
          <p className={marginBottom.default}>
            The service and its original content (excluding user-generated content), features, and
            functionality are owned by {APP_CONFIG.author} and are protected by international
            copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            5. Account Termination
          </h2>
          <p className={marginBottom.default}>
            We reserve the right to suspend or terminate your account and access to the service at
            our sole discretion, without notice, for conduct that we believe violates these Terms of
            Service or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            6. Disclaimers
          </h2>
          <p className={marginBottom.default}>
            The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind,
            either express or implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className={marginBottom.default}>
            We do not warrant that the service will be uninterrupted, secure, or error-free, or that
            any defects will be corrected.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            7. Limitation of Liability
          </h2>
          <p className={marginBottom.default}>
            In no event shall {APP_CONFIG.author}, its directors, employees, or agents be liable for
            any indirect, incidental, special, consequential, or punitive damages arising out of or
            relating to your use of or inability to use the service.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            8. Indemnification
          </h2>
          <p className={marginBottom.default}>
            You agree to indemnify and hold harmless {APP_CONFIG.author} from any claims, damages,
            losses, liabilities, and expenses (including legal fees) arising from your use of the
            service or violation of these Terms of Service.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            9. Changes to Terms
          </h2>
          <p className={marginBottom.default}>
            We reserve the right to modify these Terms of Service at any time. We will notify users
            of any material changes by posting the new terms on this page and updating the "Last
            updated" date. Your continued use of the service after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            10. Governing Law
          </h2>
          <p className={marginBottom.default}>
            These Terms of Service shall be governed by and construed in accordance with applicable
            laws, without regard to conflict of law provisions.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
            11. Contact Us
          </h2>
          <p className={marginBottom.default}>
            If you have questions about these Terms of Service, please{' '}
            <NavLink href={`mailto:${channels.email}`} external>
              {channels.email}
            </NavLink>{' '}
            or <NavLink href="/contact">contact us</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}