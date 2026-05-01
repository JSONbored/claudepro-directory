"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Copy,
  FileJson2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import {
  type McpConfigValidation,
  validateMcpConfigText,
} from "@/lib/mcp-config-validator";

const sampleConfig = `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}`;

export function McpConfigValidatorClient() {
  const [configText, setConfigText] = useState(sampleConfig);
  const [result, setResult] = useState<McpConfigValidation>(() =>
    validateMcpConfigText(sampleConfig),
  );
  const [copied, setCopied] = useState<string | null>(null);
  const { pushToast } = useToast();
  const verdict = useMemo(() => {
    if (result.ok) {
      return {
        icon: CheckCircle2,
        label: "Config passes",
        className: "border-primary/40 bg-primary/10 text-primary",
      };
    }
    return {
      icon: XCircle,
      label: "Config blocked",
      className: "border-destructive/50 bg-destructive/10 text-destructive",
    };
  }, [result.ok]);

  const validate = () => {
    setResult(validateMcpConfigText(configText));
  };

  const copyValue = async (key: string, value: string, label: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1400);
      pushToast({
        variant: "success",
        title: "Copied to clipboard",
        description: label,
      });
    } catch {
      pushToast({
        variant: "error",
        title: "Copy failed",
        description: "Clipboard access was blocked by the browser.",
      });
    }
  };

  const VerdictIcon = verdict.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="submit-form-card">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
            <FileJson2 className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Paste MCP JSON
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Checks run in the browser. Secret-like environment values are
              redacted before any report or fixed snippet is copied.
            </p>
          </div>
        </div>

        <textarea
          value={configText}
          onChange={(event) => setConfigText(event.target.value)}
          spellCheck={false}
          className="min-h-[24rem] w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-sm leading-6 text-foreground outline-none transition focus:border-primary/60"
          aria-label="MCP configuration JSON"
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={validate} className="rounded-xl">
            Validate config
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() =>
              copyValue("fixed", result.fixedConfigText, "Fixed MCP config")
            }
            disabled={!result.fixedConfigText}
          >
            {copied === "fixed" ? (
              <CheckCircle2 className="mr-2 size-4 text-primary" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            Copy fixed snippet
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() =>
              copyValue("report", result.reportText, "MCP validation report")
            }
          >
            {copied === "report" ? (
              <CheckCircle2 className="mr-2 size-4 text-primary" />
            ) : (
              <Clipboard className="mr-2 size-4" />
            )}
            Copy report
          </Button>
        </div>

        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${verdict.className}`}
        >
          <VerdictIcon className="size-4" />
          <span>{verdict.label}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Servers", result.servers.length],
            ["Errors", result.errors.length],
            ["Warnings", result.warnings.length],
            ["Secrets redacted", result.redactedSecretCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>

        <ResultList title="Required fixes" items={result.errors} tone="error" />
        <ResultList title="Warnings" items={result.warnings} tone="warning" />
      </section>

      <aside className="surface-panel h-fit p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Server summary
        </p>
        <div className="mt-4 space-y-3">
          {result.servers.length ? (
            result.servers.map((server) => (
              <div
                key={server.name}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{server.name}</p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {server.transport}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {server.packageName ||
                    server.url ||
                    server.command ||
                    "No target"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Env keys: {server.envKeys.length || "none"}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              No valid server blocks found yet.
            </div>
          )}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs leading-6 text-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            This validator is for review and troubleshooting. It never installs
            packages, stores credentials, or edits local MCP files.
          </span>
        </div>
      </aside>
    </div>
  );
}

function ResultList(props: {
  title: string;
  items: string[];
  tone: "error" | "warning";
}) {
  if (!props.items.length) return null;

  const toneClass =
    props.tone === "error"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-chart-4/45 bg-chart-4/10 text-foreground";
  const Icon = props.tone === "error" ? XCircle : AlertTriangle;

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {props.title}
      </p>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
