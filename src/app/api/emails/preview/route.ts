/**
 * Email Preview API Route
 * Development tool for previewing email templates
 *
 * Security: Only accessible in development mode
 * Usage: GET /api/emails/preview?template=newsletter-welcome
 */

import { NextResponse } from 'next/server';
import {
  NewsletterWelcome,
  type NewsletterWelcomeProps,
} from '@/src/emails/templates/newsletter-welcome';
import { renderEmailHtml } from '@/src/emails/utils/render';
import { createApiRoute, handleApiError } from '@/src/lib/error-handler';
import { z } from 'zod';

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
const querySchema = z.object({
  template: z.enum(['newsletter-welcome']).optional(),
  email: z.string().email().optional(),
  source: z.string().max(100).optional(),
});

const { GET } = createApiRoute({
  auth: { type: 'devOnly' },
  validate: { query: querySchema },
  response: { envelope: false },
  handlers: {
    GET: async ({ query }) => {
      const params = query as z.infer<typeof querySchema>;

      const templateName = params.template as TemplateName | undefined;
      if (!templateName) {
        return NextResponse.json({
          message: 'Email preview API',
          availableTemplates: Object.keys(templates),
          usage: '/api/emails/preview?template=newsletter-welcome',
        });
      }

      if (!templates[templateName]) {
        return handleApiError(new Error(`Template '${templateName}' not found`), {
          route: '/api/emails/preview',
          method: 'GET',
          operation: 'email_template_lookup',
          customMessage: `Template '${templateName}' not found`,
          logContext: {
            templateName,
            availableTemplates: Object.keys(templates).join(', '),
          },
          logLevel: 'warn',
        });
      }

      const TemplateComponent = templates[templateName];
      const baseProps = sampleProps[templateName];
      const props: NewsletterWelcomeProps = {
        email: params.email || baseProps.email,
        ...(params.source ? { source: params.source } : baseProps.source ? { source: baseProps.source } : {}),
      };

      const html = await renderEmailHtml(TemplateComponent(props));
      if (!html) {
        return handleApiError(new Error('Failed to render email template'), {
          route: '/api/emails/preview',
          method: 'GET',
          operation: 'email_template_render',
          logContext: { template: templateName },
          logLevel: 'error',
        });
      }

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    },
  },
});

export { GET };
