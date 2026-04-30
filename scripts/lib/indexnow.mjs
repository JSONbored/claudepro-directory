export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const DEFAULT_INDEXNOW_KEY = "48486ebc7ddc47af875118345161ae70";
export const DEFAULT_INDEXNOW_BASE_URL = "https://heyclau.de";

export function normalizeSiteUrl(value = DEFAULT_INDEXNOW_BASE_URL) {
  const parsed = new URL(value || DEFAULT_INDEXNOW_BASE_URL);
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export function hostFromSiteUrl(siteUrl = DEFAULT_INDEXNOW_BASE_URL) {
  return new URL(normalizeSiteUrl(siteUrl)).host;
}

export function isProductionIndexNowHost(host) {
  return String(host || "").toLowerCase() === "heyclau.de";
}

export function keyLocationFor(siteUrl, key = DEFAULT_INDEXNOW_KEY) {
  return `${normalizeSiteUrl(siteUrl)}/${encodeURIComponent(key)}.txt`;
}

export function extractSitemapUrls(xml) {
  return [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1]?.trim())
    .filter(Boolean);
}

export function normalizeSubmittedUrls(urls, host) {
  const seen = new Set();
  const normalized = [];

  for (const value of urls) {
    try {
      const parsed = new URL(String(value || "").trim());
      if (parsed.protocol !== "https:") continue;
      if (parsed.host !== host) continue;
      parsed.hash = "";
      const url = parsed.toString();
      if (seen.has(url)) continue;
      seen.add(url);
      normalized.push(url);
    } catch {
      // Invalid submitted URLs are ignored instead of poisoning the batch.
    }
  }

  return normalized;
}

export function chunkUrls(urls, batchSize = 1000) {
  const chunks = [];
  for (let index = 0; index < urls.length; index += batchSize) {
    chunks.push(urls.slice(index, index + batchSize));
  }
  return chunks;
}

export function buildIndexNowPayload(params) {
  const host = String(params.host || "").trim();
  const key = String(params.key || "").trim();
  const keyLocation = String(params.keyLocation || "").trim();
  const urlList = Array.isArray(params.urlList) ? params.urlList : [];

  if (!host) throw new Error("IndexNow host is required.");
  if (!/^[a-f0-9]{32}$/i.test(key)) {
    throw new Error("IndexNow key must be a 32-character hex string.");
  }
  if (!keyLocation.startsWith("https://")) {
    throw new Error("IndexNow keyLocation must be an HTTPS URL.");
  }
  if (!urlList.length) throw new Error("IndexNow urlList cannot be empty.");

  return {
    host,
    key,
    keyLocation,
    urlList,
  };
}
