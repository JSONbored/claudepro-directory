'use client';

/**
 * Newsletter Component Suite - Unified entry point
 *
 * Export all newsletter components for easy importing.
 * NO barrel exports of types - import types from their source files directly.
 */

export type {
  NewsletterCardProps,
  NewsletterCTAVariantProps,
  NewsletterHeroProps,
  NewsletterInlineProps,
  NewsletterMinimalProps,
} from './newsletter-cta-variants';
export { NewsletterCTAVariant } from './newsletter-cta-variants';
export type { NewsletterFooterBarProps } from './newsletter-footer-bar';
export { NewsletterFooterBar } from './newsletter-footer-bar';
export type { NewsletterFormProps } from './newsletter-form';
export { NewsletterForm } from './newsletter-form';
export type { NewsletterModalProps } from './newsletter-modal';
export { NewsletterModal } from './newsletter-modal';
export type { NewsletterScrollTriggerProps } from './newsletter-scroll-trigger';
export { NewsletterScrollTrigger } from './newsletter-scroll-trigger';
export { formatSubscriberCount, getContextualMessage } from './newsletter-utils';
