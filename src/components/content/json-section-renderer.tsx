/**
 * JSON Section Renderer - Database JSONB sections with CHECK constraint validation
 */

'use client';

import { Checklist } from '@/src/components/content/checklist';
import { ProductionCodeBlock } from '@/src/components/content/production-code-block';
import { UnifiedContentBlock } from '@/src/components/content/unified-content-block';
import { UnifiedContentBox } from '@/src/components/domain/unified-content-box';
import { ComparisonTable } from '@/src/components/template/comparison-table';
import type { Database } from '@/src/types/database.types';

type ContentRow = Database['public']['Tables']['content']['Row'];
type GuideSections = ContentRow['metadata'];

interface JSONSectionRendererProps {
  sections: GuideSections;
}

function TrustedHTML({ html, className, id }: { html: string; className?: string; id?: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from owner-controlled JSON files, not user input
  return <div id={id} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function render_section(section: any, index: number): React.ReactNode {
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
            html="" // Will be client-rendered
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
            {section.tabs.map((tab: any, idx: number) => (
              <details key={`${tab.label}-${idx}`} className="border-b last:border-0">
                <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-muted/50">
                  {tab.label} {tab.filename && `• ${tab.filename}`}
                </summary>
                <div className="p-4">
                  <ProductionCodeBlock
                    html=""
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
            features={section.features.map((f: any) => ({
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

      const items = section.data.map((row: any) => {
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
            {section.items.map((item: any, idx: number) => (
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
            title={section.title}
            description={section.description || ''}
            items={section.items.map((item: any) => ({
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
            questions={section.questions.map((q: any) => ({
              question: q.question,
              answer: q.answer,
              category: q.category,
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
            {section.steps.map((step: any) => (
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
                    html=""
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
            items={section.items.map((item: any) => ({
              task: item.task,
              description: item.description,
              completed: false, // User will check these off
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
              {section.resources.map((r: any, idx: number) => (
                <a
                  key={`${r.url}-${idx}`}
                  href={r.url}
                  target={r.external ? '_blank' : undefined}
                  rel={r.external ? 'noopener noreferrer' : undefined}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h4 className="mb-1 font-semibold">{r.title}</h4>
                  <p className="mb-2 text-muted-foreground text-sm">{r.description}</p>
                  <span className="text-primary text-xs uppercase">{r.type}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

export function JSONSectionRenderer({ sections }: JSONSectionRendererProps) {
  const sections_array = Array.isArray(sections) ? sections : [];

  if (sections_array.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sections_array.map((section, index) => render_section(section, index))}
    </div>
  );
}
