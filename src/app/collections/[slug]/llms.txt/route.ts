/**
 * Collections LLMs.txt Route Handler
 * Generates AI-optimized plain text for collection content
 *
 * @route GET /collections/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import { type NextRequest, NextResponse } from "next/server";
import { getCollectionFullContent, getCollections } from "@/generated/content";
import { APP_CONFIG } from "@/src/lib/constants";
import { getContentBySlug } from "@/src/lib/content/content-loaders";
import { handleApiError } from "@/src/lib/error-handler";
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
 * Revalidate every 10 minutes (600 seconds)
 */
export const revalidate = 600;

/**
 * Generate static params for all collections
 *
 * @returns Array of collection slugs for static generation
 */
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection: { slug: string }) => ({
    slug: collection.slug,
  }));
}

/**
 * Handle GET request for collection llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with slug param
 * @returns Plain text response with collection content
 *
 * @remarks
 * Collections are curated bundles of related configurations.
 * The llms.txt output includes all collection metadata and
 * a detailed description of included items.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    const { slug } = await params;

    requestLogger.info("Collection llms.txt generation started", { slug });

    // Get full collection content
    const collection = await getCollectionFullContent(slug);

    if (!collection) {
      requestLogger.warn("Collection not found for llms.txt", { slug });

      return new NextResponse("Collection not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Build detailed content including all items (NO TRUNCATION)
    let detailedContent = "";

    if (collection.items && collection.items.length > 0) {
      detailedContent += "INCLUDED ITEMS\n--------------\n\n";

      // Group items by category
      const itemsByCategory = collection.items.reduce(
        (acc, item) => {
          const category = item.category || "other";
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        },
        {} as Record<string, typeof collection.items>,
      );

      // Fetch actual item details and build full content (NO TRUNCATION)
      for (const [category, items] of Object.entries(itemsByCategory)) {
        detailedContent += `${category.toUpperCase()}:\n`;
        for (const itemRef of items) {
          // Fetch the actual item to get title and description
          try {
            const actualItem = await getContentBySlug(
              itemRef.category,
              itemRef.slug,
            );
            if (actualItem) {
              detailedContent += `• ${actualItem.title || actualItem.name || itemRef.slug}\n`;
              // Include FULL description - no truncation for AI consumption
              if (actualItem.description) {
                detailedContent += `  ${actualItem.description}\n`;
              }
              if (itemRef.reason) {
                detailedContent += `  Reason: ${itemRef.reason}\n`;
              }
            } else {
              // Fallback if item not found
              detailedContent += `• ${itemRef.slug}\n`;
              if (itemRef.reason) {
                detailedContent += `  ${itemRef.reason}\n`;
              }
            }
          } catch (error) {
            // If item fetch fails, use fallback
            requestLogger.warn("Failed to fetch collection item details", {
              category: itemRef.category,
              slug: itemRef.slug,
              error: error instanceof Error ? error.message : String(error),
            });
            detailedContent += `• ${itemRef.slug}\n`;
            if (itemRef.reason) {
              detailedContent += `  ${itemRef.reason}\n`;
            }
          }
        }
        detailedContent += "\n";
      }
    }

    // Add metadata sections (safely handle optional properties)
    if (collection.prerequisites && collection.prerequisites.length > 0) {
      detailedContent += "\nPREREQUISITES\n-------------\n";
      detailedContent += collection.prerequisites
        .map((p: string) => `• ${p}`)
        .join("\n");
      detailedContent += "\n\n";
    }

    // Transform to LLMsTxtItem format
    // Use description for short summary, content for full details (NO length limits)
    const llmsItem: LLMsTxtItem = {
      slug: collection.slug,
      title: String(collection.title),
      description: collection.description, // Short summary from collection
      content: detailedContent, // Full detailed content with all items (unlimited length)
      category: "collections",
      tags: collection.tags || [],
      author: collection.author || undefined,
      dateAdded: collection.dateAdded || undefined,
      url: `${APP_CONFIG.url}/collections/${slug}`,
    };

    // Generate llms.txt content with FULL content included
    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true, // Include full detailed content
      sanitize: true,
    });

    requestLogger.info("Collection llms.txt generated successfully", {
      slug,
      contentLength: llmsTxt.length,
      itemsCount: collection.items?.length || 0,
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
    const { slug } = await params.catch(() => ({ slug: "unknown" }));

    requestLogger.error(
      "Failed to generate collection llms.txt",
      error instanceof Error ? error : new Error(String(error)),
      { slug },
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success
        ? validatedError.data
        : { message: "Failed to generate llms.txt" },
      {
        route: "/collections/[slug]/llms.txt",
        operation: "generate_collection_llmstxt",
        method: "GET",
        logContext: { slug },
      },
    );
  }
}
