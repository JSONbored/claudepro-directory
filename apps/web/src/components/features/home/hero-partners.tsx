/**
 * Hero Partners Component
 *
 * Displays "Trusted by" partner logos in a marquee.
 * Includes Neon (1-year partnership) and other major companies.
 */

'use client';

import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@/src/components/ui/marquee';
import { getFeatureFlag } from '@heyclaude/web-runtime/config/static-configs';
import { SPRING, STAGGER, VIEWPORT } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import Image from 'next/image';

interface Partner {
  name: string;
  logo: string;
  href?: string;
  alt: string;
}

/**
 * Partner logos for "Trusted by" marquee
 * Includes Neon (1-year partnership) and other major companies
 */
const PARTNERS: Partner[] = [
  {
    name: 'Neon',
    logo: '/partners/neon.svg', // You'll need to add this logo
    href: 'https://neon.tech',
    alt: 'Neon - Serverless Postgres',
  },
  // Add more partners as needed
  // Example structure:
  // {
  //   name: 'Company Name',
  //   logo: '/partners/company.svg',
  //   href: 'https://company.com',
  //   alt: 'Company Name - Description',
  // },
];

/**
 * Hero Partners Marquee
 *
 * Displays partner logos in a smooth, infinite scrolling marquee.
 * Appears at the bottom of the hero section with "Trusted by" label.
 *
 * Feature flag: 'hero.partners_marquee.enabled' - Set to true to enable
 */
export function HeroPartners() {
  const shouldReduceMotion = useReducedMotion();

  // Feature flag check - can be disabled via config
  const isEnabled = Boolean(getFeatureFlag('hero.partners_marquee.enabled'));

  // Don't render if disabled or no partners
  if (!isEnabled || PARTNERS.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT.late}
      transition={{
        ...SPRING.smooth,
        delay: STAGGER.comfortable,
      }}
    >
      <div className="flex flex-col items-center gap-3">
        {/* "Trusted by" Label */}
        <motion.p
          className="text-muted-foreground text-sm font-medium tracking-wide uppercase"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          viewport={VIEWPORT.late}
          transition={{
            ...SPRING.smooth,
            delay: STAGGER.comfortable + STAGGER.tight,
          }}
        >
          Trusted by
        </motion.p>

        {/* Partner Logos Marquee */}
        <Marquee className="w-full">
          <MarqueeContent speed={40} pauseOnHover autoFill className="flex items-center">
            {PARTNERS.map((partner, index) => (
              <MarqueeItem
                key={`${partner.name}-${index}`}
                className="flex-center mx-6 h-12 w-auto opacity-60 transition-opacity hover:opacity-100"
              >
                {partner.href ? (
                  <a
                    href={partner.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-center"
                    aria-label={`Visit ${partner.name}`}
                  >
                    <Image
                      src={partner.logo}
                      alt={partner.alt}
                      width={120}
                      height={48}
                      className="h-auto max-h-12 w-auto object-contain grayscale transition-all hover:grayscale-0"
                      unoptimized
                    />
                  </a>
                ) : (
                  <Image
                    src={partner.logo}
                    alt={partner.alt}
                    width={120}
                    height={48}
                    className="h-auto max-h-12 w-auto object-contain grayscale"
                    unoptimized
                  />
                )}
              </MarqueeItem>
            ))}
          </MarqueeContent>
          <MarqueeFade side="left" />
          <MarqueeFade side="right" />
        </Marquee>
      </div>
    </motion.div>
  );
}
