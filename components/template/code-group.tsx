'use client';

/**
 * CodeGroup - Multi-language code examples for tutorials and workflows
 * Used in 19+ MDX files across the codebase
 */

import { Check, Copy } from 'lucide-react';
import React from 'react';
import { type CodeGroupProps, codeGroupPropsSchema } from '@/lib/schemas/shared.schema';

export function CodeGroup(props: CodeGroupProps) {
  const validated = codeGroupPropsSchema.parse(props);
  const { examples, title, description } = validated;
  const validExamples = examples;
  const [activeExample, setActiveExample] = React.useState(0);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (validExamples.length === 0) {
    return null;
  }

  return (
    <section itemScope itemType="https://schema.org/SoftwareSourceCode" className="my-10">
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2" itemProp="name">
            {title}
          </h3>
          {description && (
            <p className="text-base text-muted-foreground" itemProp="description">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl overflow-hidden shadow-2xl bg-black border border-accent/20">
        {/* Terminal Header */}
        <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-zinc-400 font-mono">
              {validExamples[activeExample]?.filename || 'terminal'}
            </span>
          </div>
          <div className="w-16" />
        </div>

        {/* Tabs */}
        <div className="bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex overflow-x-auto scrollbar-hide">
            {validExamples.map((example, index) => {
              const isActive = activeExample === index;
              return (
                <button
                  type="button"
                  key={example.language + (example.filename || '')}
                  onClick={() => setActiveExample(index)}
                  className={`
                    relative px-6 py-3 text-sm font-medium whitespace-nowrap
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-white bg-black border-t-2 border-accent'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{example.language}</span>
                    {example.filename && (
                      <span className="text-xs text-zinc-500">• {example.filename}</span>
                    )}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative bg-black">
          {validExamples.map((example, index) => (
            <div
              key={`${example.language}${example.filename || ''}-content`}
              className={activeExample === index ? 'block' : 'hidden'}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  type="button"
                  onClick={() => handleCopy(example.code, index)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-md transition-all hover:scale-105"
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
                className="p-6 overflow-x-auto text-sm leading-relaxed"
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
