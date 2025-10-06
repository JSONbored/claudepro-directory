/**
 * CodeGroup - Multi-language code examples for tutorials (HYBRID COMPONENT)
 *
 * PRODUCTION-GRADE: Server-side Shiki highlighting + Client-side tab switching
 * - Used in 19+ MDX files across the codebase
 * - Server: Pre-renders all code examples with Shiki
 * - Client: Interactive tab switching (minimal JavaScript)
 * - Secure: Uses trusted Shiki renderer
 * - Performant: All highlighting done on server
 */

'use client';

import React from 'react';
import { ProductionCodeBlock } from '@/src/components/shared/production-code-block';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export interface CodeGroupWithHighlightedExamples {
  examples: Array<{
    language: string;
    filename?: string | undefined;
    code: string;
    highlightedHtml: string;
  }>;
  title?: string;
  description?: string;
}

export function CodeGroup(props: CodeGroupWithHighlightedExamples) {
  const { examples, title, description } = props;
  const [activeExample, setActiveExample] = React.useState(0);

  if (examples.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/SoftwareSourceCode" className="my-10">
      {title && (
        <div className={UI_CLASSES.MB_4}>
          <h3 className={`text-xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_2}`} itemProp="name">
            {title}
          </h3>
          {description && (
            <p className={`${UI_CLASSES.TEXT_BASE} text-muted-foreground`} itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className={UI_CLASSES.SPACE_Y_2}>
        {/* Tabs */}
        <div className={UI_CLASSES.CODE_BLOCK_TAB_CONTAINER}>
          {examples.map((example, index) => {
            const isActive = activeExample === index;
            return (
              <button
                type="button"
                key={example.language + (example.filename || '')}
                onClick={() => setActiveExample(index)}
                className={`
                  px-4 py-2 text-sm font-medium whitespace-nowrap
                  transition-all duration-200 border-b-2
                  ${isActive ? UI_CLASSES.CODE_BLOCK_TAB_ACTIVE : UI_CLASSES.CODE_BLOCK_TAB_INACTIVE}
                `}
              >
                <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <span className="font-mono">{example.language}</span>
                  {example.filename && (
                    <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                      • {example.filename}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Code Content - Server-rendered Shiki HTML */}
        {examples.map((example, index) => (
          <div
            key={`${example.language}${example.filename || ''}-content`}
            className={activeExample === index ? 'block' : 'hidden'}
          >
            <ProductionCodeBlock
              html={example.highlightedHtml}
              code={example.code}
              language={example.language}
              filename={example.filename}
              maxLines={30}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
