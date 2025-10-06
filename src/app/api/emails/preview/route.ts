/**
 * Email Preview API Route
 * Development tool for previewing email templates
 *
 * Security: Only accessible in development mode
 * Usage: GET /api/emails/preview?template=newsletter-welcome
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  NewsletterWelcome,
  type NewsletterWelcomeProps,
} from "@/src/emails/templates/newsletter-welcome";
import { renderEmailHtml } from "@/src/emails/utils/render";
import { logger } from "@/src/lib/logger";

/**
 * Available email templates for preview
 */
const templates = {
  "newsletter-welcome": NewsletterWelcome,
} as const;

type TemplateName = keyof typeof templates;

/**
 * Sample props for each template
 */
const sampleProps: Record<TemplateName, NewsletterWelcomeProps> = {
  "newsletter-welcome": {
    email: "demo@example.com",
    source: "preview",
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
export async function GET(request: NextRequest) {
  // Security: Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Email preview is only available in development" },
      { status: 403 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const templateName = searchParams.get("template") as TemplateName;

    // List available templates if no template specified
    if (!templateName) {
      return NextResponse.json({
        message: "Email preview API",
        availableTemplates: Object.keys(templates),
        usage: "/api/emails/preview?template=newsletter-welcome",
      });
    }

    // Validate template exists
    if (!templates[templateName]) {
      return NextResponse.json(
        {
          error: `Template '${templateName}' not found`,
          availableTemplates: Object.keys(templates),
        },
        { status: 404 },
      );
    }

    // Get template component and props
    const TemplateComponent = templates[templateName];
    const baseProps = sampleProps[templateName];
    const props: NewsletterWelcomeProps = {
      email: (searchParams.get("email") as string) || baseProps.email,
      ...(searchParams.get("source")
        ? { source: searchParams.get("source") as string }
        : baseProps.source
          ? { source: baseProps.source }
          : {}),
    };

    // Render template to HTML
    const html = await renderEmailHtml(TemplateComponent(props));

    if (!html) {
      logger.error("Failed to render email template for preview", undefined, {
        template: templateName,
      });

      return NextResponse.json(
        { error: "Failed to render email template" },
        { status: 500 },
      );
    }

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    logger.error(
      "Email preview error",
      error instanceof Error ? error : undefined,
      {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
