type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function pickRequestMeta(request: Request) {
  const url = new URL(request.url);
  return {
    method: request.method,
    path: url.pathname,
    query: url.search ? "present" : "none",
    cfRay: request.headers.get("cf-ray") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

function writeLog(level: LogLevel, event: string, meta: LogMeta) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function logApiInfo(
  request: Request,
  event: string,
  meta: LogMeta = {},
) {
  writeLog("info", event, { ...pickRequestMeta(request), ...meta });
}

export function logApiWarn(
  request: Request,
  event: string,
  meta: LogMeta = {},
) {
  writeLog("warn", event, { ...pickRequestMeta(request), ...meta });
}

export function logApiError(
  request: Request,
  event: string,
  meta: LogMeta = {},
) {
  writeLog("error", event, { ...pickRequestMeta(request), ...meta });
}

export function sample(rate: number) {
  return Math.random() < rate;
}

export function redactEmail(value: string) {
  const email = String(value || "")
    .trim()
    .toLowerCase();
  const [local, domain] = email.split("@");
  if (!local || !domain) return "invalid";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
