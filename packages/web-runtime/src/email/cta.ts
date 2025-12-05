import { addUTMToURL } from './email-utm';
import type { EmailUTMParams } from './utm-templates';

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
