/**
 * Email Module
 *
 * Complete email infrastructure for building and sending emails
 * using React Email and Resend.
 *
 * Usage:
 * ```tsx
 * import {
 *   BaseLayout,
 *   renderEmailTemplate,
 *   headingStyle,
 *   primaryButtonStyle,
 * } from '@heyclaude/web-runtime/email';
 * ```
 *
 * @module packages/web-runtime/src/email
 */

// Base template and renderer
export { BaseLayout, renderEmailTemplate, type BaseLayoutProps } from './base-template';

// Theme and styles
export * from './theme';
export * from './common-styles';

// UTM utilities
export * from './utm-templates';
export * from './email-utm';
export { buildEmailCtaUrl } from './cta';

// Components
export * from './components';

// Configuration
export * from './config';
