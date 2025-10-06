/**
 * Email Rendering Utilities
 * Converts React Email components to HTML strings for sending via Resend
 *
 * Features:
 * - Type-safe rendering
 * - Error handling and logging
 * - Performance optimized
 * - Production-ready
 */

import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { logger } from '@/src/lib/logger';

/**
 * Render options for email HTML generation
 */
export interface RenderEmailOptions {
  /**
   * Include CSS inline styles in the HTML
   * @default true
   */
  pretty?: boolean;

  /**
   * Include plain text version
   * @default false
   */
  plainText?: boolean;
}

/**
 * Rendered email result
 */
export interface RenderedEmail {
  /**
   * HTML version of the email
   */
  html: string;

  /**
   * Plain text version (if requested)
   */
  text?: string;

  /**
   * Whether rendering was successful
   */
  success: boolean;

  /**
   * Error message if rendering failed
   */
  error?: string;
}

/**
 * Render a React Email component to HTML
 *
 * @param component - React Email component to render
 * @param options - Rendering options
 * @returns Rendered email HTML and optional text version
 *
 * @example
 * ```ts
 * import { NewsletterWelcome } from '@/src/emails/templates/newsletter-welcome';
 *
 * const result = await renderEmail(
 *   <NewsletterWelcome email="user@example.com" />,
 *   { plainText: true }
 * );
 *
 * if (result.success) {
 *   await resend.emails.send({
 *     html: result.html,
 *     text: result.text,
 *     ...
 *   });
 * }
 * ```
 */
export async function renderEmail(
  component: ReactElement,
  options: RenderEmailOptions = {}
): Promise<RenderedEmail> {
  const { pretty = true, plainText = false } = options;

  try {
    // Render HTML version
    const html = await render(component, { pretty });

    // Render plain text version if requested
    let text: string | undefined;
    if (plainText) {
      text = await render(component, { plainText: true });
    }

    const componentName = typeof component.type === 'function' ? component.type.name : 'Unknown';

    logger.info('Email rendered successfully', {
      componentName,
      htmlLength: html.length,
      ...(text && { textLength: text.length }),
    });

    return {
      html,
      ...(text && { text }),
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const componentName = typeof component.type === 'function' ? component.type.name : 'Unknown';

    logger.error('Failed to render email', error instanceof Error ? error : undefined, {
      componentName,
      errorMessage,
    });

    return {
      html: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Render email to HTML only (no plain text)
 * Convenience wrapper around renderEmail
 *
 * @param component - React Email component to render
 * @returns HTML string or null if failed
 */
export async function renderEmailHtml(component: ReactElement): Promise<string | null> {
  const result = await renderEmail(component, { plainText: false });
  return result.success ? result.html : null;
}

/**
 * Render email with both HTML and plain text versions
 * Convenience wrapper around renderEmail
 *
 * @param component - React Email component to render
 * @returns Object with html and text, or null if failed
 */
export async function renderEmailBoth(
  component: ReactElement
): Promise<{ html: string; text: string } | null> {
  const result = await renderEmail(component, { plainText: true });
  return result.success && result.text ? { html: result.html, text: result.text } : null;
}

/**
 * Type guard to check if component is a valid React element
 */
export function isValidEmailComponent(component: unknown): component is ReactElement {
  return (
    typeof component === 'object' &&
    component !== null &&
    'type' in component &&
    'props' in component
  );
}

/**
 * Export all rendering utilities
 */
export const emailRenderer = {
  render: renderEmail,
  renderHtml: renderEmailHtml,
  renderBoth: renderEmailBoth,
  isValid: isValidEmailComponent,
} as const;

/**
 * Export default for convenience
 */
export default emailRenderer;
