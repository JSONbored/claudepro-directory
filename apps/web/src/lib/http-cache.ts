const CACHE_HEADERS = {
  "cache-control": "public, max-age=300, stale-while-revalidate=3600",
} as const;

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildEtag(body: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  return `"sha256-${toHex(digest).slice(0, 32)}"`;
}

function hasMatchingEtag(request: Request, etag: string) {
  const normalize = (value: string) => value.replace(/^W\//, "");
  const normalizedEtag = normalize(etag);
  return request.headers
    .get("if-none-match")
    ?.split(",")
    .map((value) => value.trim())
    .map(normalize)
    .includes(normalizedEtag);
}

export async function cachedJsonResponse(
  request: Request,
  payload: unknown,
  init: ResponseInit = {},
) {
  const body = `${JSON.stringify(payload)}\n`;
  const etag = await buildEtag(body);
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("etag", etag);
  for (const [name, value] of Object.entries(CACHE_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }

  if (hasMatchingEtag(request, etag)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { ...init, headers });
}

export async function cachedTextResponse(
  request: Request,
  text: string,
  init: ResponseInit = {},
) {
  const body = text.endsWith("\n") ? text : `${text}\n`;
  const etag = await buildEtag(body);
  const headers = new Headers(init.headers);
  headers.set("content-type", "text/plain; charset=utf-8");
  headers.set("etag", etag);
  for (const [name, value] of Object.entries(CACHE_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }

  if (hasMatchingEtag(request, etag)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { ...init, headers });
}
