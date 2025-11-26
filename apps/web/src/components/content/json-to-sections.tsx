/**
 * JSON Section Renderer - Database JSONB sections with CHECK constraint validation
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/core';
import DOMPurify from 'dompurify';
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
  sections: GuideSections | Section[] | Array<Record<string, unknown> & { html?: string }>;
}

interface CodeTab {
  label: string;
  code: string;
  language: string;
  filename?: string;
  html?: string;
}

interface TabItem {
  value: string;
  label: string;
  content: string;
}

interface AccordionItem {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

interface FaqQuestion {
  question: string;
  answer: string;
  category?: string;
}

interface FeatureItem {
  title: string;
  description: string;
  badge?: string;
}

interface StepItem {
  number: number;
  title: string;
  description: string;
  timeEstimate?: string;
  code?: string;
  language?: string;
  html?: string;
  notes?: string;
}

interface ChecklistItem {
  task: string;
  description?: string;
  required?: boolean;
}

interface ResourceItem {
  url: string;
  title: string;
  description: string;
  type: string;
  external?: boolean;
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
 * Validate and sanitize external URL for safe use in href
 * Only allows HTTPS for external URLs, HTTP only for localhost/development
 */
function getSafeExternalUrl(url: string): string | null {
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

type SectionBase = {
  id?: string;
  className?: string;
};

type TextSection = SectionBase & {
  type: 'text';
  content: string;
};

type HeadingSection = SectionBase & {
  type: 'heading';
  level: 2 | 3 | 4 | 5 | 6;
  content: string;
};

type CodeSection = SectionBase & {
  type: 'code';
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  html?: string;
};

type CodeGroupSection = SectionBase & {
  type: 'code_group';
  title?: string;
  tabs: CodeTab[];
};

type CalloutSection = SectionBase & {
  type: 'callout';
  variant: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'primary' | 'important';
  title?: string;
  content: string;
};

type TldrSection = SectionBase & {
  type: 'tldr';
  content: string;
  keyPoints?: string[];
};

type FeatureGridSection = SectionBase & {
  type: 'feature_grid';
  title?: string;
  description?: string;
  features: FeatureItem[];
  columns?: number | string;
};

type ExpertQuoteSection = SectionBase & {
  type: 'expert_quote';
  quote: string;
  author: string;
  title?: string;
  company?: string;
  avatarUrl?: string;
};

type ComparisonTableSection = SectionBase & {
  type: 'comparison_table';
  title?: string;
  description?: string;
  headers: string[];
  data: (string[] | Record<string, string>)[];
};

type TabsSection = SectionBase & {
  type: 'tabs';
  title?: string;
  description?: string;
  items: TabItem[];
};

type AccordionSection = SectionBase & {
  type: 'accordion';
  title?: string;
  description?: string;
  items: AccordionItem[];
};

type FaqSection = SectionBase & {
  type: 'faq';
  title?: string;
  description?: string;
  questions: FaqQuestion[];
};

type StepsSection = SectionBase & {
  type: 'steps';
  title?: string;
  steps: StepItem[];
};

type ChecklistSection = SectionBase & {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
};

type RelatedContentSection = SectionBase & {
  type: 'related_content';
  title?: string;
  description?: string;
  resources?: ResourceItem[];
};

type Section =
  | TextSection
  | HeadingSection
  | CodeSection
  | CodeGroupSection
  | CalloutSection
  | TldrSection
  | FeatureGridSection
  | ExpertQuoteSection
  | ComparisonTableSection
  | TabsSection
  | AccordionSection
  | FaqSection
  | StepsSection
  | ChecklistSection
  | RelatedContentSection;

/**
 * TrustedHTML - Safely renders HTML content with XSS protection
 * Sanitizes HTML using DOMPurify before rendering
 */
function TrustedHTML({ html, className, id }: { html: string; className?: string; id?: string }) {
  if (!html || typeof html !== 'string') {
    return <div id={id} className={className} />;
  }

  // Sanitize HTML to prevent XSS
  // Allow common markdown-generated HTML tags for content sections
  const safeHtml = DOMPurify.sanitize(html, {
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

  return (
    <div
      id={id}
      className={className}
      // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist
      // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

function render_section(section: Section, index: number): React.ReactNode {
  const key = section.id || `section-${index}`;

  switch (section.type) {
    // ============================================================================
    // TEXT & HEADING SECTIONS
    // ============================================================================
    case 'text':
      return (
        <TrustedHTML
          key={key}
          {...(section.id !== undefined && { id: section.id })}
          {...(section.className !== undefined && { className: section.className })}
          html={section.content}
        />
      );

    case 'heading': {
      const HeadingTag = `h${section.level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      return (
        <HeadingTag key={key} id={section.id} className={section.className}>
          {section.content}
        </HeadingTag>
      );
    }

    // ============================================================================
    // CODE SECTIONS
    // ============================================================================
    case 'code':
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

    case 'code_group':
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title && <h3 className="mb-4 font-semibold text-lg">{section.title}</h3>}
          <div className="overflow-hidden rounded-lg border">
            {section.tabs.map((tab: CodeTab, idx: number) => (
              <details key={`${tab.label}-${idx}`} className="border-b last:border-0">
                <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-muted/50">
                  {tab.label} {tab.filename && `• ${tab.filename}`}
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

    // ============================================================================
    // CALLOUT SECTIONS
    // ============================================================================
    case 'callout': {
      // Map guide schema variants to UnifiedContentBox supported types
      const calloutType: 'info' | 'warning' | 'success' | 'error' | 'tip' =
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
    case 'tldr':
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

    case 'expert_quote':
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

    // ============================================================================
    // COMPARISON & TABLE SECTIONS
    // ============================================================================
    case 'comparison_table': {
      const headers = section.headers || [];

      const items = section.data.map((row: string[] | Record<string, string>) => {
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
    case 'tabs':
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title && <h3 className="mb-4 font-semibold text-lg">{section.title}</h3>}
          {section.description && (
            <p className="mb-4 text-muted-foreground">{section.description}</p>
          )}
          <div className="overflow-hidden rounded-lg border">
            {section.items.map((item: TabItem, idx: number) => (
              <details key={`${item.value}-${idx}`} className="border-b last:border-0">
                <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-muted/50">
                  {item.label}
                </summary>
                <TrustedHTML html={item.content} className="p-4" />
              </details>
            ))}
          </div>
        </div>
      );

    case 'accordion':
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

    case 'faq':
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

    // ============================================================================
    // STEP-BY-STEP & CHECKLIST SECTIONS
    // ============================================================================
    case 'steps':
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title && <h3 className="mb-4 font-semibold text-lg">{section.title}</h3>}
          <div className="space-y-6">
            {section.steps.map((step: StepItem) => (
              <div key={step.number} className="border-primary border-l-4 pl-6">
                <h4 className="mb-2 font-semibold text-lg">
                  Step {step.number}: {step.title}
                </h4>
                <p className="mb-4 text-muted-foreground">{step.description}</p>
                {step.timeEstimate && (
                  <p className="mb-2 text-muted-foreground text-sm">⏱️ {step.timeEstimate}</p>
                )}
                {step.code && (
                  <ProductionCodeBlock
                    html={step.html || ''}
                    code={step.code}
                    language={step.language || 'bash'}
                  />
                )}
                {step.notes && (
                  <p className="mt-2 text-muted-foreground text-sm italic">{step.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'checklist':
      return (
        <div key={key} id={section.id} className={section.className}>
          <Checklist
            title={section.title}
            type="prerequisites"
            items={section.items.map((item: ChecklistItem) => ({
              task: item.task,
              description: item.description,
              completed: false,
              priority: (item.required ? 'high' : 'low') as 'high' | 'low',
            }))}
          />
        </div>
      );

    // ============================================================================
    // RELATED CONTENT SECTION
    // ============================================================================
    case 'related_content':
      return (
        <div key={key} id={section.id} className={section.className}>
          {section.title && <h3 className="mb-4 font-semibold text-lg">{section.title}</h3>}
          {section.description && (
            <p className="mb-4 text-muted-foreground">{section.description}</p>
          )}
          {section.resources && section.resources.length > 0 && (
            <div className="grid gap-4">
              {section.resources.map((r: ResourceItem) => {
                // Defensive defaulting: infer external flag from URL pattern if not provided
                // Prevents silent link disabling when external flag is undefined but URL is clearly external
                const isExternal =
                  r.external !== undefined
                    ? r.external
                    : r.url.trim().startsWith('http://') || r.url.trim().startsWith('https://');

                // Validate and sanitize URL based on whether it's external or internal
                const safeUrl = isExternal
                  ? getSafeExternalUrl(r.url)
                  : isValidInternalPath(r.url)
                    ? r.url
                    : null;

                // Don't render if URL is invalid or unsafe
                if (!safeUrl) {
                  logger.warn('Invalid or unsafe URL detected in resource', {
                    url: r.url,
                    title: r.title,
                  });
                  // Use a stable key based on resource properties instead of array index
                  const resourceKey = `invalid-resource-${r.title}-${r.url.slice(0, 50)}`;
                  return (
                    <div
                      key={resourceKey}
                      className="rounded-lg border p-4 opacity-50"
                      title="Invalid or unsafe URL - cannot display link"
                    >
                      <h4 className="mb-1 font-semibold">{r.title}</h4>
                      <p className="mb-2 text-muted-foreground text-sm">{r.description}</p>
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
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <h4 className="mb-1 font-semibold">{r.title}</h4>
                    <p className="mb-2 text-muted-foreground text-sm">{r.description}</p>
                    <span className="text-primary text-xs uppercase">{r.type}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

export function JSONSectionRenderer({ sections }: JSONSectionRendererProps) {
  const sections_array = Array.isArray(sections) ? (sections as Section[]) : [];

  if (sections_array.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sections_array.map((section, index) => render_section(section, index))}
    </div>
  );
}
