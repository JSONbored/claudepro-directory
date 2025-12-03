'use client';

/**
 * Consulting Page - Minimalist Centered Note Design
 */

import Cal, { getCalApi } from '@calcom/embed-react';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  backdrop,
  bgColor,
  border,
  flexWrap,
  gap,
  alignItems,
  justify,
  leading,
  marginBottom,
  maxWidth,
  muted,
  padding,
  paddingLeft,
  paddingTop,
  radius,
  shadow,
  size,
  spaceY,
  tracking,
  weight,
  display,
  overflow,
  container,
  marginX,
  textAlign,
  textColor,
} from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect } from 'react';

export function ConsultingClient() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: 'consulting-call' });
      cal('ui', {
        theme: 'dark',
        styles: { branding: { brandColor: 'hsl(var(--accent))' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })().catch((error: unknown) => {
      logger.error(
        'Failed to initialize Cal.com',
        normalizeError(error, 'Failed to initialize Cal.com'),
        { namespace: 'consulting-call' }
      );
    });
  }, []);

  return (
    <div className={`${container.default} ${padding.xDefault} ${padding.yRelaxed} sm:${paddingLeft.relaxed} sm:${padding.yHero}`}>
      {/* Centered Note with Card Background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={`${marginX.auto} ${marginBottom.relaxed} ${maxWidth['2xl']}`}
      >
        <div className={`${overflow.hidden} ${radius.lg} ${border.default} ${bgColor['card/50']} ${padding.comfortable} ${shadow.sm} ${backdrop.sm} sm:${padding.relaxed}`}>
          <div className={`${marginBottom.relaxed} ${spaceY.comfortable} ${textAlign.center} sm:${marginBottom.section} sm:${spaceY.relaxed}`}>
            <h1 className={`${weight.bold} ${size['3xl']} ${tracking.tight} sm:${size['4xl']} md:${size['5xl']}`}>
              Let's Build Something Together
            </h1>
            <p className={`${marginX.auto} ${maxWidth.xl} ${size.base} ${muted.default} ${leading.relaxed} sm:${size.lg}`}>
              I'm <strong className={textColor.foreground}>ghost (JSONbored)</strong> — a
              multi-disciplined engineer who's spent years building infrastructure, applications,
              and systems that actually work.
            </p>
          </div>

          <div className={`${spaceY.relaxed} ${muted.smRelaxed} sm:${spaceY.loose} sm:${size.base}`}>
            <p>
              <strong className={textColor.foreground}>What I do:</strong> Full-stack development,
              blockchain infrastructure, network engineering, systems administration, DevOps, AI/LLM
              engineering, and database design. I'm a jack-of-all-trades who ships production
              systems, not demos.
            </p>

            <p>
              <strong className={textColor.foreground}>Experience:</strong> Spent 3+ years running Cosmos
              blockchain validators (securing $100MM+ in network assets). Built{' '}
              <Link href="/" className="link-accent-underline">
                Claude Pro Directory
              </Link>{' '}
              (
              <a
                href="https://github.com/jsonbored/claudepro-directory"
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent-underline"
              >
                GitHub
              </a>
              ) — an open-source directory for Claude AI templates and workflows with thousands of
              monthly visitors. Worked across the full stack from bare metal infrastructure to
              frontend UX.
            </p>

            <p>
              <strong className={textColor.foreground}>Tech stack:</strong> I work with whatever tools
              make sense for the job. Currently building with Next.js 16, React 19, TypeScript,
              PostgreSQL, and TailwindCSS v4 — but I've worked with many other stacks and adapt to
              your project's needs.
            </p>

            <p>
              <strong className={textColor.foreground}>Availability:</strong> I'm accepting new projects
              now. Book a free 15-minute discovery call below — I'll tell you honestly if I'm a good
              fit or not.
            </p>

            <div className={`${display.flex} ${flexWrap.wrap} ${alignItems.center} ${justify.center} ${gap.default} ${paddingTop.comfortable} ${size.xs} sm:${gap.comfortable} sm:${size.sm}`}>
              <a href="mailto:ghost@zeronode.sh" className="link-accent-underline">
                ghost@zeronode.sh
              </a>
              <span className={`${muted.default}/50`}>•</span>
              <a
                href="https://github.com/jsonbored"
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent-underline"
              >
                GitHub
              </a>
              <span className={`${muted.default}/50`}>•</span>
              <Link href="/" className="link-accent-underline">
                Claude Pro Directory
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Embed - Wider for Better Display */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`${marginX.auto} ${maxWidth['4xl']}`}
      >
        <h2 className={`${marginBottom.comfortable} ${textAlign.center} ${weight.bold} ${size['2xl']} sm:${marginBottom.relaxed} sm:${size['3xl']}`}>
          Book Your Free Discovery Call
        </h2>
        <div className={`${overflow.hidden} ${radius.lg} ${border.default} ${bgColor['card/50']} ${padding.default} ${shadow.sm} ${backdrop.sm} sm:${padding.comfortable}`}>
          <Cal
            calLink="jsonbored/heyclaude-consult"
            config={{
              theme: 'dark',
              layout: 'month_view',
            }}
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
          />
        </div>
      </motion.section>
    </div>
  );
}
