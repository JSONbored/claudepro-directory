const requiredPaths = [
  "/data/directory-index.json",
  "/data/search-index.json",
  "/data/raycast-index.json",
  "/data/feeds/index.json",
];
const indexNowKeyPath = "/48486ebc7ddc47af875118345161ae70.txt";
const requiredRenderedPaths = ["/sitemap.xml", "/robots.txt", "/api/jobs"];
const canonicalOrigin = "https://heyclau.de";

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

async function fetchText(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`);
  }
  return response.text();
}

function readEntries(payload) {
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
    if (pathname !== "/data/feeds/index.json" && !Array.isArray(entries)) {
      fail(`${pathname} must return an envelope with entries`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

for (const pathname of requiredRenderedPaths) {
  try {
    await fetchText(baseUrl, pathname);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

try {
  const key = (await fetchText(baseUrl, indexNowKeyPath)).trim();
  if (key !== "48486ebc7ddc47af875118345161ae70") {
    fail(`${indexNowKeyPath} did not return the expected IndexNow key`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

try {
  const directory = await fetchJson(baseUrl, "/data/directory-index.json");
  const search = await fetchJson(baseUrl, "/data/search-index.json");
  const directoryEntries = readEntries(directory);
  const searchEntries = readEntries(search);

  if (!directoryEntries?.length || !searchEntries?.length) {
    fail("/data directory and search artifacts must contain entries");
  } else if (directoryEntries.length !== searchEntries.length) {
    fail("/data directory and search artifact counts must match");
  } else {
    for (const entry of [directoryEntries[0], searchEntries[0]]) {
      for (const field of ["canonicalUrl", "llmsUrl", "apiUrl"]) {
        if (!String(entry?.[field] || "").startsWith(`${canonicalOrigin}/`)) {
          fail(`${field} must be an absolute URL in deployment artifacts`);
        }
      }
    }
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
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

try {
  const feeds = await fetchJson(baseUrl, "/data/feeds/index.json");
  const skillsFeed = feeds?.categories?.find(
    (item) => item?.category === "skills",
  )?.feedUrl;
  const claudeFeed = feeds?.platforms?.find(
    (item) => item?.platform === "Claude",
  )?.feedUrl;

  if (!skillsFeed || !claudeFeed) {
    fail("/data/feeds/index.json must expose skills and Claude feed links");
  } else {
    await fetchJson(baseUrl, skillsFeed);
    await fetchJson(baseUrl, claudeFeed);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

try {
  const jobs = await fetchJson(baseUrl, "/api/jobs");
  if (!jobs || typeof jobs !== "object") {
    fail("/api/jobs did not return a JSON object");
  }
  const jobEntries = Array.isArray(jobs.jobs)
    ? jobs.jobs
    : Array.isArray(jobs.entries)
      ? jobs.entries
      : null;
  if (!Array.isArray(jobEntries)) {
    fail("/api/jobs must return a jobs or entries array");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

try {
  const sitemap = await fetchText(baseUrl, "/sitemap.xml");
  if (!sitemap.includes(`${canonicalOrigin}/browse`)) {
    fail("/sitemap.xml must include canonical site URLs");
  }
  if (sitemap.includes("robotsIndex:false")) {
    fail("/sitemap.xml must not expose robotsIndex:false markers");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (!process.exitCode) {
  console.log(`Validated deployment artifacts at ${baseUrl}`);
}
