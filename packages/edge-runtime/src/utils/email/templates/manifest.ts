/**
 * Email Template Manifest
 * 
 * NOTE: This file is a stub. Email templates have been migrated to @heyclaude/web-runtime/email.
 * This file exists to satisfy TypeScript imports in the generators package.
 * 
 * TODO: Update sync-email-templates.ts to use the web-runtime email templates instead.
 */

export type EmailTemplateSlug = string;

export interface EmailTemplateDefinition<TProps extends Record<string, unknown> = Record<string, unknown>> {
  slug: EmailTemplateSlug;
  displayName: string;
  buildSampleData: () => TProps;
  buildSubject: (props: TProps) => string;
  render: (props: TProps) => Promise<string>;
}

/**
 * Empty manifest - email templates have been migrated to web-runtime
 * @deprecated Use @heyclaude/web-runtime/email instead
 */
export const EMAIL_TEMPLATE_MANIFEST: readonly EmailTemplateDefinition<Record<string, unknown>>[] = [];
