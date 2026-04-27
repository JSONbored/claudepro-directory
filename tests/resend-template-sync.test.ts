import { describe, expect, it, vi } from "vitest";

import type { RenderedEmailTemplate } from "../emails/src/render";
import {
  buildResendTemplatePayload,
  buildResendTemplateSyncOperations,
  extractTemplateVariables,
  syncRenderedEmailTemplates,
} from "../scripts/lib/resend-templates";

const renderedTemplates: RenderedEmailTemplate[] = [
  {
    name: "curated-drop-digest",
    subject: "New HeyClaude picks: {{TOPIC}}",
    html: '<p>{{INTRO}}</p><a href="{{FEATURED_URL}}">Open</a>{{RESEND_UNSUBSCRIBE}}',
    text: "{{INTRO}}\n{{FEATURED_URL}}\n{{RESEND_UNSUBSCRIBE}}\n",
  },
  {
    name: "release-notes",
    subject: "HeyClaude registry update: {{VERSION_OR_DATE}}",
    html: "<p>{{SUMMARY}}</p>{{CHANGELOG_URL}}",
    text: "{{SUMMARY}}\n{{CHANGELOG_URL}}\n",
  },
  {
    name: "maintainer-call",
    subject: "Help review new HeyClaude submissions",
    html: "<p>{{QUEUE_THEME}}</p>{{QUEUE_URL}}",
    text: "{{QUEUE_THEME}}\n{{QUEUE_URL}}\n",
  },
];

describe("Resend template sync", () => {
  it("defaults to dry-run operations without requiring an API key", async () => {
    const fetchImpl = vi.fn();
    const summary = await syncRenderedEmailTemplates({
      templates: renderedTemplates,
      dryRun: true,
      env: {},
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(summary.dryRun).toBe(true);
    expect(summary.results).toEqual([
      expect.objectContaining({
        templateName: "curated-drop-digest",
        action: "create",
        endpoint: "/templates",
        status: "dry-run",
      }),
      expect.objectContaining({
        templateName: "release-notes",
        action: "create",
        endpoint: "/templates",
        status: "dry-run",
      }),
      expect.objectContaining({
        templateName: "maintainer-call",
        action: "create",
        endpoint: "/templates",
        status: "dry-run",
      }),
    ]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails apply mode clearly when RESEND_API_KEY is missing", async () => {
    await expect(
      syncRenderedEmailTemplates({
        templates: renderedTemplates,
        dryRun: false,
        env: {},
      }),
    ).rejects.toThrow("RESEND_API_KEY is required");
  });

  it("builds create and update payloads with aliases, text, subject, and variables", () => {
    const operations = buildResendTemplateSyncOperations(renderedTemplates, {
      RESEND_TEMPLATE_RELEASE_NOTES_ID: "tmpl_release",
      RESEND_TEMPLATE_CURATED_DROP_ALIAS: "curated-from-env",
    });

    expect(operations[0]).toMatchObject({
      templateName: "curated-drop-digest",
      action: "create",
      method: "POST",
      endpoint: "/templates",
      payload: {
        name: "HeyClaude Curated Drop Digest",
        alias: "curated-from-env",
        subject: "New HeyClaude picks: {{TOPIC}}",
        text: expect.stringContaining("{{FEATURED_URL}}"),
      },
    });
    expect(operations[0]?.payload.variables).toEqual(
      expect.arrayContaining([
        { key: "FEATURED_URL", type: "string" },
        { key: "INTRO", type: "string" },
        { key: "RESEND_UNSUBSCRIBE", type: "string" },
        { key: "TOPIC", type: "string" },
      ]),
    );
    expect(operations[1]).toMatchObject({
      templateName: "release-notes",
      action: "update",
      method: "PATCH",
      endpoint: "/templates/tmpl_release",
      payload: {
        alias: "heyclaude-release-notes",
        subject: "HeyClaude registry update: {{VERSION_OR_DATE}}",
      },
    });
  });

  it("only calls Resend template endpoints in apply mode", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "tmpl_123", object: "template" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );

    const summary = await syncRenderedEmailTemplates({
      templates: renderedTemplates,
      dryRun: false,
      env: {
        RESEND_API_KEY: "re_test",
        RESEND_TEMPLATE_RELEASE_NOTES_ID: "tmpl_release",
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(summary.dryRun).toBe(false);
    expect(summary.results).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    for (const [url, init] of fetchImpl.mock.calls) {
      expect(String(url)).toMatch(/^https:\/\/api\.resend\.com\/templates/);
      expect(String(url)).not.toContain("/emails");
      expect(String(url)).not.toContain("/broadcasts");
      expect(["POST", "PATCH"]).toContain(init?.method);
      const payload = JSON.parse(String(init?.body));
      expect(payload).toMatchObject({
        html: expect.any(String),
        text: expect.any(String),
        subject: expect.any(String),
        alias: expect.any(String),
        variables: expect.any(Array),
      });
    }
  });

  it("rejects reserved Resend variable names before syncing", () => {
    expect(() => extractTemplateVariables("Hello {{EMAIL}}")).toThrow(
      "reserved",
    );
    expect(() =>
      buildResendTemplatePayload({
        name: "release-notes",
        subject: "Hello",
        html: "<p>{{RESEND_UNSUBSCRIBE_URL}}</p>",
        text: "Hello",
      }),
    ).toThrow("reserved");
  });
});
