"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileArchive,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import { GitHubMark } from "@/components/icons/github-mark";
import {
  type SkillPackageFile,
  type SkillPackageValidation,
  validateSkillPackageFiles,
} from "@/lib/skill-package-validator";
import { siteConfig } from "@/lib/site";

type ValidatorState =
  | { status: "idle" }
  | { status: "reading" }
  | {
      status: "ready";
      fileName: string;
      checksum: string;
      result: SkillPackageValidation;
    }
  | { status: "error"; message: string };

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function isLikelyText(path: string) {
  return /\.(md|mdc|txt|json|ya?ml|toml|js|ts|tsx|py|sh|rb|go|rs)$/i.test(path);
}

export function SkillValidatorClient() {
  const [state, setState] = useState<ValidatorState>({ status: "idle" });
  const [copied, setCopied] = useState(false);
  const facts = state.status === "ready" ? state.result.facts : [];
  const verdict = useMemo(() => {
    if (state.status !== "ready") return null;
    if (state.result.ok) {
      return {
        icon: CheckCircle2,
        label: "Package passes",
        className: "border-primary/40 bg-primary/10 text-primary",
      };
    }
    return {
      icon: XCircle,
      label: "Package blocked",
      className: "border-destructive/50 bg-destructive/10 text-destructive",
    };
  }, [state]);

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      setState({ status: "error", message: "Upload a .zip skill package." });
      return;
    }
    if (file.size > 8_000_000) {
      setState({
        status: "error",
        message: "Package is too large for browser-side validation.",
      });
      return;
    }

    setState({ status: "reading" });
    try {
      const buffer = await file.arrayBuffer();
      const [{ unzipSync, strFromU8 }, checksum] = await Promise.all([
        import("fflate"),
        crypto.subtle.digest("SHA-256", buffer).then(toHex),
      ]);
      const unzipped = unzipSync(new Uint8Array(buffer));
      const files: SkillPackageFile[] = Object.entries(unzipped)
        .filter(([filePath]) => !filePath.endsWith("/"))
        .map(([filePath, bytes]) => ({
          path: filePath,
          size: bytes.byteLength,
          text: isLikelyText(filePath) ? strFromU8(bytes) : undefined,
        }));

      setState({
        status: "ready",
        fileName: file.name,
        checksum,
        result: validateSkillPackageFiles({
          files,
          githubUrl: siteConfig.githubUrl,
          siteUrl: siteConfig.url,
          packageSha256: checksum,
        }),
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not read this package.",
      });
    }
  }

  async function copySubmissionDraft() {
    if (state.status !== "ready") return;
    try {
      await navigator.clipboard.writeText(state.result.issueBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="submit-form-card">
        <div className="flex items-start gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
            <FileArchive className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Validate an Agent Skill zip
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Runs locally in your browser and checks the package before you
              submit it for review.
            </p>
          </div>
        </div>

        <label
          htmlFor="skill-package-upload"
          className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-6 py-8 text-center transition hover:border-primary/60"
        >
          <Upload className="size-8 text-muted-foreground" />
          <span className="mt-3 text-sm font-medium text-foreground">
            Upload .zip package
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Max 8 MB. Package contents are not uploaded.
          </span>
          <input
            id="skill-package-upload"
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={(event) => onFileSelected(event.target.files?.[0])}
          />
        </label>

        {state.status === "reading" ? (
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            Reading package...
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.message}
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div className="space-y-4">
            {verdict ? (
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${verdict.className}`}
              >
                <verdict.icon className="size-4" />
                <span>{verdict.label}</span>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                SHA256
              </p>
              <code className="mt-2 block break-all font-mono text-xs text-foreground">
                {state.checksum}
              </code>
            </div>

            {state.result.errors.length ? (
              <ResultList
                icon={XCircle}
                title="Required fixes"
                items={state.result.errors}
                tone="error"
              />
            ) : null}

            {state.result.warnings.length ? (
              <ResultList
                icon={AlertTriangle}
                title="Warnings"
                items={state.result.warnings}
                tone="warning"
              />
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="surface-panel h-fit p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Submit
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Review-ready packages
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Valid packages can continue into the normal HeyClaude skill submission
          flow with the package metadata already filled in. Maintainers still
          review before anything is published.
        </p>
        {state.status === "ready" ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                File
              </p>
              <p className="mt-1 truncate text-foreground">{state.fileName}</p>
            </div>
            <a
              href={state.result.submissionUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                state.result.ok
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "cursor-not-allowed border border-border bg-background text-muted-foreground"
              }`}
              aria-disabled={!state.result.ok}
              onClick={(event) => {
                if (!state.result.ok) event.preventDefault();
              }}
            >
              <ExternalLink className="size-4" />
              Continue in submit flow
            </a>
            <a
              href={state.result.issueUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50 ${
                state.result.ok ? "" : "pointer-events-none opacity-50"
              }`}
              aria-disabled={!state.result.ok}
            >
              <GitHubMark className="size-4" />
              Open GitHub fallback
            </a>
            <button
              type="button"
              onClick={copySubmissionDraft}
              disabled={!state.result.ok}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50 disabled:pointer-events-none disabled:opacity-50"
            >
              {copied ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Copy className="size-4" />
              )}
              Copy submission draft
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            Upload a package to generate the submission link.
          </div>
        )}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs leading-6 text-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            HeyClaude uses the same package shape for Claude, Codex, Windsurf,
            Gemini, Cursor adapters, and generic AGENTS context. The generated
            draft uses the canonical skills submission schema.
          </span>
        </div>
      </aside>
    </div>
  );
}

function ResultList(props: {
  icon: typeof XCircle;
  title: string;
  items: string[];
  tone: "error" | "warning";
}) {
  const Icon = props.icon;
  const toneClass =
    props.tone === "error"
      ? "border-destructive/50 bg-destructive/10 text-destructive"
      : "border-chart-4/45 bg-chart-4/10 text-foreground";

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
