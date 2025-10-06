/**
 * OpenAPI Registry
 *
 * Central registry for all API endpoints with Zod schema integration.
 * Uses @asteasolutions/zod-to-openapi for automatic OpenAPI 3.1 spec generation.
 *
 * Architecture:
 * - Each API endpoint is registered with request/response schemas
 * - Schemas use .openapi() method for OpenAPI metadata
 * - Registry feeds into lib/openapi/spec.ts for final spec generation
 */

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI methods (.openapi())
extendZodWithOpenApi(z);

/**
 * OpenAPI-Enhanced Schemas
 *
 * These are the same validation schemas but with .openapi() metadata added
 */

// Base schemas with OpenAPI metadata
export const contentTypeSchema = z
  .enum([
    "agents",
    "mcp",
    "rules",
    "commands",
    "hooks",
    "statuslines",
    "collections",
  ])
  .openapi({
    description: "Content category identifier",
    example: "agents",
  });

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .openapi({
    description: "URL-safe slug identifier",
    example: "my-custom-agent",
  });

export const pageSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(10000)
  .default(1)
  .openapi({
    description: "Page number for pagination (1-based)",
    example: 1,
  });

export const limitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(1000)
  .default(50)
  .openapi({
    description: "Number of items per page",
    example: 50,
  });

export const searchQuerySchema = z.string().max(200).optional().openapi({
  description: "Search query string (max 200 chars)",
  example: "productivity agent",
});

// Request parameter schemas
export const categoryParamsSchema = z.object({
  category: contentTypeSchema,
});

export const categorySlugParamsSchema = z.object({
  category: contentTypeSchema,
  slug: slugSchema,
});

export const paginationQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
});

export const searchQueryParamsSchema = z.object({
  q: searchQuerySchema,
  category: contentTypeSchema.optional(),
  page: pageSchema,
  limit: limitSchema,
  sortBy: z
    .enum(["relevance", "date", "name", "popularity"])
    .default("relevance")
    .openapi({
      description: "Field to sort results by",
      example: "relevance",
    }),
  sortOrder: z.enum(["asc", "desc"]).default("desc").openapi({
    description: "Sort direction",
    example: "desc",
  }),
});

export const trendingQuerySchema = z.object({
  algorithm: z
    .enum(["trending", "popular", "recent"])
    .optional()
    .default("trending")
    .openapi({
      description: "Trending algorithm to use",
      example: "trending",
    }),
  period: z
    .enum(["day", "week", "month", "all"])
    .optional()
    .default("week")
    .openapi({
      description: "Time period for trending calculation",
      example: "week",
    }),
  limit: limitSchema.default(20),
});

// Response schemas
export const successResponseSchema = z.object({
  success: z.literal(true).openapi({ description: "Request succeeded" }),
  data: z.unknown().openapi({ description: "Response data payload" }),
  timestamp: z.string().openapi({
    description: "ISO 8601 timestamp",
    example: "2025-01-15T10:30:00.000Z",
  }),
});

export const errorResponseSchema = z.object({
  success: z.literal(false).openapi({ description: "Request failed" }),
  error: z.object({
    code: z
      .string()
      .openapi({ description: "Error code", example: "VALIDATION_ERROR" }),
    message: z.string().openapi({
      description: "Error message",
      example: "Invalid category parameter",
    }),
    details: z
      .unknown()
      .optional()
      .openapi({ description: "Optional error details" }),
  }),
  timestamp: z.string().openapi({
    description: "ISO 8601 timestamp",
    example: "2025-01-15T10:30:00.000Z",
  }),
});

export const contentListDataSchema = z.object({
  items: z
    .array(z.unknown())
    .openapi({ description: "Array of content items" }),
  total: z
    .number()
    .int()
    .min(0)
    .openapi({ description: "Total number of items", example: 42 }),
  page: pageSchema,
  limit: limitSchema,
  category: contentTypeSchema,
});

export const searchResultsDataSchema = z.object({
  results: z
    .array(z.unknown())
    .openapi({ description: "Array of search results" }),
  total: z
    .number()
    .int()
    .min(0)
    .openapi({ description: "Total matching results", example: 15 }),
  page: pageSchema,
  limit: limitSchema,
  query: searchQuerySchema,
  filters: z
    .object({})
    .passthrough()
    .optional()
    .openapi({ description: "Applied filters" }),
});

export const trendingItemSchema = z.object({
  category: contentTypeSchema,
  slug: slugSchema,
  title: z
    .string()
    .openapi({ description: "Content title", example: "Awesome Agent" }),
  views: z
    .number()
    .int()
    .min(0)
    .openapi({ description: "Total views", example: 1234 }),
  viewsToday: z
    .number()
    .int()
    .min(0)
    .optional()
    .openapi({ description: "Views in last 24h", example: 42 }),
  viewsThisWeek: z
    .number()
    .int()
    .min(0)
    .optional()
    .openapi({ description: "Views in last 7 days", example: 156 }),
});

export const trendingDataSchema = z.object({
  trending: z
    .array(trendingItemSchema)
    .openapi({ description: "Trending content items" }),
  algorithm: z
    .enum(["trending", "popular", "recent"])
    .openapi({ description: "Algorithm used", example: "trending" }),
  period: z
    .enum(["day", "week", "month", "all"])
    .optional()
    .openapi({ description: "Time period", example: "week" }),
});

// Cache warming schemas
export const cacheWarmRequestSchema = z
  .object({
    types: z
      .array(
        z.enum(["agents", "mcp", "rules", "commands", "hooks", "statuslines"]),
      )
      .optional()
      .openapi({
        description:
          "Array of content types to warm cache for (omit for all types)",
        example: ["agents", "mcp"],
      }),
    force: z.boolean().default(false).openapi({
      description: "Force cache refresh even if cache is warm",
      example: false,
    }),
  })
  .openapi({
    description: "Optional parameters for cache warming",
  });

export const cacheWarmResponseSchema = z.object({
  success: z
    .boolean()
    .openapi({ description: "Whether cache warming succeeded" }),
  message: z.string().openapi({
    description: "Status message",
    example: "Cache warming completed successfully",
  }),
  timestamp: z.string().openapi({
    description: "ISO 8601 timestamp",
    example: "2025-01-15T10:30:00.000Z",
  }),
});

export const cacheStatusResponseSchema = z.object({
  status: z
    .string()
    .optional()
    .openapi({ description: "Current cache status", example: "idle" }),
  message: z.string().optional().openapi({ description: "Status message" }),
  currentTime: z.string().openapi({
    description: "ISO 8601 timestamp",
    example: "2025-01-15T10:30:00.000Z",
  }),
  validated: z
    .boolean()
    .openapi({ description: "Whether response was validated" }),
});

// Guides trending schemas
export const guidesTrendingQuerySchema = z.object({
  category: z
    .enum(["guides", "tutorials", "use-cases", "workflows", "comparisons"])
    .optional()
    .openapi({
      description: "Content category filter for trending guides",
      example: "guides",
    }),
  limit: z.coerce.number().min(1).max(50).default(10).openapi({
    description: "Maximum number of trending items to return (1-50)",
    example: 10,
  }),
});

export const trendingGuideItemSchema = z.object({
  slug: slugSchema,
  title: z.string().openapi({
    description: "Guide title",
    example: "Getting Started with Claude",
  }),
  url: z.string().openapi({
    description: "Relative URL to guide",
    example: "/guides/guides/getting-started",
  }),
  views: z
    .number()
    .int()
    .min(0)
    .openapi({ description: "Total views", example: 542 }),
  rank: z
    .number()
    .int()
    .min(1)
    .openapi({ description: "Trending rank position", example: 1 }),
});

export const guidesTrendingDataSchema = z.object({
  guides: z
    .array(trendingGuideItemSchema)
    .openapi({ description: "Trending guides list" }),
  category: z
    .string()
    .openapi({ description: "Category filter applied", example: "guides" }),
  count: z
    .number()
    .int()
    .min(0)
    .openapi({ description: "Number of results returned", example: 10 }),
  timestamp: z.string().openapi({
    description: "ISO 8601 timestamp",
    example: "2025-01-15T10:30:00.000Z",
  }),
});

// All configurations streaming schemas
export const allConfigsQuerySchema = z.object({
  stream: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true")
    .openapi({
      description: "Enable streaming response for large datasets",
      example: "false",
    }),
  format: z.enum(["json", "ndjson"]).default("json").openapi({
    description:
      "Response format: standard JSON or newline-delimited JSON (NDJSON)",
    example: "json",
  }),
  batchSize: z.coerce.number().min(10).max(100).default(50).openapi({
    description: "Number of items per batch in streaming mode (10-100)",
    example: 50,
  }),
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
});

export const allConfigsDataSchema = z.object({
  "@context": z
    .string()
    .openapi({ description: "JSON-LD context", example: "https://schema.org" }),
  "@type": z
    .string()
    .openapi({ description: "Schema.org type", example: "Dataset" }),
  name: z.string().openapi({ description: "Dataset name" }),
  description: z.string().openapi({ description: "Dataset description" }),
  license: z.string().openapi({ description: "License URL" }),
  lastUpdated: z.string().openapi({ description: "ISO 8601 timestamp" }),
  statistics: z.object({
    totalConfigurations: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Total number of configurations" }),
    agents: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of agents" }),
    mcp: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of MCP servers" }),
    rules: z.number().int().min(0).openapi({ description: "Number of rules" }),
    commands: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of commands" }),
    hooks: z.number().int().min(0).openapi({ description: "Number of hooks" }),
    statuslines: z
      .number()
      .int()
      .min(0)
      .openapi({ description: "Number of statuslines" }),
  }),
  data: z
    .object({})
    .passthrough()
    .openapi({ description: "Configuration data by category" }),
  endpoints: z
    .object({})
    .passthrough()
    .openapi({ description: "API endpoints by category" }),
});

/**
 * Endpoint Registry
 *
 * Maps endpoint paths to their schema definitions.
 * Used by spec generator to create OpenAPI documentation.
 */
export const endpointRegistry = {
  // Content Category Endpoints
  "GET /api/{category}.json": {
    operationId: "getContentByCategory",
    summary: "Get content items by category",
    description:
      "Retrieve a paginated list of content items for a specific category (agents, mcp, rules, commands, hooks, statuslines)",
    tags: ["Content"],
    request: {
      params: categoryParamsSchema,
      query: paginationQuerySchema,
    },
    responses: {
      200: {
        description: "Successful response with content list",
        content: {
          "application/json": {
            schema: successResponseSchema.extend({
              data: contentListDataSchema,
            }),
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      404: {
        description: "Category not found",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // Content Detail Endpoints
  "GET /api/{category}/{slug}.json": {
    operationId: "getContentBySlug",
    summary: "Get content item by slug",
    description:
      "Retrieve full details for a single content item by category and slug identifier",
    tags: ["Content"],
    request: {
      params: categorySlugParamsSchema,
    },
    responses: {
      200: {
        description: "Successful response with content details",
        content: {
          "application/json": {
            schema: successResponseSchema.extend({
              data: z
                .unknown()
                .openapi({ description: "Content item with full details" }),
            }),
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      404: {
        description: "Content item not found",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // Search Endpoint
  "GET /api/search.json": {
    operationId: "searchContent",
    summary: "Search all content",
    description:
      "Full-text search across all content categories with filtering, sorting, and pagination",
    tags: ["Search"],
    request: {
      query: searchQueryParamsSchema,
    },
    responses: {
      200: {
        description: "Successful search response",
        content: {
          "application/json": {
            schema: successResponseSchema.extend({
              data: searchResultsDataSchema,
            }),
          },
        },
      },
      400: {
        description: "Bad request - invalid search parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // Trending Endpoint
  "GET /api/trending.json": {
    operationId: "getTrendingContent",
    summary: "Get trending content",
    description:
      "Retrieve currently trending content items based on view counts and engagement metrics",
    tags: ["Analytics"],
    request: {
      query: trendingQuerySchema,
    },
    responses: {
      200: {
        description: "Successful trending response",
        content: {
          "application/json": {
            schema: successResponseSchema.extend({
              data: trendingDataSchema,
            }),
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // Cache Warming Endpoints
  "POST /api/cache/warm": {
    operationId: "triggerCacheWarming",
    summary: "Trigger cache warming",
    description:
      "Manually trigger cache warming to pre-load popular content into cache. Rate limited to 10 requests per hour.",
    tags: ["Cache"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: cacheWarmRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Cache warming triggered successfully",
        content: {
          "application/json": {
            schema: cacheWarmResponseSchema,
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      429: {
        description: "Too many requests - cache warming already in progress",
        content: {
          "application/json": {
            schema: cacheWarmResponseSchema,
          },
        },
      },
    },
  },

  "GET /api/cache/warm": {
    operationId: "getCacheStatus",
    summary: "Get cache warming status",
    description: "Retrieve current cache warming status and statistics",
    tags: ["Cache"],
    request: {
      query: z.object({
        limit: limitSchema.optional(),
      }),
    },
    responses: {
      200: {
        description: "Cache status retrieved successfully",
        content: {
          "application/json": {
            schema: cacheStatusResponseSchema,
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // Guides Trending Endpoint
  "GET /api/guides/trending": {
    operationId: "getTrendingGuides",
    summary: "Get trending guides",
    description:
      "Retrieve currently trending guides filtered by category with view counts and rankings",
    tags: ["Analytics"],
    request: {
      query: guidesTrendingQuerySchema,
    },
    responses: {
      200: {
        description: "Successful trending guides response",
        content: {
          "application/json": {
            schema: guidesTrendingDataSchema,
          },
        },
      },
      400: {
        description: "Bad request - invalid parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },

  // All Configurations Endpoint
  "GET /api/all-configurations.json": {
    operationId: "getAllConfigurations",
    summary: "Get all configurations",
    description:
      "Retrieve all content configurations across all categories with optional streaming support for large datasets. Supports both standard JSON and NDJSON formats.",
    tags: ["Content"],
    request: {
      query: allConfigsQuerySchema,
    },
    responses: {
      200: {
        description: "Successful response with all configurations",
        content: {
          "application/json": {
            schema: allConfigsDataSchema,
          },
          "application/x-ndjson": {
            schema: z.string().openapi({
              description:
                "Newline-delimited JSON stream of configuration data",
            }),
          },
        },
      },
      400: {
        description: "Bad request - invalid query parameters",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  },
} as const;
