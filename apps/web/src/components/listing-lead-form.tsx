"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Mail } from "lucide-react";

import { siteConfig } from "@/lib/site";

type ListingLeadKind = "job" | "tool" | "claim";
type ListingLeadFormProps = {
  kind: ListingLeadKind;
  tier?: "free" | "standard" | "featured" | "sponsored";
};

function getApiErrorMessage(payload: {
  error?: string | { code?: string; message?: string; details?: unknown };
  errors?: string[];
}) {
  if (payload.errors?.length) return payload.errors.join(", ");
  if (typeof payload.error === "string") return payload.error;
  if (payload.error?.message) return payload.error.message;
  if (payload.error?.code) return payload.error.code;
  return "";
}

const labels = {
  job: {
    eyebrow: "Hiring lead",
    title: "Role title",
    titlePlaceholder: "Senior Claude/MCP Engineer",
    websiteLabel: "Company URL",
    websitePlaceholder: "https://company.com",
    applyLabel: "Apply URL",
    applyPlaceholder: "https://company.com/careers/role",
    messageLabel: "Role details",
    messagePlaceholder:
      "Location, employment type, compensation, responsibilities, requirements, preferred launch date.",
    submit: "Send job lead",
    subject: "HeyClaude job listing lead",
  },
  tool: {
    eyebrow: "Tool listing lead",
    title: "Tool, app, or service name",
    titlePlaceholder: "Example MCP Analytics",
    websiteLabel: "Product URL",
    websitePlaceholder: "https://product.com",
    applyLabel: "Docs or demo URL",
    applyPlaceholder: "https://product.com/docs",
    messageLabel: "Listing details",
    messagePlaceholder:
      "What it does, who it is for, pricing model, affiliate/referral details, and preferred placement.",
    submit: "Send listing lead",
    subject: "HeyClaude tool/app listing lead",
  },
  claim: {
    eyebrow: "Claim/update lead",
    title: "Listing or profile name",
    titlePlaceholder: "Example MCP Server",
    websiteLabel: "Canonical URL",
    websitePlaceholder: "https://example.com",
    applyLabel: "Existing HeyClaude URL",
    applyPlaceholder: "https://heyclau.de/mcp/example",
    messageLabel: "Requested update",
    messagePlaceholder:
      "Which listing you own, what should change, and what source proves the change.",
    submit: "Send claim/update lead",
    subject: "HeyClaude claim/update listing lead",
  },
} as const;

export function ListingLeadForm({ kind, tier = "free" }: ListingLeadFormProps) {
  const copy = labels[kind];
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    companyName: "",
    listingTitle: "",
    websiteUrl: "",
    applyUrl: "",
    message: "",
  });

  const emailHref = useMemo(() => {
    const body = [
      `Intent: ${kind}`,
      `Tier interest: ${tier}`,
      "",
      `Contact name: ${form.contactName}`,
      `Contact email: ${form.contactEmail}`,
      `Company: ${form.companyName}`,
      `Listing title: ${form.listingTitle}`,
      `Website URL: ${form.websiteUrl}`,
      kind === "job"
        ? `Apply URL: ${form.applyUrl}`
        : `Docs/demo URL: ${form.applyUrl}`,
      "",
      form.message,
    ].join("\n");

    return `mailto:${siteConfig.jobsEmail}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
  }, [copy.subject, form, kind, tier]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      const response = await fetch("/api/listing-leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, tierInterest: tier, ...form }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string | { code?: string; message?: string; details?: unknown };
        errors?: string[];
      };
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload) || "Could not submit lead");
      }
      setState("success");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not submit lead",
      );
      setState("error");
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50";

  return (
    <form onSubmit={onSubmit} className="surface-panel space-y-4 p-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          {copy.eyebrow}
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          This creates a maintainer-review lead. Payment, sponsorship, and
          launch timing are handled after review.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Contact name
          <input
            className={fieldClass}
            value={form.contactName}
            onChange={(event) => updateField("contactName", event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Contact email
          <input
            className={fieldClass}
            type="email"
            value={form.contactEmail}
            onChange={(event) =>
              updateField("contactEmail", event.target.value)
            }
            required
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          Company or maker
          <input
            className={fieldClass}
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          {copy.title}
          <input
            className={fieldClass}
            value={form.listingTitle}
            onChange={(event) =>
              updateField("listingTitle", event.target.value)
            }
            placeholder={copy.titlePlaceholder}
            required
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          {copy.websiteLabel}
          <input
            className={fieldClass}
            type="url"
            value={form.websiteUrl}
            onChange={(event) => updateField("websiteUrl", event.target.value)}
            placeholder={copy.websitePlaceholder}
            required={kind === "tool"}
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          {copy.applyLabel}
          <input
            className={fieldClass}
            type="url"
            value={form.applyUrl}
            onChange={(event) => updateField("applyUrl", event.target.value)}
            placeholder={copy.applyPlaceholder}
            required={kind === "job"}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-foreground">
        {copy.messageLabel}
        <textarea
          className={`${fieldClass} min-h-32 resize-y`}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder={copy.messagePlaceholder}
        />
      </label>

      {state === "success" ? (
        <p className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm text-foreground">
          Lead received. We will review it before publishing or sending payment
          steps.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex items-center rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowUpRight className="mr-1.5 size-4" />
          {state === "submitting" ? "Sending..." : copy.submit}
        </button>
        <a
          href={emailHref}
          className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary/40"
        >
          <Mail className="mr-1.5 size-4" />
          Email instead
        </a>
      </div>
    </form>
  );
}
