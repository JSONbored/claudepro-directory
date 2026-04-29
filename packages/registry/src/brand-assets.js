export const BRAND_ASSET_SOURCES = [
  "brandfetch",
  "manual",
  "website",
  "github",
  "none",
];

export const KNOWN_BRANDS = [
  { name: "Aider", domain: "aider.chat", aliases: ["aider"] },
  { name: "Airtable", domain: "airtable.com", aliases: ["airtable"] },
  { name: "Anthropic", domain: "anthropic.com", aliases: ["anthropic"] },
  { name: "Apify", domain: "apify.com", aliases: ["apify"] },
  { name: "Arcade", domain: "arcade.dev", aliases: ["arcade"] },
  { name: "Asana", domain: "asana.com", aliases: ["asana"] },
  { name: "Atlassian", domain: "atlassian.com", aliases: ["atlassian"] },
  {
    name: "AWS",
    domain: "aws.amazon.com",
    aliases: ["aws", "amazon web services"],
  },
  { name: "Azure", domain: "azure.microsoft.com", aliases: ["azure"] },
  { name: "Bolt", domain: "bolt.new", aliases: ["bolt"] },
  { name: "Box", domain: "box.com", aliases: ["box"] },
  { name: "Braintrust", domain: "braintrust.dev", aliases: ["braintrust"] },
  { name: "Browser Use", domain: "browser-use.com", aliases: ["browser use"] },
  { name: "Browserbase", domain: "browserbase.com", aliases: ["browserbase"] },
  { name: "Canva", domain: "canva.com", aliases: ["canva"] },
  { name: "ClickUp", domain: "clickup.com", aliases: ["clickup"] },
  { name: "Cline", domain: "cline.bot", aliases: ["cline"] },
  { name: "Cloudflare", domain: "cloudflare.com", aliases: ["cloudflare"] },
  { name: "Cloudinary", domain: "cloudinary.com", aliases: ["cloudinary"] },
  {
    name: "CodeRabbit",
    domain: "coderabbit.ai",
    aliases: ["coderabbit", "code rabbit"],
  },
  { name: "Composio", domain: "composio.dev", aliases: ["composio"] },
  { name: "Confluence", domain: "atlassian.com", aliases: ["confluence"] },
  {
    name: "ContrastAPI",
    domain: "contrastcyber.com",
    aliases: ["contrastapi", "contrast api", "contrast cyber"],
  },
  {
    name: "Contrast Security",
    domain: "contrastsecurity.com",
    aliases: ["contrast security"],
  },
  { name: "Continue", domain: "continue.dev", aliases: ["continue"] },
  { name: "CrewAI", domain: "crewai.com", aliases: ["crewai", "crew ai"] },
  { name: "Cursor", domain: "cursor.com", aliases: ["cursor"] },
  { name: "Daloopa", domain: "daloopa.com", aliases: ["daloopa"] },
  { name: "Datadog", domain: "datadoghq.com", aliases: ["datadog"] },
  { name: "Devin", domain: "devin.ai", aliases: ["devin"] },
  { name: "Discord", domain: "discord.com", aliases: ["discord"] },
  { name: "Docker", domain: "docker.com", aliases: ["docker"] },
  { name: "Exa", domain: "exa.ai", aliases: ["exa"] },
  { name: "Figma", domain: "figma.com", aliases: ["figma"] },
  { name: "Firebase", domain: "firebase.google.com", aliases: ["firebase"] },
  { name: "Fireflies", domain: "fireflies.ai", aliases: ["fireflies"] },
  { name: "Firecrawl", domain: "firecrawl.dev", aliases: ["firecrawl"] },
  { name: "GitHub", domain: "github.com", aliases: ["github"] },
  {
    name: "GitHub Copilot",
    domain: "github.com",
    aliases: ["github copilot", "copilot"],
  },
  { name: "GitLab", domain: "gitlab.com", aliases: ["gitlab"] },
  { name: "Google", domain: "google.com", aliases: ["google"] },
  {
    name: "Google Drive",
    domain: "drive.google.com",
    aliases: ["google drive"],
  },
  { name: "Grafana", domain: "grafana.com", aliases: ["grafana"] },
  { name: "Helicone", domain: "helicone.ai", aliases: ["helicone"] },
  { name: "HubSpot", domain: "hubspot.com", aliases: ["hubspot"] },
  {
    name: "Hyperbrowser",
    domain: "hyperbrowser.ai",
    aliases: ["hyperbrowser"],
  },
  {
    name: "Hugging Face",
    domain: "huggingface.co",
    aliases: ["hugging face", "huggingface"],
  },
  { name: "Intercom", domain: "intercom.com", aliases: ["intercom"] },
  { name: "Invideo", domain: "invideo.io", aliases: ["invideo"] },
  { name: "Jam", domain: "jam.dev", aliases: ["jam"] },
  { name: "Jira", domain: "atlassian.com", aliases: ["jira"] },
  { name: "Kubernetes", domain: "kubernetes.io", aliases: ["kubernetes"] },
  {
    name: "Lakera Guard",
    domain: "lakera.ai",
    aliases: ["lakera", "lakera guard"],
  },
  { name: "LangChain", domain: "langchain.com", aliases: ["langchain"] },
  { name: "Langfuse", domain: "langfuse.com", aliases: ["langfuse"] },
  { name: "LangGraph", domain: "langchain.com", aliases: ["langgraph"] },
  { name: "LangSmith", domain: "langchain.com", aliases: ["langsmith"] },
  { name: "Linear", domain: "linear.app", aliases: ["linear"] },
  { name: "Lovable", domain: "lovable.dev", aliases: ["lovable"] },
  { name: "Make", domain: "make.com", aliases: ["make"] },
  { name: "Mastra", domain: "mastra.ai", aliases: ["mastra"] },
  { name: "Microsoft", domain: "microsoft.com", aliases: ["microsoft"] },
  {
    name: "Monday.com",
    domain: "monday.com",
    aliases: ["monday", "monday.com"],
  },
  { name: "n8n", domain: "n8n.io", aliases: ["n8n"] },
  { name: "Netlify", domain: "netlify.com", aliases: ["netlify"] },
  { name: "Notion", domain: "notion.so", aliases: ["notion"] },
  { name: "OpenAI", domain: "openai.com", aliases: ["openai"] },
  { name: "OpenCode", domain: "opencode.ai", aliases: ["opencode"] },
  { name: "PayPal", domain: "paypal.com", aliases: ["paypal", "pay pal"] },
  { name: "Pipedream", domain: "pipedream.com", aliases: ["pipedream"] },
  { name: "Plaid", domain: "plaid.com", aliases: ["plaid"] },
  { name: "PostHog", domain: "posthog.com", aliases: ["posthog"] },
  { name: "Prometheus", domain: "prometheus.io", aliases: ["prometheus"] },
  { name: "Promptfoo", domain: "promptfoo.dev", aliases: ["promptfoo"] },
  { name: "Protect AI", domain: "protectai.com", aliases: ["protect ai"] },
  { name: "Raycast", domain: "raycast.com", aliases: ["raycast"] },
  { name: "Reddit", domain: "reddit.com", aliases: ["reddit"] },
  { name: "Redis", domain: "redis.io", aliases: ["redis"] },
  { name: "Replit", domain: "replit.com", aliases: ["replit", "replit agent"] },
  { name: "Roo Code", domain: "roocode.com", aliases: ["roo code"] },
  { name: "Salesforce", domain: "salesforce.com", aliases: ["salesforce"] },
  { name: "Sentry", domain: "sentry.io", aliases: ["sentry"] },
  { name: "Shopify", domain: "shopify.com", aliases: ["shopify"] },
  { name: "Slack", domain: "slack.com", aliases: ["slack"] },
  { name: "Smithery", domain: "smithery.ai", aliases: ["smithery"] },
  { name: "Socket", domain: "socket.dev", aliases: ["socket"] },
  {
    name: "Sourcegraph",
    domain: "sourcegraph.com",
    aliases: ["sourcegraph", "sourcegraph cody"],
  },
  { name: "Square", domain: "squareup.com", aliases: ["square"] },
  { name: "Stagehand", domain: "stagehand.dev", aliases: ["stagehand"] },
  { name: "Stripe", domain: "stripe.com", aliases: ["stripe"] },
  { name: "Supabase", domain: "supabase.com", aliases: ["supabase"] },
  { name: "Stytch", domain: "stytch.com", aliases: ["stytch"] },
  { name: "Trello", domain: "trello.com", aliases: ["trello"] },
  {
    name: "Trigger.dev",
    domain: "trigger.dev",
    aliases: ["trigger.dev", "trigger dev"],
  },
  { name: "Vercel", domain: "vercel.com", aliases: ["vercel"] },
  {
    name: "Vercel AI SDK",
    domain: "ai-sdk.dev",
    aliases: ["vercel ai sdk", "ai sdk"],
  },
  { name: "Windsurf", domain: "windsurf.com", aliases: ["windsurf"] },
  { name: "Workato", domain: "workato.com", aliases: ["workato"] },
  { name: "Zapier", domain: "zapier.com", aliases: ["zapier", "zapier ai"] },
  { name: "Zed", domain: "zed.dev", aliases: ["zed"] },
];

const HOSTING_DOMAINS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "npmjs.com",
  "www.npmjs.com",
  "pypi.org",
  "modelcontextprotocol.io",
]);

function clean(value) {
  return String(value ?? "").trim();
}

function normalizedText(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9.+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textContainsAlias(text, alias) {
  const normalized = normalizedText(text);
  const normalizedAlias = normalizedText(alias);
  if (!normalized || !normalizedAlias) return false;
  return ` ${normalized} `.includes(` ${normalizedAlias} `);
}

export function normalizeBrandDomain(value) {
  const raw = clean(value).toLowerCase();
  if (!raw) return "";

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    const hostname = parsed.hostname.replace(/^www\./, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) return "";
    if (hostname.includes("..")) return "";
    return hostname;
  } catch {
    return "";
  }
}

export function domainFromUrl(value) {
  try {
    return normalizeBrandDomain(new URL(clean(value)).hostname);
  } catch {
    return "";
  }
}

export function isHostingOrRegistryDomain(domain) {
  const normalized = normalizeBrandDomain(domain);
  return (
    HOSTING_DOMAINS.has(normalized) ||
    [...HOSTING_DOMAINS].some((host) => normalized.endsWith(`.${host}`))
  );
}

export function normalizeBrandColors(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clean(item))
    .filter((item) => /^#[0-9a-f]{6}$/i.test(item))
    .map((item) => item.toLowerCase())
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 6);
}

export function isAllowedBrandAssetUrl(value) {
  const raw = clean(value);
  if (!raw) return true;
  if (raw.startsWith("/")) return /^\/[a-z0-9/_+.-]+$/i.test(raw);

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "cdn.brandfetch.io" ||
      host === "asset.brandfetch.io" ||
      host === "heyclau.de" ||
      host === "heyclaude-dev.zeronode.workers.dev"
    );
  } catch {
    return false;
  }
}

export function brandfetchClientId(params = {}) {
  return clean(
    params.clientId ||
      process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID ||
      process.env.BRANDFETCH_CLIENT_ID,
  );
}

export function brandfetchLogoUrl(domain, params = {}) {
  const normalizedDomain = normalizeBrandDomain(domain);
  const clientId = brandfetchClientId(params);
  if (!normalizedDomain || !clientId) return "";

  const width = Number.isFinite(Number(params.width))
    ? Math.max(16, Math.min(512, Number(params.width)))
    : 128;
  const height = Number.isFinite(Number(params.height))
    ? Math.max(16, Math.min(512, Number(params.height)))
    : 128;
  const type = ["icon", "symbol", "logo"].includes(params.type)
    ? params.type
    : "icon";
  const theme = ["light", "dark"].includes(params.theme)
    ? `/theme/${params.theme}`
    : "";

  const url = new URL(
    `https://cdn.brandfetch.io/domain/${encodeURIComponent(normalizedDomain)}/w/${width}/h/${height}${theme}/${type}.png`,
  );
  url.searchParams.set("c", clientId);
  return url.toString();
}

export function brandAssetProxyUrl(domain, params = {}) {
  const normalizedDomain = normalizeBrandDomain(domain);
  if (!normalizedDomain) return "";

  const kind = params.kind === "logo" ? "logo" : "icon";
  const path = `/api/brand-assets/${kind}/${encodeURIComponent(normalizedDomain)}`;
  const siteUrl = clean(params.siteUrl || params.baseUrl);
  return siteUrl ? new URL(path, siteUrl).toString() : path;
}

export function detectKnownBrand(data = {}) {
  const explicit = normalizeBrandDomain(data.brandDomain);
  if (explicit) {
    return {
      name: clean(data.brandName),
      domain: explicit,
      source: "explicit",
    };
  }

  const title = clean(data.title);
  if (!title) return null;
  const tags = Array.isArray(data.tags) ? data.tags.map(normalizedText) : [];
  const candidates = KNOWN_BRANDS.flatMap((brand) =>
    brand.aliases.map((alias) => ({
      brand,
      alias,
      length: normalizedText(alias).length,
    })),
  ).sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    if (!textContainsAlias(title, candidate.alias)) continue;

    return {
      name: candidate.brand.name,
      domain: candidate.brand.domain,
      source: "known-brand",
      alias: candidate.alias,
    };
  }

  for (const candidate of candidates) {
    if (!tags.includes(normalizedText(candidate.alias))) continue;

    return {
      name: candidate.brand.name,
      domain: candidate.brand.domain,
      source: "known-brand",
      alias: candidate.alias,
    };
  }

  return null;
}

export function buildBrandAssetMetadata(data = {}, options = {}) {
  const explicitDomain = normalizeBrandDomain(data.brandDomain);
  const websiteDomain = options.allowWebsiteFallback
    ? domainFromUrl(data.websiteUrl)
    : "";
  const knownBrand = options.allowAliasFallback ? detectKnownBrand(data) : null;
  const brandDomain =
    explicitDomain || websiteDomain || knownBrand?.domain || "";
  const brandName =
    clean(data.brandName) ||
    knownBrand?.name ||
    (brandDomain ? clean(data.title) : "");
  const source =
    clean(data.brandAssetSource) || (brandDomain ? "brandfetch" : "");
  const brandIconUrl =
    clean(data.brandIconUrl) ||
    (source === "brandfetch"
      ? brandAssetProxyUrl(brandDomain, {
          kind: "icon",
          siteUrl: options.assetBaseUrl || options.siteUrl,
        })
      : "");
  const brandLogoUrl = clean(data.brandLogoUrl);
  const brandColors = normalizeBrandColors(data.brandColors);
  const hasBrandMetadata = Boolean(
    brandName ||
    brandDomain ||
    brandIconUrl ||
    brandLogoUrl ||
    source ||
    brandColors.length,
  );
  const brandVerifiedAt = hasBrandMetadata
    ? clean(data.brandVerifiedAt || data.verifiedAt)
    : "";

  return {
    brandName: brandName || undefined,
    brandDomain: brandDomain || undefined,
    brandIconUrl:
      brandIconUrl && isAllowedBrandAssetUrl(brandIconUrl)
        ? brandIconUrl
        : undefined,
    brandLogoUrl:
      brandLogoUrl && isAllowedBrandAssetUrl(brandLogoUrl)
        ? brandLogoUrl
        : undefined,
    brandAssetSource:
      source && BRAND_ASSET_SOURCES.includes(source) ? source : undefined,
    brandVerifiedAt: brandVerifiedAt || undefined,
    brandColors: brandColors.length ? brandColors : undefined,
  };
}
