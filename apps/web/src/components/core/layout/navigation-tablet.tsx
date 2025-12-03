/**
 * Tablet Navigation Component
 * Visible md:flex xl:hidden (768px-1279px)
 * Horizontal scroll with first 5 nav items
 */

import {
  absolute,
  bgColor,
  cluster,
  display,
  height,
  overflow,
  padding,
  position,
  size,
  transition,
  weight,
  width,
  whitespace,
  scroll,
  textDecoration,
  hoverText,
  textColor,
} from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { PrefetchLink } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { PRIMARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isActive: (href: string) => boolean;
  onClick?: () => void;
}

const NavLink = ({ href, children, className = '', isActive, onClick }: NavLinkProps) => {
  const active = isActive(href);

  const linkProps = {
    href,
    prefetch: true,
    className: `group ${position.relative} ${padding.xTight} ${padding.yMicro} ${size.xs} ${weight.medium} ${transition.default} ${textDecoration.none} ${
      active ? textColor.foreground : `${textColor.foreground80} ${hoverText.foreground}`
    } ${className}`,
    ...(active && { 'aria-current': 'page' as const }),
    ...(onClick && { onClick }),
    style: {
      viewTransitionName: active ? 'nav-link' : undefined,
    } as React.CSSProperties,
  };

  return (
    <PrefetchLink {...linkProps}>
      <span className={`${position.relative} ${display.inlineBlock}`}>
        {children}
        <span
          className={`${absolute.bottomLeft} ${height.underline} ${bgColor.accent} ${transition.slow} ${
            active ? width.full : `${width[0]} group-hover:${width.full}`
          }`}
          aria-hidden="true"
        />
      </span>
    </PrefetchLink>
  );
};

interface NavigationTabletProps {
  isActive: (path: string) => boolean;
  onMobileMenuOpen: () => void;
}

/**
 * Renders a horizontally scrollable tablet navigation bar showing the first five primary items and a "More" button.
 *
 * Renders the first five entries from PRIMARY_NAVIGATION as navigation links with entry animations and a "More" button that opens additional options.
 *
 * @param isActive - Callback that receives a path and returns whether that path is currently active; used to apply active styling to links.
 * @param onMobileMenuOpen - Handler invoked when the "More" button is clicked.
 * @returns A navigation React element intended for tablet layouts (hidden on small screens, visible on md up to xl; tablet-only, 768–1279px).
 *
 * @see NavLink
 * @see PRIMARY_NAVIGATION
 */
export function NavigationTablet({ isActive, onMobileMenuOpen }: NavigationTabletProps) {
  return (
    <motion.nav
      className={`${scroll.hideScrollbar} ${display.none} ${scroll.snapX} ${scroll.snapMandatory} ${overflow.xAuto} md:${display.flex} xl:${display.none}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Tablet navigation"
    >
      <div className={`${display.flex} ${cluster.tight} ${padding.xTight}`}>
        {PRIMARY_NAVIGATION.slice(0, 5).map((link, index) => (
          <motion.div
            key={link.href}
            className="snap-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <NavLink
              href={link.href}
              isActive={isActive}
              className={`${whitespace.nowrap} ${padding.xCompact} ${padding.yCompact} ${size.xs}`}
            >
              {link.label}
            </NavLink>
          </motion.div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuOpen}
          className={`${whitespace.nowrap} ${size.xs}`}
          aria-label="Open more navigation options"
        >
          More
        </Button>
      </div>
    </motion.nav>
  );
}