/**
 * Email Preview API Route
 * Development tool for previewing email templates
 *
 * Security: Only accessible in development mode
 * Usage: GET /api/emails/preview?template=newsletter-welcome
 *
 * Note: This route is dynamic (no caching) as it's dev-only and renders email templates on-demand
 */

import { NextResponse } from 'next/server';
import {
  NewsletterWelcome,
  type NewsletterWelcomeProps,
} from '@/src/emails/templates/newsletter-welcome';
import { renderEmailHtml } from '@/src/emails/utils/render';
import { isDevelopment } from '@/src/lib/env-client';

/**
 * Available email templates for preview
 */
const templates = {
  'newsletter-welcome': NewsletterWelcome,
} as const;

type TemplateName = keyof typeof templates;

/**
 * Sample props for each template
 */
const sampleProps: Record<TemplateName, NewsletterWelcomeProps> = {
  'newsletter-welcome': {
    email: 'demo@example.com',
    source: 'preview',
  },
};

/**
 * GET /api/emails/preview
 * Preview email templates in development
 *
 * Query params:
 * - template: Template name (e.g., 'newsletter-welcome')
 * - email: Override email address (optional)
 * - source: Override source (optional)
 */
export async function GET(request: Request): Promise<Response> {
  // Dev-only route
  if (!isDevelopment) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const templateName = searchParams.get('template') as TemplateName | null;
  const email = searchParams.get('email');
  const source = searchParams.get('source');

  // No template specified - show API info
  if (!templateName) {
    return NextResponse.json(
      {
        message: 'Email preview API',
        availableTemplates: Object.keys(templates),
        usage: '/api/emails/preview?template=newsletter-welcome',
      },
      {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  }

  // Template not found
  if (!templates[templateName]) {
    return NextResponse.json(
      { error: `Template '${templateName}' not found` },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  }

  // Render template
  const TemplateComponent = templates[templateName];
  const baseProps = sampleProps[templateName];
  const props: NewsletterWelcomeProps = {
    email: email || baseProps.email,
    ...(source ? { source } : baseProps.source ? { source: baseProps.source } : {}),
  };

  const html = await renderEmailHtml(TemplateComponent(props));
  if (!html) {
    return NextResponse.json(
      { error: 'Failed to render email template' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
