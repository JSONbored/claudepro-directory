/**
 * Item Detail LLMs.txt Route Handler
 * Generates AI-optimized plain text for individual content items
 *
 * @route GET /[category]/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  isValidCategory,
  VALID_CATEGORIES,
} from "@/src/lib/config/category-config";
import { APP_CONFIG } from "@/src/lib/constants";
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from "@/src/lib/content/content-loaders";
import { handleApiError } from "@/src/lib/error-handler";
import {
  buildRichContent,
  type ContentItem,
} from "@/src/lib/llms-txt/content-builder";
import {
  generateLLMsTxt,
  type LLMsTxtItem,
} from "@/src/lib/llms-txt/generator";
import { logger } from "@/src/lib/logger";
import { errorInputSchema } from "@/src/lib/schemas/error.schema";

/**
 * Runtime configuration
 */
export const runtime = "nodejs";

/**
 * ISR revalidation
 * Revalidate every 10 minutes (600 seconds) - content updates should propagate quickly
 */
export const revalidate = 600;

/**
 * Generate static params for all category/slug combinations
 *
 * @returns Array of category/slug params for static generation
 *
 * @remarks
 * Generates params for all 168+ detail pages across all categories.
 * This ensures llms.txt routes are pre-rendered at build time.
 */
export async function generateStaticParams() {
  const allParams: Array<{ category: string; slug: string }> = [];

  for (const category of VALID_CATEGORIES) {
    const items = await getContentByCategory(category);

    for (const item of items) {
      allParams.push({
        category,
        slug: item.slug,
      });
    }
  }

  return allParams;
}

/**
 * Handle GET request for item detail llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with category and slug params
 * @returns Plain text response with full item content
 *
 * @remarks
 * This route generates complete llms.txt content for individual items including:
 * - Full metadata (category, author, tags, date)
 * - Complete description
 * - Full content (markdown converted to plain text)
 * - PII sanitization applied
 * - Canonical URL for reference
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> },
): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    const { category, slug } = await params;

    requestLogger.info("Item llms.txt generation started", { category, slug });

    // Validate category
    if (!isValidCategory(category)) {
      requestLogger.warn("Invalid category requested for item llms.txt", {
        category,
        slug,
      });

      return new NextResponse("Category not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Get item metadata first (fast, cached)
    const item = await getContentBySlug(category, slug);

    if (!item) {
      requestLogger.warn("Item not found for llms.txt", { category, slug });

      return new NextResponse("Content not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Get full content (includes markdown content field)
    const fullItem = await getFullContentBySlug(category, slug);

    // Handle case where full content is not found
    if (!fullItem) {
      requestLogger.warn("Full item content not found for llms.txt", {
        category,
        slug,
      });

      return new NextResponse("Content not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Build rich content from ALL structured fields (features, installation, config, etc.)
    const richContent = buildRichContent(fullItem as ContentItem);

    // Transform to LLMsTxtItem format with rich content
    const llmsItem: LLMsTxtItem = {
      slug: fullItem.slug,
      title: fullItem.title || fullItem.name || fullItem.slug,
      description: fullItem.description,
      category: fullItem.category,
      tags: fullItem.tags || [],
      author: fullItem.author,
      dateAdded: fullItem.dateAdded,
      url: `${APP_CONFIG.url}/${category}/${slug}`,
      // Include FULL rich content from all fields
      content: richContent,
    };

    // Generate llms.txt content with full details
    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true, // Full content for detail pages
      sanitize: true, // Apply PII protection
    });

    requestLogger.info("Item llms.txt generated successfully", {
      category,
      slug,
      contentLength: llmsTxt.length,
      hasFullContent: !!fullItem.content,
    });

    // Return plain text response
    return new NextResponse(llmsTxt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control":
          "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error: unknown) {
    const { category, slug } = await params.catch(() => ({
      category: "unknown",
      slug: "unknown",
    }));

    requestLogger.error(
      "Failed to generate item llms.txt",
      error instanceof Error ? error : new Error(String(error)),
      { category, slug },
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success
        ? validatedError.data
        : { message: "Failed to generate llms.txt" },
      {
        route: "/[category]/[slug]/llms.txt",
        operation: "generate_item_llmstxt",
        method: "GET",
        logContext: { category, slug },
      },
    );
  }
}
