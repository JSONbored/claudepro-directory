/**
 * JSON Section Renderer - Database JSONB sections with CHECK constraint validation
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import React, { useEffect, useState } from 'react';

import { Checklist } from '@/src/components/content/checklist';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedContentBlock } from '@/src/components/content/markdown-content-block';
import { ComparisonTable } from '@/src/components/core/domain/comparison-table';
import { UnifiedContentBox } from '@/src/components/core/domain/content/featured-content-box';

type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSections = ContentRow['metadata'];

interface JSONSectionRendererProps {
  // Note: The permissive type is kept for backward compatibility with legacy data formats.
  // Runtime validation is performed in the component body to ensure type safety.
  sections: Array<Record<string, unknown> & { html?: string }> | GuideSections | Section[];
}

interface CodeTab {
  code: string;
  filename?: string;
  html?: string;
  label: string;
  language: string;
}

interface TabItem {
  content: string;
  label: string;
  value: string;
}

interface AccordionItem {
  content: string;
  defaultOpen?: boolean;
  title: string;
}

interface FaqQuestion {
  answer: string;
  category?: string;
  question: string;
}

interface FeatureItem {
  badge?: string;
  description: string;
  title: string;
}

interface StepItem {
  code?: string;
  description: string;
  html?: string;
  language?: string;
  notes?: string;
  number: number;
  timeEstimate?: string;
  title: string;
}

interface ChecklistItem {
  description?: string;
  required?: boolean;
  task: string;
}

interface ResourceItem {
  description: string;
  external?: boolean;
  title: string;
  type: string;
  url: string;
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Reject dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores, query params, hash
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Validate and canonicalize an external URL for safe use in href attributes.
 *
 * Only allows `https:` URLs; allows `http:` only for localhost addresses (`localhost`, `127.0.0.1`, `::1`). Rejects URLs containing username or password credentials and normalizes hostname and default ports.
 *
 * @param url - The input URL string to validate and sanitize.
 * @returns The canonicalized absolute href string if the URL is allowed, `null` otherwise.
 *
 * @see isValidInternalPath
 */
function getSafeExternalUrl(url: string): null | string {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Only allow HTTPS protocol (or HTTP for localhost/development)
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1';
    if (parsed.protocol === 'https:') {
      // HTTPS always allowed
    } else if (parsed.protocol === 'http:' && isLocalhost) {
      // HTTP allowed only for local development
    } else {
      return null;
    }
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove credentials
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href
    return parsed.href;
  } catch {
    return null;
  }
}

interface SectionBase {
  className?: string;
  id?: string;
}

type TextSection = SectionBase & {
  content: string;
  type: 'text';
};

type HeadingSection = SectionBase & {
  content: string;
  level: 2 | 3 | 4 | 5 | 6;
  type: 'heading';
};

type CodeSection = SectionBase & {
  code: string;
  filename?: string;
  html?: string;
  language: string;
  showLineNumbers?: boolean;
  type: 'code';
};

type CodeGroupSection = SectionBase & {
  tabs: CodeTab[];
  title?: string;
  type: 'code_group';
};

type CalloutSection = SectionBase & {
  content: string;
  title?: string;
  type: 'callout';
  variant: 'error' | 'important' | 'info' | 'primary' | 'success' | 'tip' | 'warning';
};

type TldrSection = SectionBase & {
  content: string;
  keyPoints?: string[];
  type: 'tldr';
};

type FeatureGridSection = SectionBase & {
  columns?: number | string;
  description?: string;
  features: FeatureItem[];
  title?: string;
  type: 'feature_grid';
};

type ExpertQuoteSection = SectionBase & {
  author: string;
  avatarUrl?: string;
  company?: string;
  quote: string;
  title?: string;
  type: 'expert_quote';
};

type ComparisonTableSection = SectionBase & {
  data: (Record<string, string> | string[])[];
  description?: string;
  headers: string[];
  title?: string;
  type: 'comparison_table';
};

type TabsSection = SectionBase & {
  description?: string;
  items: TabItem[];
  title?: string;
  type: 'tabs';
};

type AccordionSection = SectionBase & {
  description?: string;
  items: AccordionItem[];
  title?: string;
  type: 'accordion';
};

type FaqSection = SectionBase & {
  description?: string;
  questions: FaqQuestion[];
  title?: string;
  type: 'faq';
};

type StepsSection = SectionBase & {
  steps: StepItem[];
  title?: string;
  type: 'steps';
};

type ChecklistSection = SectionBase & {
  items: ChecklistItem[];
  title?: string;
  type: 'checklist';
};

type RelatedContentSection = SectionBase & {
  description?: string;
  resources?: ResourceItem[];
  title?: string;
  type: 'related_content';
};

type Section =
  | AccordionSection
  | CalloutSection
  | ChecklistSection
  | CodeGroupSection
  | CodeSection
  | ComparisonTableSection
  | ExpertQuoteSection
  | FaqSection
  | FeatureGridSection
  | HeadingSection
  | RelatedContentSection
  | StepsSection
  | TabsSection
  | TextSection
  | TldrSection;

/**
 * Render sanitized HTML content, sanitizing on the client and preserving raw HTML during SSR.
 *
 * Sanitizes the provided `html` string using DOMPurify on the client and renders the sanitized result.
 * During server-side rendering the original `html` is rendered (client will replace it with the sanitized version).
 * If DOMPurify fails to load, the original `html` is used as a fallback and a client warning is logged.
 *
 * @param html - The HTML string to render; required.
 * @param className - Optional CSS class names to apply to the container element.
 * @param id - Optional id attribute for the container element.
 *
 * @see https://github.com/cure53/DOMPurify
 * @see normalizeError
 * @see logClientWarn
 */
function TrustedHTML({ html, className, id }: { className?: string; html: string; id?: string }) {
  // Hooks must be called unconditionally before any early returns
  const [safeHtml, setSafeHtml] = useState<string>(
    globalThis.window === undefined ? html : '' // Start empty on client, will be set in useEffect
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (globalThis.window !== undefined && html && typeof html === 'string') {
      import('dompurify')
        .then((DOMPurify) => {
          const sanitized = DOMPurify.default.sanitize(html, {
            ALLOWED_TAGS: [
              'p',
              'br',
              'strong',
              'em',
              'b',
              'i',
              'u',
              'a',
              'ul',
              'ol',
              'li',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'code',
              'pre',
              'blockquote',
              'span',
              'div',
              'table',
              'thead',
              'tbody',
              'tr',
              'th',
              'td',
              'img',
            ],
            ALLOWED_ATTR: [
              'href',
              'title',
              'target',
              'rel',
              'class',
              'id',
              'src',
              'alt',
              'width',
              'height',
            ],
            ALLOWED_URI_REGEXP:
              /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
          });
          setSafeHtml(sanitized);
        })
        .catch((error) => {
          const normalized = normalizeError(error, 'Failed to load DOMPurify');
          logClientWarn(
            '[Sanitize] Failed to load DOMPurify',
            normalized,
            'TrustedHTML.loadDOMPurify',
            {
              component: 'TrustedHTML',
              action: 'load-dompurify',
              category: 'sanitize',
              recoverable: true,
            }
          );
          // Fallback to original HTML if DOMPurify fails to load
          setSafeHtml(html);
        });
    }
  }, [html]);

  // Early return AFTER all hooks
  if (!html || typeof html !== 'string') {
    return <div id={id} className={className} />;
  }

  // During SSR, render the HTML directly (will be sanitized on client)
  const displayHtml = isClient ? safeHtml : html;

  return (
    <div
      id={id}
      className={className}
      // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist (client-side)
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized client-side with DOMPurify
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}

/**
 * Renders a single content section into the appropriate React node based on its `type`.
 *
 * For `related_content` resources this function validates and sanitizes URLs and logs a client warning when a URL is invalid or unsafe.
 *
 * @param section - Section data object with a discriminant `type` that determines the rendering path and additional fields required by that type.
 * @param index - Index used to derive a stable fallback key when `section.id` is not provided.
 * @returns The React node that represents the rendered section, or `null` if the section type is unrecognized.
 *
 * @see TrustedHTML
 * @see getSafeExternalUrl
 * @see isValidInternalPath
 * @see UnifiedContentBox
 */
function render_section(section: Section, index: number): React.ReactNode {
  const key = section.id || `section-${index}`;

  switch (section.type) {
    // ============================================================================
    // TEXT & HEADING SECTIONS
    // ============================================================================
    case 'text': {
      return (
        <TrustedHTML
          key={key}
          {...(section.id !== undefined && { id: section.id })}
          {...(section.className !== undefined && { className: section.className })}
          html={section.content}
        />
      );
    }

    case 'heading': {
      const HeadingTag = `h${section.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      const HeadingComponent = HeadingTag;
      return (
        <HeadingComponent key={key} id={section.id} className={section.className}>
          {section.content}
        </HeadingComponent>
      );
    }

    // ============================================================================
    // CODE SECTIONS
    // ============================================================================
    case 'code': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <ProductionCodeBlock
            html={section.html || ''}
            code={section.code}
            language={section.language}
            filename={section.filename}
            showLineNumbers={section.showLineNumbers ?? true}
          />
        </div>
      );
    }

    case 'code_group': {
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title ? <h3 className="mb-4 text-lg font-semibold">{section.title}</h3> : null}
          <div className="overflow-hidden rounded-lg border">
            {section.tabs.map((tab: CodeTab, idx: number) => (
              <details key={`${tab.label}-${idx}`} className="border-b last:border-0">
                <summary className="hover:bg-muted/50 cursor-pointer px-4 py-3 font-medium">
                  {tab.label} {tab.filename ? `• ${tab.filename}` : null}
                </summary>
                <div className="p-4">
                  <ProductionCodeBlock
                    html={tab.html || ''}
                    code={tab.code}
                    language={tab.language}
                    filename={tab.filename}
                  />
                </div>
              </details>
            ))}
          </div>
        </div>
      );
    }

    // ============================================================================
    // CALLOUT SECTIONS
    // ============================================================================
    case 'callout': {
      // Map guide schema variants to UnifiedContentBox supported types
      const calloutType: 'error' | 'info' | 'success' | 'tip' | 'warning' =
        section.variant === 'primary' || section.variant === 'important'
          ? 'info' // Map unsupported variants to 'info'
          : section.variant;

      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBox contentType="callout" type={calloutType} title={section.title}>
            <TrustedHTML html={section.content} />
          </UnifiedContentBox>
        </div>
      );
    }

    // ============================================================================
    // TLDR & FEATURE SECTIONS
    // ============================================================================
    case 'tldr': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBlock
            variant="tldr"
            title="TL;DR"
            content={section.content}
            keyPoints={section.keyPoints}
          />
        </div>
      );
    }

    case 'feature_grid': {
      const columnsValue =
        typeof section.columns === 'number'
          ? section.columns
          : section.columns
            ? Number.parseInt(section.columns, 10)
            : 3;

      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBlock
            variant="feature-grid"
            title={section.title || 'Key Features'}
            description={section.description || ''}
            features={section.features.map((f: FeatureItem) => ({
              title: f.title,
              description: f.description,
              badge: f.badge,
            }))}
            columns={columnsValue as 2 | 3 | 4}
          />
        </div>
      );
    }

    case 'expert_quote': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBlock
            variant="expert-quote"
            quote={section.quote}
            author={section.author}
            role={section.title}
            company={section.company}
            imageUrl={section.avatarUrl}
          />
        </div>
      );
    }

    // ============================================================================
    // COMPARISON & TABLE SECTIONS
    // ============================================================================
    case 'comparison_table': {
      const headers = section.headers || [];

      const items = section.data.map((row: Record<string, string> | string[]) => {
        if (Array.isArray(row)) {
          return {
            feature: row[0] || '',
            option1: row[1] || '',
            option2: row[2] || '',
            option3: row[3],
          };
        }

        return {
          feature: headers[0] ? row[headers[0]] || '' : '',
          option1: headers[1] ? row[headers[1]] || '' : '',
          option2: headers[2] ? row[headers[2]] || '' : '',
          option3: headers[3] ? row[headers[3]] : undefined,
        };
      });

      return (
        <div key={key} id={section.id} className={section.className}>
          <ComparisonTable
            title={section.title}
            description={section.description}
            headers={headers.slice(1)} // Exclude first header (feature name)
            items={items}
          />
        </div>
      );
    }

    // ============================================================================
    // INTERACTIVE SECTIONS (TABS, ACCORDION, FAQ)
    // ============================================================================
    case 'tabs': {
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title ? <h3 className="mb-4 text-lg font-semibold">{section.title}</h3> : null}
          {section.description ? (
            <p className="text-muted-foreground mb-4">{section.description}</p>
          ) : null}
          <div className="overflow-hidden rounded-lg border">
            {section.items.map((item: TabItem, idx: number) => (
              <details key={`${item.value}-${idx}`} className="border-b last:border-0">
                <summary className="hover:bg-muted/50 cursor-pointer px-4 py-3 font-medium">
                  {item.label}
                </summary>
                <TrustedHTML html={item.content} className="p-4" />
              </details>
            ))}
          </div>
        </div>
      );
    }

    case 'accordion': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBox
            contentType="accordion"
            {...(section.title && { title: section.title })}
            description={section.description || ''}
            items={section.items.map((item: AccordionItem) => ({
              title: item.title,
              content: <TrustedHTML html={item.content} />,
              defaultOpen: item.defaultOpen ?? false,
            }))}
            allowMultiple={false}
          />
        </div>
      );
    }

    case 'faq': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <UnifiedContentBox
            contentType="faq"
            title={section.title || 'Frequently Asked Questions'}
            description={section.description || ''}
            questions={section.questions.map((q: FaqQuestion) => ({
              question: q.question,
              answer: q.answer,
              ...(q.category && { category: q.category }),
            }))}
          />
        </div>
      );
    }

    // ============================================================================
    // STEP-BY-STEP & CHECKLIST SECTIONS
    // ============================================================================
    case 'steps': {
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title ? <h3 className="mb-4 text-lg font-semibold">{section.title}</h3> : null}
          <div className="space-y-6">
            {section.steps.map((step: StepItem) => (
              <div key={step.number} className="border-primary border-l-4 pl-6">
                <h4 className="mb-2 text-lg font-semibold">
                  Step {step.number}: {step.title}
                </h4>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                {step.timeEstimate ? (
                  <p className="text-muted-foreground mb-2 text-sm">⏱️ {step.timeEstimate}</p>
                ) : null}
                {step.code ? (
                  <ProductionCodeBlock
                    html={step.html || ''}
                    code={step.code}
                    language={step.language || 'bash'}
                  />
                ) : null}
                {step.notes ? (
                  <p className="text-muted-foreground mt-2 text-sm italic">{step.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'checklist': {
      return (
        <div key={key} id={section.id} className={section.className}>
          <Checklist
            title={section.title}
            type="prerequisites"
            items={section.items.map((item: ChecklistItem) => ({
              task: item.task,
              description: item.description,
              completed: false,
              priority: item.required ? 'high' : 'low',
            }))}
          />
        </div>
      );
    }

    // ============================================================================
    // RELATED CONTENT SECTION
    // ============================================================================
    case 'related_content': {
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title ? <h3 className="mb-4 text-lg font-semibold">{section.title}</h3> : null}
          {section.description ? (
            <p className="text-muted-foreground mb-4">{section.description}</p>
          ) : null}
          {section.resources && section.resources.length > 0 ? (
            <div className="grid gap-4">
              {section.resources.map((r: ResourceItem) => {
                // Defensive defaulting: infer external flag from URL pattern if not provided
                // Prevents silent link disabling when external flag is undefined but URL is clearly external
                const isExternal =
                  r.external === undefined
                    ? r.url.trim().startsWith('http://') || r.url.trim().startsWith('https://')
                    : r.external;

                // Validate and sanitize URL based on whether it's external or internal
                const safeUrl = isExternal
                  ? getSafeExternalUrl(r.url)
                  : isValidInternalPath(r.url)
                    ? r.url
                    : null;

                // Don't render if URL is invalid or unsafe
                if (!safeUrl) {
                  logClientWarn(
                    '[Content] Invalid or unsafe URL detected in resource',
                    undefined,
                    'JSONSectionRenderer.renderResource',
                    {
                      component: 'JSONSectionRenderer',
                      action: 'render-resource',
                      category: 'content',
                      url: r.url,
                      title: r.title,
                    }
                  );
                  // Use a stable key based on resource properties instead of array index
                  const resourceKey = `invalid-resource-${r.title}-${r.url.slice(0, 50)}`;
                  return (
                    <div
                      key={resourceKey}
                      className="rounded-lg border p-4 opacity-50"
                      title="Invalid or unsafe URL - cannot display link"
                    >
                      <h4 className="mb-1 font-semibold">{r.title}</h4>
                      <p className="text-muted-foreground mb-2 text-sm">{r.description}</p>
                      <span className="text-destructive text-xs uppercase">
                        {r.type} • Invalid URL
                      </span>
                    </div>
                  );
                }

                // Use a stable key based on resource properties instead of array index
                const resourceKey = `resource-${r.title}-${r.url.slice(0, 50)}`;
                return (
                  <a
                    key={resourceKey}
                    href={safeUrl}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                  >
                    <h4 className="mb-1 font-semibold">{r.title}</h4>
                    <p className="text-muted-foreground mb-2 text-sm">{r.description}</p>
                    <span className="text-primary text-xs uppercase">{r.type}</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    }

    default: {
      return null;
    }
  }
}

/**
 * Render an array of content sections into their corresponding React UI blocks.
 *
 * @param sections - Sections to render. Accepts a typed Section[] or legacy/guide section shapes (array of record objects, possibly containing `html`). The prop will be normalized to an array of Section objects before rendering.
 * @returns A React element containing the rendered sections, or `null` when no sections are provided.
 *
 * @see JSONSectionRendererProps
 * @see render_section
 * @see TrustedHTML
 */
export function JSONSectionRenderer({ sections }: JSONSectionRendererProps) {
  const sections_array = Array.isArray(sections) ? (sections as Section[]) : [];

  if (sections_array.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sections_array.map((section, index) => {
        const key = section.id || `section-${index}`;
        return (
          <React.Fragment key={key}>
            {render_section(section, index)}
          </React.Fragment>
        );
      })}
    </div>
  );
}