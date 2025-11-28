import { addUTMToURL } from '@heyclaude/edge-runtime/utils/email/email-utm.ts';
import type { EmailUTMParams } from '@heyclaude/edge-runtime/utils/email/utm-templates.ts';

export function buildEmailCtaUrl(
  href: string,
  utm: EmailUTMParams,
  overrides?: Partial<EmailUTMParams>
): string {
  if (!overrides) {
    return addUTMToURL(href, utm);
  }
  return addUTMToURL(href, { ...utm, ...overrides });
}
