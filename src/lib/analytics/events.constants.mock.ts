/**
 * Analytics Events Constants - Storybook Mock
 *
 * Minimal mock implementation for Storybook component isolation.
 * Provides stub event names without full auto-generated configuration.
 *
 * @see src/lib/analytics/events.constants.ts for production implementation
 */

export const EVENTS = {
  // Consolidated events
  CONTENT_VIEWED: 'content_viewed',
  RELATED_CLICKED: 'related_clicked',
  RELATED_VIEWED: 'related_viewed',
  SEARCH: 'search',
  CODE_COPIED: 'code_copied',
  MARKDOWN_COPIED: 'markdown_copied',
  MARKDOWN_DOWNLOADED: 'markdown_downloaded',

  // Email events
  EMAIL_MODAL_SHOWN: 'email_modal_shown',
  EMAIL_MODAL_DISMISSED: 'email_modal_dismissed',
  EMAIL_SUBSCRIBED_FOOTER: 'email_subscribed_footer',
  EMAIL_SUBSCRIBED_INLINE: 'email_subscribed_inline',
  EMAIL_SUBSCRIBED_POST_COPY: 'email_subscribed_post_copy',
  EMAIL_SUBSCRIBED_HOMEPAGE: 'email_subscribed_homepage',
  EMAIL_SUBSCRIBED_MODAL: 'email_subscribed_modal',
  EMAIL_SUBSCRIBED_CONTENT_PAGE: 'email_subscribed_content_page',

  // Other core events
  PERSONALIZATION_FOR_YOU_VIEWED: 'personalization_for_you_viewed',
  PWA_INSTALLABLE: 'pwa_installable',
  PWA_INSTALLED: 'pwa_installed',
  PWA_LAUNCHED: 'pwa_launched',
} as const;
