const requiredPaths = [
  "/data/directory-index.json",
  "/data/search-index.json",
  "/data/raycast-index.json",
];

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) continue;
    args.set(value.slice(2), argv[index + 1] ?? "");
    index += 1;
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

async function fetchJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  return response.json();
}

function readEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.entries)) return payload.entries;
  return null;
}

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(
  args.get("base-url") || process.env.DEPLOYMENT_ARTIFACT_BASE_URL,
);

if (!baseUrl) {
  fail(
    "Missing --base-url or DEPLOYMENT_ARTIFACT_BASE_URL for deployment artifact validation.",
  );
  process.exit();
}

for (const pathname of requiredPaths) {
  try {
    const payload = await fetchJson(baseUrl, pathname);
    if (!payload || typeof payload !== "object") {
      fail(`${pathname} did not return a JSON object`);
      continue;
    }
    const entries = readEntries(payload);
    if (pathname === "/data/directory-index.json" && Array.isArray(entries)) {
      continue;
    }
    if (!payload || !Array.isArray(payload.entries)) {
      fail(`${pathname} must return an envelope with entries`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

try {
  const raycast = await fetchJson(baseUrl, "/data/raycast-index.json");
  const first = Array.isArray(raycast.entries) ? raycast.entries[0] : null;
  if (!first?.detailUrl) {
    fail("/data/raycast-index.json must expose detailUrl values");
  } else {
    const detail = await fetchJson(baseUrl, String(first.detailUrl));
    if (detail?.key !== `${first.category}:${first.slug}`) {
      fail(`${first.detailUrl} did not match the first Raycast entry`);
    }
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (!process.exitCode) {
  console.log(`Validated deployment artifacts at ${baseUrl}`);
}
