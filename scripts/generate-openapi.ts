import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { stringify } from "yaml";
import { z } from "zod";

extendZodWithOpenApi(z);

const require = createRequire(import.meta.url);
const {
  apiErrorEnvelopeSchema,
  listApiRouteDefinitions,
  registryTrustSignalsSchema,
} =
  require("../apps/web/src/lib/api/contracts.ts") as typeof import("../apps/web/src/lib/api/contracts");
type ApiRouteDefinition = ReturnType<typeof listApiRouteDefinitions>[number];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputPath = path.join(
  repoRoot,
  "cloudflare/api-schema-heyclaude-openapi.yaml",
);

function methodName(method: ApiRouteDefinition["method"]) {
  return method.toLowerCase() as "get" | "post" | "patch";
}

function successDescription(definition: ApiRouteDefinition) {
  if (definition.staticSurface) return definition.summary;
  if (definition.id.includes("communitySignals")) {
    return "Request accepted. Dynamic state may fail open when D1 is unavailable.";
  }
  if (definition.id.includes("intentEvents")) {
    return "Request accepted. D1 insert failed or unavailable states return a documented fail-open response.";
  }
  if (definition.id.includes("adminListingLeads.update")) {
    return "Status transition accepted.";
  }
  if (definition.path.includes("/api/registry")) {
    return "Cacheable registry response with ETag support where applicable.";
  }
  return "Request accepted.";
}

function responseContentType(definition: ApiRouteDefinition) {
  return definition.responseContentType || "application/json";
}

function responseFor(definition: ApiRouteDefinition) {
  const contentType = responseContentType(definition);
  if (contentType === "text/plain; charset=utf-8") {
    return {
      description: successDescription(definition),
      content: {
        "text/plain": {
          schema: { type: "string" },
        },
      },
    };
  }
  if (contentType === "image/png") {
    return {
      description: successDescription(definition),
      content: {
        "image/png": {
          schema: { type: "string", format: "binary" },
        },
      },
    };
  }
  if (contentType === "application/octet-stream") {
    return {
      description: successDescription(definition),
      content: {
        "application/octet-stream": {
          schema: { type: "string", format: "binary" },
        },
      },
    };
  }
  if (
    contentType === "application/rss+xml" ||
    contentType === "application/atom+xml"
  ) {
    return {
      description: successDescription(definition),
      content: {
        [contentType]: {
          schema: { type: "string" },
        },
      },
    };
  }
  return {
    description: successDescription(definition),
    content: {
      "application/json": {
        schema: definition.responseSchema || z.record(z.string(), z.unknown()),
      },
    },
  };
}

function errorResponses(definition: ApiRouteDefinition) {
  if (definition.staticSurface) return {};
  return {
    400: {
      description:
        "Invalid JSON, invalid query, invalid payload, or invalid status transition.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    401: {
      description: "Unauthorized admin token or invalid webhook signature.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    403: {
      description: "Forbidden origin.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    413: {
      description: "Payload too large.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    415: {
      description: "Invalid content type.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    429: {
      description: "Route-level or Cloudflare-native rate limited.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    500: {
      description: "Internal error.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    502: {
      description: "Upstream provider error.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
    503: {
      description:
        "Site DB not configured, provider not configured, or endpoint unavailable.",
      content: { "application/json": { schema: apiErrorEnvelopeSchema } },
    },
  };
}

function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.register("ErrorEnvelope", apiErrorEnvelopeSchema);
  registry.register("RegistryTrustSignals", registryTrustSignalsSchema);

  for (const definition of listApiRouteDefinitions()) {
    const request: Record<string, unknown> = {};
    if (definition.paramsSchema) request.params = definition.paramsSchema;
    if (definition.querySchema) request.query = definition.querySchema;
    if (definition.bodySchema) {
      request.body = {
        content: {
          "application/json": {
            schema: definition.bodySchema,
          },
        },
      };
    }

    registry.registerPath({
      method: methodName(definition.method),
      path: definition.path,
      tags: definition.tags,
      summary: definition.summary,
      description: definition.description,
      request,
      responses: {
        200: responseFor(definition),
        ...errorResponses(definition),
      },
    });
  }

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "HeyClaude API",
      version: "1.0.0",
      description:
        "Read-only registry, distribution feeds, and tightly scoped dynamic endpoints. Public registry publishing is not exposed through the API.",
    },
    servers: [{ url: "https://heyclau.de" }, { url: "https://dev.heyclau.de" }],
    security: [{ OriginCheck: [] }],
    components: {
      securitySchemes: {
        OriginCheck: {
          type: "apiKey",
          in: "header",
          name: "Origin",
          description:
            "Browser-facing endpoints enforce origin checks and route-level rate limits.",
        },
        AdminBearer: {
          type: "http",
          scheme: "bearer",
          description:
            "Token required for listing lead review and status transitions.",
        },
      },
    },
  });
}

const generated = `${stringify(buildOpenApiDocument(), {
  lineWidth: 100,
  singleQuote: false,
})}\n`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8")
    : "";
  if (current !== generated) {
    console.error(
      "OpenAPI schema is stale. Run `pnpm generate:openapi` and commit the result.",
    );
    process.exit(1);
  }
  process.exit(0);
}

fs.writeFileSync(outputPath, generated);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
