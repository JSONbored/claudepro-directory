import type { RenderedEmailTemplate } from "../../emails/src/render";

export const RESEND_API_BASE_URL = "https://api.resend.com";

export const resendTemplateConfig = {
  "curated-drop-digest": {
    displayName: "HeyClaude Curated Drop Digest",
    idEnvName: "RESEND_TEMPLATE_CURATED_DROP_ID",
    aliasEnvName: "RESEND_TEMPLATE_CURATED_DROP_ALIAS",
    defaultAlias: "heyclaude-curated-drop-digest",
  },
  "release-notes": {
    displayName: "HeyClaude Release Notes",
    idEnvName: "RESEND_TEMPLATE_RELEASE_NOTES_ID",
    aliasEnvName: "RESEND_TEMPLATE_RELEASE_NOTES_ALIAS",
    defaultAlias: "heyclaude-release-notes",
  },
  "relaunch-brief": {
    displayName: "HeyClaude Relaunch Brief",
    idEnvName: "RESEND_TEMPLATE_RELAUNCH_BRIEF_ID",
    aliasEnvName: "RESEND_TEMPLATE_RELAUNCH_BRIEF_ALIAS",
    defaultAlias: "heyclaude-relaunch-brief",
  },
  "maintainer-call": {
    displayName: "HeyClaude Maintainer Call",
    idEnvName: "RESEND_TEMPLATE_MAINTAINER_CALL_ID",
    aliasEnvName: "RESEND_TEMPLATE_MAINTAINER_CALL_ALIAS",
    defaultAlias: "heyclaude-maintainer-call",
  },
} as const;

const reservedTemplateVariables = new Set([
  "FIRST_NAME",
  "LAST_NAME",
  "EMAIL",
  "RESEND_UNSUBSCRIBE_URL",
  "contact",
  "this",
]);

export type ResendTemplateVariable = {
  key: string;
  type: "string";
};

export type ResendTemplatePayload = {
  name: string;
  alias: string;
  subject: string;
  html: string;
  text: string;
  variables: ResendTemplateVariable[];
};

export type ResendTemplateSyncOperation = {
  templateName: string;
  action: "create" | "update";
  method: "POST" | "PATCH";
  endpoint: string;
  idEnvName: string;
  aliasEnvName: string;
  templateId: string | null;
  payload: ResendTemplatePayload;
};

export type ResendTemplateSyncResult = {
  templateName: string;
  action: "create" | "update";
  endpoint: string;
  status: "dry-run" | "synced";
  resendId?: string;
};

export type ResendTemplateSyncSummary = {
  dryRun: boolean;
  results: ResendTemplateSyncResult[];
};

type TemplateEnv = Record<string, string | undefined>;

function envString(env: TemplateEnv, key: string) {
  const value = env[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function extractTemplateVariables(
  ...values: Array<string | undefined>
): ResendTemplateVariable[] {
  const variables = new Set<string>();
  const matcher = /{{{?\s*([A-Za-z_][A-Za-z0-9_]*)\s*}?}}/g;

  for (const value of values) {
    if (!value) continue;
    for (const match of value.matchAll(matcher)) {
      const key = match[1];
      if (reservedTemplateVariables.has(key)) {
        throw new Error(
          `Resend template variable "${key}" is reserved and cannot be synced.`,
        );
      }
      variables.add(key);
    }
  }

  return [...variables]
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({ key, type: "string" as const }));
}

export function buildResendTemplatePayload(
  template: RenderedEmailTemplate,
  env: TemplateEnv = process.env,
): ResendTemplatePayload {
  const config =
    resendTemplateConfig[template.name as keyof typeof resendTemplateConfig];
  if (!config) {
    throw new Error(`No Resend template config for ${template.name}`);
  }

  return {
    name: config.displayName,
    alias: envString(env, config.aliasEnvName) || config.defaultAlias,
    subject: template.subject,
    html: template.html,
    text: template.text,
    variables: extractTemplateVariables(
      template.subject,
      template.html,
      template.text,
    ),
  };
}

export function buildResendTemplateSyncOperations(
  templates: RenderedEmailTemplate[],
  env: TemplateEnv = process.env,
): ResendTemplateSyncOperation[] {
  return templates.map((template) => {
    const config =
      resendTemplateConfig[template.name as keyof typeof resendTemplateConfig];
    if (!config) {
      throw new Error(`No Resend template config for ${template.name}`);
    }

    const templateId = envString(env, config.idEnvName);
    return {
      templateName: template.name,
      action: templateId ? "update" : "create",
      method: templateId ? "PATCH" : "POST",
      endpoint: templateId
        ? `/templates/${encodeURIComponent(templateId)}`
        : "/templates",
      idEnvName: config.idEnvName,
      aliasEnvName: config.aliasEnvName,
      templateId: templateId || null,
      payload: buildResendTemplatePayload(template, env),
    };
  });
}

export async function syncRenderedEmailTemplates(params: {
  templates: RenderedEmailTemplate[];
  dryRun?: boolean;
  env?: TemplateEnv;
  fetchImpl?: typeof fetch;
}): Promise<ResendTemplateSyncSummary> {
  const dryRun = params.dryRun !== false;
  const env = params.env ?? process.env;
  const operations = buildResendTemplateSyncOperations(params.templates, env);

  if (dryRun) {
    return {
      dryRun: true,
      results: operations.map((operation) => ({
        templateName: operation.templateName,
        action: operation.action,
        endpoint: operation.endpoint,
        status: "dry-run",
      })),
    };
  }

  const apiKey = envString(env, "RESEND_API_KEY");
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is required for --apply. Run without --apply for a dry run.",
    );
  }

  const fetchImpl = params.fetchImpl ?? fetch;
  const results: ResendTemplateSyncResult[] = [];

  for (const operation of operations) {
    const response = await fetchImpl(
      `${RESEND_API_BASE_URL}${operation.endpoint}`,
      {
        method: operation.method,
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(operation.payload),
      },
    );
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(
        `Resend template ${operation.action} failed for ${operation.templateName}: ${response.status} ${text}`,
      );
    }

    results.push({
      templateName: operation.templateName,
      action: operation.action,
      endpoint: operation.endpoint,
      status: "synced",
      resendId: typeof data.id === "string" ? data.id : undefined,
    });
  }

  return {
    dryRun: false,
    results,
  };
}
