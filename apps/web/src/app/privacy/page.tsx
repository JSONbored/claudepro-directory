import { getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { marginBottom, muted, weight, size, padding, spaceY, maxWidth, responsiveText, container, paddingLeft } from '@heyclaude/web-runtime/design-system';
import { cn, NavLink } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/privacy');
}

/**
 * Static Generation: Legal pages are fully static and never change
 * revalidate: false = Static generation at build time (no automatic revalidation)
 */
export const revalidate = false;

/**
 * Render the Privacy Policy page with the current "last updated" date and nine policy sections.
 *
 * This server-rendered page reads the last updated timestamp via `getLastUpdatedDate` and includes
 * links to the Cookie Policy and Contact page. The page is built statically at build time and
 * does not revalidate on the server (revalidate = false).
 *
 * @returns The Privacy Policy page as a JSX element.
 *
 * @see getLastUpdatedDate
 * @see APP_CONFIG
 * @see NavLink
 */
export default function PrivacyPage() {
  const lastUpdated = getLastUpdatedDate();

  return (
    <div className={`${container.default} ${maxWidth['4xl']} ${padding.xDefault} ${padding.yRelaxed} sm:${padding.ySection}`}>
      <div className={`prose prose-invert ${maxWidth.none}`}>
        <h1 className={cn(marginBottom.comfortable, weight.bold, responsiveText['3xl'])}>Privacy Policy</h1>
        <p className={`${marginBottom.relaxed} ${muted.default}`}>Last updated: {lastUpdated}</p>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>1. Information We Collect</h2>
          <p className={marginBottom.default}>
            We collect information that you provide directly to us when using {APP_CONFIG.name}:
          </p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Account information (email address, username)</li>
            <li>Profile information (optional bio, avatar)</li>
            <li>Content you submit (configurations, comments, interactions)</li>
            <li>Usage data (pages visited, features used, interactions)</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>2. How We Use Your Information</h2>
          <p className={marginBottom.default}>We use the information we collect to:</p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your experience and provide recommendations</li>
            <li>Send you technical notices and support messages</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and abuse</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>3. Information Sharing</h2>
          <p className={marginBottom.default}>
            We do not sell your personal information. We may share your information only in the
            following circumstances:
          </p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>With your consent</li>
            <li>For legal compliance or to protect rights</li>
            <li>With service providers who assist our operations (analytics, hosting)</li>
            <li>Public content you choose to share (configurations, profiles)</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>4. Cookies and Tracking</h2>
          <p className={marginBottom.default}>
            We use cookies and similar tracking technologies to collect and track information about
            your activity on our service. You can control cookies through your browser settings.
          </p>
          <p className={marginBottom.default}>
            For more details, see our <NavLink href="/cookies">Cookie Policy</NavLink>.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>5. Data Security</h2>
          <p className={marginBottom.default}>
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>6. Your Rights</h2>
          <p className={marginBottom.default}>You have the right to:</p>
          <ul className={`list-disc ${spaceY.compact} ${paddingLeft.relaxed}`}>
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>7. Children's Privacy</h2>
          <p className={marginBottom.default}>
            Our service is not directed to children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>8. Changes to This Policy</h2>
          <p className={marginBottom.default}>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className={marginBottom.relaxed}>
          <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>9. Contact Us</h2>
          <p className={marginBottom.default}>
            If you have questions about this Privacy Policy, please{' '}
            <NavLink href="/contact">contact us</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}