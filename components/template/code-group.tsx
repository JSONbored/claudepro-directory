'use client';

/**
 * CodeGroup - Multi-language code examples for tutorials and workflows
 * Used in 19+ MDX files across the codebase
 */

import React from 'react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Check, Copy } from '@/lib/icons';
import { type CodeGroupProps, codeGroupPropsSchema } from '@/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function CodeGroup(props: CodeGroupProps) {
  const validated = codeGroupPropsSchema.parse(props);
  const { examples, title, description } = validated;
  const validExamples = examples;
  const [activeExample, setActiveExample] = React.useState(0);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const { copy } = useCopyToClipboard({
    onSuccess: () => {
      // copiedIndex is set before copy is called
    },
    context: {
      component: 'CodeGroup',
      action: 'copy-code',
    },
  });

  const handleCopy = async (code: string, index: number) => {
    const success = await copy(code);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  if (validExamples.length === 0) {
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

      <div
        className={`rounded-xl ${UI_CLASSES.OVERFLOW_HIDDEN} shadow-2xl bg-black border border-accent/20`}
      >
        {/* Terminal Header */}
        <div
          className={`bg-zinc-900 px-4 ${UI_CLASSES.PY_3} ${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} border-b border-zinc-800`}
        >
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className={`${UI_CLASSES.FLEX_1} text-center`}>
            <span className={`${UI_CLASSES.TEXT_XS} text-zinc-400 font-mono`}>
              {validExamples[activeExample]?.filename || 'terminal'}
            </span>
          </div>
          <div className="w-16" />
        </div>

        {/* Tabs */}
        <div className="bg-zinc-900/50 border-b border-zinc-800">
          <div className={`flex ${UI_CLASSES.OVERFLOW_X_AUTO} scrollbar-hide`}>
            {validExamples.map((example, index) => {
              const isActive = activeExample === index;
              return (
                <button
                  type="button"
                  key={example.language + (example.filename || '')}
                  onClick={() => setActiveExample(index)}
                  className={`
                    ${UI_CLASSES.RELATIVE} px-6 ${UI_CLASSES.PY_3} ${UI_CLASSES.TEXT_SM} font-medium ${UI_CLASSES.WHITESPACE_NOWRAP}
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-white bg-black border-t-2 border-accent'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                    <span className="font-mono">{example.language}</span>
                    {example.filename && (
                      <span className={`${UI_CLASSES.TEXT_XS} text-zinc-500`}>
                        • {example.filename}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <div
                      className={`${UI_CLASSES.ABSOLUTE} ${UI_CLASSES.BOTTOM_0} ${UI_CLASSES.LEFT_0} ${UI_CLASSES.RIGHT_0} h-px bg-gradient-to-r from-transparent via-accent to-transparent`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content */}
        <div className={`${UI_CLASSES.RELATIVE} bg-black`}>
          {validExamples.map((example, index) => (
            <div
              key={`${example.language}${example.filename || ''}-content`}
              className={activeExample === index ? UI_CLASSES.BLOCK : UI_CLASSES.HIDDEN}
            >
              <div className={`${UI_CLASSES.ABSOLUTE} top-4 right-4 ${UI_CLASSES.Z_10}`}>
                <button
                  type="button"
                  onClick={() => handleCopy(example.code, index)}
                  className={`${UI_CLASSES.P_2} text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md transition-all hover:${UI_CLASSES.SCALE_105}`}
                  aria-label="Copy code"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <pre
                className={`${UI_CLASSES.P_6} ${UI_CLASSES.OVERFLOW_X_AUTO} ${UI_CLASSES.TEXT_SM} leading-relaxed`}
                itemProp="codeRepository"
              >
                <code
                  itemProp="programmingLanguage"
                  data-language={example.language}
                  className="text-zinc-300 font-mono"
                >
                  {example.code}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
