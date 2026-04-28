import { z } from "zod";
import { validateJobPublicationQuality } from "@heyclaude/registry/commercial";

const entryKeySchema = z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/);
const safeSlugSchema = z.string().regex(/^[a-z0-9-]+$/);
const platformSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9 -]{0,48}$/)
  .optional()
  .default("");
const categorySchema = safeSlugSchema.optional().default("");
const jobTierSchema = z.enum(["free", "standard", "featured", "sponsored"]);
const jobStatusSchema = z.enum([
  "draft",
  "pending_review",
  "active",
  "stale_pending_review",
  "closed",
  "archived",
]);
const jobSourceSchema = z.enum(["manual", "polar", "email", "curated"]);
const jobSourceKindSchema = z.enum([
  "official_ats",
  "employer_careers",
  "employer_submitted",
]);
const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => !value || /^https:\/\//i.test(value), {
    message: "URL must be HTTPS",
  })
  .optional()
  .default("");

export const apiErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().optional(),
    details: z.unknown().optional(),
  }),
  requestId: z.string().optional(),
});

export const registryTrustSignalsSchema = z.object({
  firstPartyEditorial: z.boolean().optional(),
  packageVerified: z.boolean().optional(),
  packageTrust: z.string().nullable().optional(),
  packageChecksum: z.string().optional(),
  checksumPresent: z.boolean().optional(),
  sourceUrlCount: z.number().int().nonnegative().optional(),
  sourceUrls: z.array(z.string().url()).max(8).optional(),
  sourceStatus: z.enum(["available", "missing"]).or(z.string()).optional(),
  lastVerifiedAt: z.string().optional(),
  adapterGenerated: z.boolean().optional(),
  platforms: z.array(z.string()).max(12).optional(),
  supportLevels: z.array(z.string()).max(12).optional(),
});

export const registrySearchQuerySchema = z.object({
  q: z.string().trim().toLowerCase().max(120).optional().default(""),
  category: categorySchema,
  platform: platformSchema,
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const registryDiffQuerySchema = z.object({
  since: z.string().trim().max(128).optional().default(""),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export const entryParamsSchema = z.object({
  category: safeSlugSchema,
  slug: safeSlugSchema,
});

export const votesQueryBodySchema = z.object({
  keys: z.array(entryKeySchema).max(1000).optional().default([]),
  clientId: z.string().trim().max(128).optional().default(""),
});

export const votesToggleBodySchema = z.object({
  key: entryKeySchema,
  clientId: z.string().trim().min(8).max(128),
  vote: z.boolean(),
});

export const newsletterSubscribeBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().trim().max(64).optional().default("site"),
});

export const newsletterWebhookBodySchema = z
  .object({
    type: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const submissionBodySchema = z.object({
  fields: z.record(z.string(), z.unknown()).optional().default({}),
  turnstileToken: z.string().max(4096).optional().default(""),
  honeypot: z.string().max(256).optional().default(""),
});

export const downloadQuerySchema = z.object({
  asset: z.string().trim().max(256),
});

export const githubStatsResponseSchema = z.object({
  repo: z.string(),
  stars: z.number().nullable(),
  forks: z.number().nullable(),
  updatedAt: z.string().nullable(),
});

export const listingLeadBodySchema = z
  .object({
    kind: z.enum(["job", "tool", "claim"]),
    tierInterest: z
      .enum(["free", "standard", "featured", "sponsored"])
      .optional()
      .default("free"),
    contactName: z.string().trim().min(1).max(120),
    contactEmail: z.string().trim().toLowerCase().email().max(320),
    companyName: z.string().trim().min(1).max(160),
    listingTitle: z.string().trim().min(1).max(180),
    websiteUrl: z.string().trim().max(2048).optional().default(""),
    applyUrl: z.string().trim().max(2048).optional().default(""),
    message: z.string().trim().max(4000).optional().default(""),
  })
  .strict();

export const adminListingLeadsQuerySchema = z.object({
  kind: z.string().trim().toLowerCase().optional().default(""),
  status: z.string().trim().toLowerCase().optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  format: z.string().trim().toLowerCase().optional().default(""),
});

export const adminListingLeadsPatchBodySchema = z.object({
  id: z.coerce.number().int().positive(),
  action: z.string().trim().toLowerCase().min(1).max(64),
});

export const adminJobsQuerySchema = z.object({
  status: z
    .union([jobStatusSchema, z.literal("")])
    .optional()
    .default(""),
  tier: z
    .union([jobTierSchema, z.literal("")])
    .optional()
    .default(""),
  source: z
    .union([jobSourceSchema, z.literal("")])
    .optional()
    .default(""),
  sourceKind: z
    .union([jobSourceKindSchema, z.literal("")])
    .optional()
    .default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const adminJobsUpsertBodySchema = z
  .object({
    slug: safeSlugSchema,
    title: z.string().trim().min(4).max(180),
    companyName: z.string().trim().min(2).max(160),
    companyUrl: optionalHttpsUrlSchema,
    locationText: z
      .string()
      .trim()
      .min(2)
      .max(160)
      .optional()
      .default("Remote"),
    summary: z.string().trim().min(80).max(900),
    descriptionMd: z.string().trim().max(8000).optional().default(""),
    employmentType: z.string().trim().max(80).optional().default(""),
    compensationSummary: z.string().trim().max(160).optional().default(""),
    equitySummary: z.string().trim().max(160).optional().default(""),
    bonusSummary: z.string().trim().max(160).optional().default(""),
    benefits: z.array(z.string().trim().min(2).max(180)).max(16).optional(),
    responsibilities: z
      .array(z.string().trim().min(2).max(240))
      .max(12)
      .optional(),
    requirements: z.array(z.string().trim().min(2).max(240)).max(12).optional(),
    applyUrl: optionalHttpsUrlSchema.refine((value) => Boolean(value), {
      message: "applyUrl is required",
    }),
    tier: jobTierSchema.optional().default("free"),
    status: jobStatusSchema.optional().default("pending_review"),
    source: jobSourceSchema.optional().default("manual"),
    sourceKind: jobSourceKindSchema.optional().default("employer_submitted"),
    sourceUrl: optionalHttpsUrlSchema,
    firstSeenAt: z.string().trim().max(64).optional().default(""),
    lastCheckedAt: z.string().trim().max(64).optional().default(""),
    sourceCheckedAt: z.string().trim().max(64).optional().default(""),
    staleCheckCount: z.coerce
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .default(0),
    curationNote: z.string().trim().max(1200).optional().default(""),
    paidPlacementExpiresAt: z.string().trim().max(64).optional().default(""),
    claimedEmployer: z.boolean().optional().default(false),
    postedByEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .max(320)
      .optional()
      .or(z.literal(""))
      .default(""),
    postedAt: z.string().trim().max(64).optional().default(""),
    expiresAt: z.string().trim().max(64).optional().default(""),
    isRemote: z.boolean().optional().default(true),
    isWorldwide: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((job, ctx) => {
    const report = validateJobPublicationQuality(job);
    if (report.ok) return;
    for (const message of report.errors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  });

export const adminJobsPatchBodySchema = z
  .object({
    slug: safeSlugSchema,
    action: z.enum([
      "review",
      "activate",
      "stale",
      "close",
      "archive",
      "reactivate",
      "expire",
      "revalidate",
    ]),
    checkedAt: z.string().trim().max(64).optional().default(""),
    expiresAt: z.string().trim().max(64).optional().default(""),
  })
  .strict();

export const intentEventsBodySchema = z.object({
  type: z.enum(["copy", "open", "install", "download", "vote"]),
  entryKey: z
    .union([entryKeySchema, z.literal("")])
    .optional()
    .default(""),
  sessionId: z.string().trim().max(128).optional().default(""),
});

export const communitySignalsQuerySchema = z.object({
  targetKind: z.enum(["entry", "tool"]),
  targetKey: z.string().trim().min(1).max(160),
});

export const communitySignalsBodySchema = communitySignalsQuerySchema.extend({
  signalType: z.enum(["used", "works", "broken"]),
  clientId: z.string().trim().min(8).max(128),
  active: z.boolean().optional().default(true),
});

export const ogQuerySchema = z.object({
  title: z.string().trim().max(120).optional().default("HeyClaude"),
  description: z
    .string()
    .trim()
    .max(220)
    .optional()
    .default(
      "A Claude-native registry for agents, MCP servers, skills, commands, hooks, rules, guides, and tools.",
    ),
  label: z.string().trim().max(64).optional().default("Registry"),
  kind: z
    .enum(["registry", "category", "entry", "job", "tool", "platform"])
    .optional()
    .default("registry"),
  badge: z.string().trim().max(64).optional().default("heyclau.de"),
});

export type ApiRouteDefinition = {
  id: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  originCheck?: boolean;
  bodyLimitBytes?: number;
  requiresJsonBody?: boolean;
  rateLimit?: {
    scope: string;
    limit: number;
    windowMs: number;
    binding?:
      | "API_REGISTRY_RATE_LIMIT"
      | "API_DYNAMIC_RATE_LIMIT"
      | "API_STRICT_RATE_LIMIT";
  };
  querySchema?: z.ZodTypeAny;
  paramsSchema?: z.ZodTypeAny;
  bodySchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  responseContentType?: string;
  staticSurface?: boolean;
  auth?: "admin-token" | "resend-signature" | "turnstile";
};

function route(definition: ApiRouteDefinition) {
  return definition;
}

export const apiRouteDefinitions = {
  "registry.manifest": route({
    id: "registry.manifest",
    method: "GET",
    path: "/api/registry/manifest",
    summary: "Registry artifact manifest",
    tags: ["Registry"],
    originCheck: true,
    rateLimit: {
      scope: "registry-manifest",
      limit: 120,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.categories": route({
    id: "registry.categories",
    method: "GET",
    path: "/api/registry/categories",
    summary: "Registry category summaries",
    tags: ["Registry"],
    originCheck: true,
    rateLimit: {
      scope: "registry-categories",
      limit: 120,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.search": route({
    id: "registry.search",
    method: "GET",
    path: "/api/registry/search",
    summary: "Search registry entries",
    description:
      "Search entries by query, category, and platform while preserving bounded result size.",
    tags: ["Registry"],
    originCheck: true,
    querySchema: registrySearchQuerySchema,
    rateLimit: {
      scope: "registry-search",
      limit: 120,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.feed": route({
    id: "registry.feed",
    method: "GET",
    path: "/api/registry/feed",
    summary: "Registry feed discovery",
    description:
      "Discovers API, RSS, changelog, category feeds, platform feeds, category and platform shards, and artifact URLs.",
    tags: ["Registry"],
    originCheck: true,
    rateLimit: {
      scope: "registry-feed",
      limit: 120,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.diff": route({
    id: "registry.diff",
    method: "GET",
    path: "/api/registry/diff",
    summary: "Registry changelog diff",
    tags: ["Registry"],
    originCheck: true,
    querySchema: registryDiffQuerySchema,
    rateLimit: {
      scope: "registry-diff",
      limit: 120,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.entry": route({
    id: "registry.entry",
    method: "GET",
    path: "/api/registry/entries/{category}/{slug}",
    summary: "Registry entry detail",
    description:
      "Returns entry metadata, body content, package facts, platform compatibility, and factual trustSignals when available.",
    tags: ["Registry"],
    originCheck: true,
    paramsSchema: entryParamsSchema,
    rateLimit: {
      scope: "registry-entry",
      limit: 180,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "registry.entryLlms": route({
    id: "registry.entryLlms",
    method: "GET",
    path: "/api/registry/entries/{category}/{slug}/llms",
    summary: "Registry entry LLM text export",
    tags: ["Registry"],
    originCheck: true,
    paramsSchema: entryParamsSchema,
    responseContentType: "text/plain; charset=utf-8",
    rateLimit: {
      scope: "registry-entry-llms",
      limit: 180,
      windowMs: 60_000,
      binding: "API_REGISTRY_RATE_LIMIT",
    },
  }),
  "votes.query": route({
    id: "votes.query",
    method: "POST",
    path: "/api/votes/query",
    summary: "Query vote counts and client state",
    tags: ["Dynamic"],
    originCheck: true,
    bodySchema: votesQueryBodySchema,
    bodyLimitBytes: 16 * 1024,
    rateLimit: {
      scope: "votes-query",
      limit: 120,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "votes.toggle": route({
    id: "votes.toggle",
    method: "POST",
    path: "/api/votes/toggle",
    summary: "Toggle a vote",
    tags: ["Dynamic"],
    originCheck: true,
    bodySchema: votesToggleBodySchema,
    bodyLimitBytes: 8 * 1024,
    rateLimit: {
      scope: "votes-toggle",
      limit: 45,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "newsletter.subscribe": route({
    id: "newsletter.subscribe",
    method: "POST",
    path: "/api/newsletter/subscribe",
    summary: "Subscribe an email to the newsletter",
    tags: ["Newsletter"],
    originCheck: true,
    bodySchema: newsletterSubscribeBodySchema,
    bodyLimitBytes: 8 * 1024,
    rateLimit: {
      scope: "newsletter-subscribe",
      limit: 15,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "newsletter.webhook": route({
    id: "newsletter.webhook",
    method: "POST",
    path: "/api/newsletter/webhook",
    summary: "Receive Resend webhook events",
    tags: ["Newsletter"],
    requiresJsonBody: true,
    bodyLimitBytes: 256 * 1024,
    auth: "resend-signature",
    rateLimit: {
      scope: "newsletter-webhook",
      limit: 120,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "submissions.create": route({
    id: "submissions.create",
    method: "POST",
    path: "/api/submissions",
    summary: "Create a reviewable content submission issue",
    description:
      "Validates schema-aligned UGC fields, applies anti-abuse controls, and creates a GitHub issue for maintainer review. This endpoint never writes content files or publishes registry entries directly.",
    tags: ["Submissions"],
    originCheck: true,
    bodySchema: submissionBodySchema,
    bodyLimitBytes: 64 * 1024,
    auth: "turnstile",
    rateLimit: {
      scope: "submissions",
      limit: 8,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  download: route({
    id: "download",
    method: "GET",
    path: "/api/download",
    summary: "Download generated registry packages",
    tags: ["Distribution"],
    querySchema: downloadQuerySchema,
    responseContentType: "application/octet-stream",
    rateLimit: {
      scope: "asset-download",
      limit: 180,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "listingLeads.create": route({
    id: "listingLeads.create",
    method: "POST",
    path: "/api/listing-leads",
    summary: "Create a commercial listing lead",
    tags: ["Commercial"],
    originCheck: true,
    bodySchema: listingLeadBodySchema,
    bodyLimitBytes: 16 * 1024,
    rateLimit: {
      scope: "listing-leads",
      limit: 12,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminListingLeads.list": route({
    id: "adminListingLeads.list",
    method: "GET",
    path: "/api/admin/listing-leads",
    summary: "Token-protected lead review/export endpoint",
    tags: ["Admin"],
    originCheck: true,
    querySchema: adminListingLeadsQuerySchema,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-listing-leads",
      limit: 60,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminListingLeads.update": route({
    id: "adminListingLeads.update",
    method: "PATCH",
    path: "/api/admin/listing-leads",
    summary: "Update listing lead status transition",
    tags: ["Admin"],
    originCheck: true,
    bodySchema: adminListingLeadsPatchBodySchema,
    bodyLimitBytes: 4 * 1024,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-listing-leads",
      limit: 60,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminJobs.list": route({
    id: "adminJobs.list",
    method: "GET",
    path: "/api/admin/jobs",
    summary: "Token-protected reviewed jobs list",
    description:
      "Lists D1-backed job records for maintainer review. Public jobs are rendered from active rows only; this admin endpoint can inspect all statuses.",
    tags: ["Admin"],
    originCheck: true,
    querySchema: adminJobsQuerySchema,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-jobs",
      limit: 60,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminJobs.upsert": route({
    id: "adminJobs.upsert",
    method: "POST",
    path: "/api/admin/jobs",
    summary: "Create or update a reviewed D1 job",
    description:
      "Creates or updates a private D1 job record after maintainer review. This endpoint never writes public repository content.",
    tags: ["Admin"],
    originCheck: true,
    bodySchema: adminJobsUpsertBodySchema,
    bodyLimitBytes: 32 * 1024,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-jobs",
      limit: 45,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminJobs.update": route({
    id: "adminJobs.update",
    method: "PATCH",
    path: "/api/admin/jobs",
    summary: "Transition reviewed D1 job state",
    description:
      "Transitions reviewed job rows through active, stale, closed, archived, and revalidated states without publishing repo content.",
    tags: ["Admin"],
    originCheck: true,
    bodySchema: adminJobsPatchBodySchema,
    bodyLimitBytes: 4 * 1024,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-jobs",
      limit: 45,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "adminJobs.health": route({
    id: "adminJobs.health",
    method: "GET",
    path: "/api/admin/jobs/health",
    summary: "Token-protected D1 jobs health check",
    description:
      "Checks the jobs D1 schema, required columns, and status counts before release or operational review.",
    tags: ["Admin"],
    originCheck: true,
    auth: "admin-token",
    rateLimit: {
      scope: "admin-jobs-health",
      limit: 60,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "intentEvents.create": route({
    id: "intentEvents.create",
    method: "POST",
    path: "/api/intent-events",
    summary: "Store a low-risk intent event",
    tags: ["Dynamic"],
    originCheck: true,
    bodySchema: intentEventsBodySchema,
    bodyLimitBytes: 4 * 1024,
    rateLimit: {
      scope: "intent-events",
      limit: 60,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "communitySignals.read": route({
    id: "communitySignals.read",
    method: "GET",
    path: "/api/community-signals",
    summary: "Read community signal counts",
    tags: ["Dynamic"],
    originCheck: true,
    querySchema: communitySignalsQuerySchema,
    rateLimit: {
      scope: "community-signals-read",
      limit: 180,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "communitySignals.write": route({
    id: "communitySignals.write",
    method: "POST",
    path: "/api/community-signals",
    summary: "Store community signal state",
    tags: ["Dynamic"],
    originCheck: true,
    bodySchema: communitySignalsBodySchema,
    bodyLimitBytes: 8 * 1024,
    rateLimit: {
      scope: "community-signals-write",
      limit: 45,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "githubStats.read": route({
    id: "githubStats.read",
    method: "GET",
    path: "/api/github-stats",
    summary: "Read cached GitHub repository stats",
    tags: ["Dynamic"],
    responseSchema: githubStatsResponseSchema,
    rateLimit: {
      scope: "github-stats",
      limit: 120,
      windowMs: 60_000,
      binding: "API_DYNAMIC_RATE_LIMIT",
    },
  }),
  "og.render": route({
    id: "og.render",
    method: "GET",
    path: "/api/og",
    summary: "Generate social preview image",
    tags: ["Distribution"],
    querySchema: ogQuerySchema,
    responseContentType: "image/png",
    rateLimit: {
      scope: "og-image",
      limit: 90,
      windowMs: 60_000,
      binding: "API_STRICT_RATE_LIMIT",
    },
  }),
  "static.rss": route({
    id: "static.rss",
    method: "GET",
    path: "/feed.xml",
    summary: "RSS feed",
    tags: ["Distribution"],
    staticSurface: true,
    responseContentType: "application/rss+xml",
  }),
  "static.atom": route({
    id: "static.atom",
    method: "GET",
    path: "/atom.xml",
    summary: "Atom feed",
    tags: ["Distribution"],
    staticSurface: true,
    responseContentType: "application/atom+xml",
  }),
  "static.feedIndex": route({
    id: "static.feedIndex",
    method: "GET",
    path: "/data/feeds/index.json",
    summary: "Static feed index",
    tags: ["Distribution"],
    staticSurface: true,
  }),
  "static.categoryFeed": route({
    id: "static.categoryFeed",
    method: "GET",
    path: "/data/feeds/categories/{category}.json",
    summary: "Static category feed",
    tags: ["Distribution"],
    staticSurface: true,
    paramsSchema: z.object({ category: safeSlugSchema }),
  }),
  "static.platformFeed": route({
    id: "static.platformFeed",
    method: "GET",
    path: "/data/feeds/platforms/{platform}.json",
    summary: "Static platform feed",
    tags: ["Distribution"],
    staticSurface: true,
    paramsSchema: z.object({ platform: safeSlugSchema }),
  }),
} as const;

export type ApiRouteId = keyof typeof apiRouteDefinitions;

export function getApiRouteDefinition(id: ApiRouteId) {
  return apiRouteDefinitions[id];
}

export function listApiRouteDefinitions() {
  return Object.values(apiRouteDefinitions);
}
