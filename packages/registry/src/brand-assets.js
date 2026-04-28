export const BRAND_ASSET_SOURCES = [
  "brandfetch",
  "manual",
  "website",
  "github",
  "none",
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

export function buildBrandAssetMetadata(data = {}, options = {}) {
  const explicitDomain = normalizeBrandDomain(data.brandDomain);
  const websiteDomain = options.allowWebsiteFallback
    ? domainFromUrl(data.websiteUrl)
    : "";
  const brandDomain = explicitDomain || websiteDomain;
  const brandName =
    clean(data.brandName) || (brandDomain ? clean(data.title) : "");
  const source =
    clean(data.brandAssetSource) || (brandDomain ? "brandfetch" : "");
  const brandIconUrl =
    clean(data.brandIconUrl) ||
    (source === "brandfetch"
      ? brandfetchLogoUrl(brandDomain, {
          clientId: options.clientId,
          width: 128,
          height: 128,
          type: "icon",
        })
      : "");
  const brandLogoUrl =
    clean(data.brandLogoUrl) ||
    (source === "brandfetch"
      ? brandfetchLogoUrl(brandDomain, {
          clientId: options.clientId,
          width: 360,
          height: 160,
          type: "logo",
        })
      : "");
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
