export type McpConfigServerReport = {
  name: string;
  transport: "stdio" | "remote" | "unknown";
  command?: string;
  url?: string;
  packageName?: string;
  envKeys: string[];
  errors: string[];
  warnings: string[];
};

export type McpConfigValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  servers: McpConfigServerReport[];
  fixedConfigText: string;
  reportText: string;
  redactedSecretCount: number;
};

const SENSITIVE_ENV_PATTERN =
  /(api[_-]?key|auth|bearer|client[_-]?secret|credential|password|private[_-]?key|secret|token)/i;
const PLACEHOLDER_PATTERN =
  /(\$\{[A-Z0-9_]+\}|YOUR_|REPLACE_|INSERT_|<[^>]+>|\bxxx+\b|\bTODO\b)/i;
const SHELL_OPERATOR_PATTERN = /(?:&&|\|\||[;|`<>]|\$\()/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeServerName(value: string) {
  return value.trim();
}

function redactEnvValue(key: string, value: unknown) {
  const normalized = String(value ?? "");
  if (!SENSITIVE_ENV_PATTERN.test(key)) return normalized;
  if (!normalized || PLACEHOLDER_PATTERN.test(normalized)) return normalized;
  return `\${${key.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}}`;
}

function packageFromNpxArgs(args: string[]) {
  const stopAt = args.indexOf("--");
  const candidates = (stopAt >= 0 ? args.slice(0, stopAt) : args).filter(
    (arg) => arg && !arg.startsWith("-"),
  );
  return candidates[0] || "";
}

function packageFromRunner(command: string, args: string[]) {
  const lower = command.toLowerCase();
  if (lower.endsWith("npx") || lower === "npx") return packageFromNpxArgs(args);
  if (["uvx", "bunx"].includes(lower)) {
    return args.find((arg) => arg && !arg.startsWith("-")) || "";
  }
  if (lower === "pnpm" || lower === "yarn") {
    const runnerIndex = args.findIndex((arg) => arg === "dlx");
    const candidates = (
      runnerIndex >= 0 ? args.slice(runnerIndex + 1) : args
    ).filter((arg) => arg && !arg.startsWith("-"));
    return candidates[0] || "";
  }
  if (lower === "npm") {
    const runnerIndex = args.findIndex((arg) => ["exec", "x"].includes(arg));
    const scopedArgs = runnerIndex >= 0 ? args.slice(runnerIndex + 1) : args;
    const separatorIndex = scopedArgs.indexOf("--");
    const candidates = (
      separatorIndex >= 0 ? scopedArgs.slice(separatorIndex + 1) : scopedArgs
    ).filter((arg) => arg && !arg.startsWith("-"));
    return candidates[0] || "";
  }
  if (lower === "docker") {
    const imageIndex = args.findIndex((arg) => arg === "run");
    if (imageIndex >= 0) {
      return (
        args.slice(imageIndex + 1).find((arg) => arg && !arg.startsWith("-")) ||
        ""
      );
    }
  }
  return "";
}

function extractServers(payload: unknown) {
  if (!isRecord(payload)) {
    return { servers: {}, rootError: "Config must be a JSON object." };
  }
  if (isRecord(payload.mcpServers)) {
    return { servers: payload.mcpServers, wrapped: false };
  }
  const directServerShape = Object.values(payload).every(
    (value) => isRecord(value) && ("command" in value || "url" in value),
  );
  if (directServerShape) return { servers: payload, wrapped: true };
  return {
    servers: {},
    rootError: "Config must include an mcpServers object.",
  };
}

function validateServer(name: string, raw: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedName = normalizeServerName(name);

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(normalizedName)) {
    errors.push(
      "Server name must be 1-64 characters of letters, numbers, dot, underscore, or dash.",
    );
  }
  if (!isRecord(raw)) {
    return {
      name: normalizedName || name,
      transport: "unknown" as const,
      envKeys: [],
      errors: ["Server config must be an object."],
      warnings,
      sanitized: {},
      redactedSecretCount: 0,
    };
  }

  const hasCommand = "command" in raw;
  const command = typeof raw.command === "string" ? raw.command.trim() : "";
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const args = asStringArray(raw.args);
  const env = isRecord(raw.env) ? raw.env : {};
  const envKeys = Object.keys(env).sort();
  const sanitizedEnv = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      key,
      redactEnvValue(key, value),
    ]),
  );
  const redactedSecretCount = Object.entries(env).filter(
    ([key, value]) => String(value ?? "") !== String(sanitizedEnv[key] ?? ""),
  ).length;
  const sanitized = {
    ...raw,
    ...(command ? { command } : {}),
    ...(args.length ? { args } : {}),
    ...(envKeys.length ? { env: sanitizedEnv } : {}),
  };

  if (!command && !url) {
    errors.push(
      "Server must define command for stdio or url for remote transport.",
    );
  }
  if (hasCommand && typeof raw.command !== "string") {
    errors.push("command must be a string.");
  }
  if ("args" in raw && !Array.isArray(raw.args)) {
    errors.push("args must be an array of strings.");
  }
  if (
    "args" in raw &&
    Array.isArray(raw.args) &&
    args.length !== raw.args.length
  ) {
    errors.push("args must contain only strings.");
  }
  if ("env" in raw && !isRecord(raw.env)) {
    errors.push("env must be an object of environment variables.");
  }
  if (command && SHELL_OPERATOR_PATTERN.test(command)) {
    errors.push(
      "command must be an executable name/path, not a shell pipeline.",
    );
  }
  for (const arg of args) {
    if (SHELL_OPERATOR_PATTERN.test(arg)) {
      warnings.push(`Argument contains shell-like syntax: ${arg}`);
    }
  }
  if (command) {
    const packageName = packageFromRunner(command, args);
    if (
      ["npx", "uvx", "bunx"].includes(command.toLowerCase()) &&
      !packageName
    ) {
      errors.push(`${command} server is missing a package name in args.`);
    }
  }
  if (url) {
    try {
      const parsed = new URL(url);
      const isLocal =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "::1";
      if (
        parsed.protocol !== "https:" &&
        !(isLocal && parsed.protocol === "http:")
      ) {
        warnings.push(
          "Remote MCP URLs should use HTTPS unless they are localhost.",
        );
      }
    } catch {
      errors.push("url must be a valid URL.");
    }
  }
  for (const [key, value] of Object.entries(env)) {
    const normalizedValue = String(value ?? "");
    if (
      SENSITIVE_ENV_PATTERN.test(key) &&
      normalizedValue &&
      !PLACEHOLDER_PATTERN.test(normalizedValue)
    ) {
      warnings.push(`${key} looks secret-like and was redacted from output.`);
    }
    if (PLACEHOLDER_PATTERN.test(normalizedValue)) {
      warnings.push(`${key} is still a placeholder.`);
    }
  }

  return {
    name: normalizedName || name,
    transport: url
      ? ("remote" as const)
      : command
        ? ("stdio" as const)
        : ("unknown" as const),
    command,
    url,
    packageName: command ? packageFromRunner(command, args) : "",
    envKeys,
    errors,
    warnings: [...new Set(warnings)],
    sanitized,
    redactedSecretCount,
  };
}

function buildReportText(result: Omit<McpConfigValidation, "reportText">) {
  const lines = [
    `MCP config validation: ${result.ok ? "pass" : "blocked"}`,
    `Servers: ${result.servers.length}`,
    `Errors: ${result.errors.length}`,
    `Warnings: ${result.warnings.length}`,
    `Redacted secrets: ${result.redactedSecretCount}`,
  ];

  for (const server of result.servers) {
    lines.push(
      "",
      `## ${server.name}`,
      `Transport: ${server.transport}`,
      server.packageName ? `Package: ${server.packageName}` : "",
      server.url ? `URL: ${server.url}` : "",
      server.envKeys.length
        ? `Env keys: ${server.envKeys.join(", ")}`
        : "Env keys: none",
    );
    for (const error of server.errors) lines.push(`- Error: ${error}`);
    for (const warning of server.warnings) lines.push(`- Warning: ${warning}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function validateMcpConfigText(input: string): McpConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedInput = String(input || "").trim();

  if (!normalizedInput) {
    errors.push("Paste a JSON MCP configuration.");
    const result = {
      ok: false,
      errors,
      warnings,
      servers: [],
      fixedConfigText: "",
      redactedSecretCount: 0,
    };
    return { ...result, reportText: buildReportText(result) };
  }
  if (normalizedInput.length > 100_000) {
    errors.push("Config is too large for browser-side validation.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedInput);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? `Invalid JSON: ${error.message}`
        : "Invalid JSON.",
    );
    const result = {
      ok: false,
      errors,
      warnings,
      servers: [],
      fixedConfigText: "",
      redactedSecretCount: 0,
    };
    return { ...result, reportText: buildReportText(result) };
  }

  const extracted = extractServers(parsed);
  if (extracted.rootError) errors.push(extracted.rootError);
  if (extracted.wrapped) {
    warnings.push(
      "Input looked like a bare servers object; output wraps it in mcpServers.",
    );
  }

  const reports = Object.entries(extracted.servers).map(([name, value]) =>
    validateServer(name, value),
  );
  const redactedSecretCount = reports.reduce(
    (count, report) => count + report.redactedSecretCount,
    0,
  );
  const sanitizedConfig = {
    ...(isRecord(parsed) && !extracted.wrapped ? parsed : {}),
    mcpServers: Object.fromEntries(
      reports.map((report) => [report.name, report.sanitized]),
    ),
  };

  for (const report of reports) {
    errors.push(...report.errors.map((error) => `${report.name}: ${error}`));
    warnings.push(
      ...report.warnings.map((warning) => `${report.name}: ${warning}`),
    );
  }

  const result = {
    ok: errors.length === 0,
    errors,
    warnings,
    servers: reports.map(({ sanitized: _sanitized, ...report }) => report),
    fixedConfigText: reports.length
      ? JSON.stringify(sanitizedConfig, null, 2)
      : "",
    redactedSecretCount,
  };
  return { ...result, reportText: buildReportText(result) };
}
