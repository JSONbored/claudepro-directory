'use client';

/**
 * Code Tabs Component
 *
 * A tabbed interface for displaying multiple code snippets with syntax highlighting.
 * Perfect for showing installation commands, configuration examples, or multi-file code samples.
 *
 * @example
 * ```tsx
 * <CodeTabs
 *   codes={{
 *     npm: 'npm install package',
 *     pnpm: 'pnpm add package',
 *     yarn: 'yarn add package'
 *   }}
 *   lang="bash"
 *   copyButton={true}
 * />
 * ```
 *
 * **When to use:**
 * - Installation instructions: Show commands for different package managers
 * - Configuration examples: Multiple config file formats
 * - Multi-file code samples: Related code files in tabs
 * - Documentation: Alternative approaches or examples
 *
 * **Key features:**
 * - Tab-based navigation between code snippets
 * - Syntax highlighting via Shiki
 * - Copy button for active tab
 * - Dark mode support
 * - Smooth tab transitions
 */

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger, cn } from '@heyclaude/web-runtime/ui';
import { getThemeConfig } from '@heyclaude/shared-runtime';
import { CopyButton } from './code-editor';

type CodeTabsProps = {
  codes: Record<string, string>;
  lang?: string;
  themes?: {
    light: string;
    dark: string;
  };
  copyButton?: boolean;
  /** Called when copy is attempted. Return false to prevent copy action. */
  onCopy?: (content: string) => void | boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

function CodeTabsContent({
  codes,
  lang = 'bash',
  themes = getThemeConfig(), // Use centralized theme config
  copyButton = true,
  onCopy,
  activeValue,
}: {
  codes: Record<string, string>;
  lang?: string;
  themes?: { light: string; dark: string };
  copyButton?: boolean;
  onCopy?: (content: string) => void | boolean;
  activeValue?: string;
}) {
  const { resolvedTheme } = useTheme();

  const [highlightedCodes, setHighlightedCodes] = React.useState<Record<string, string>>(codes); // Start with raw codes for instant rendering

  React.useEffect(() => {
    async function loadHighlightedCode() {
      try {
        const { codeToHtml } = await import('shiki');
        const newHighlightedCodes: Record<string, string> = {};

        for (const [command, val] of Object.entries(codes)) {
          const highlighted = await codeToHtml(val, {
            lang,
            themes: {
              light: themes.light,
              dark: themes.dark,
            },
            defaultColor: resolvedTheme === 'dark' ? 'dark' : 'light',
          });

          newHighlightedCodes[command] = highlighted;
        }

        setHighlightedCodes(newHighlightedCodes);
      } catch (error) {
        // Error highlighting codes - fallback to raw code already set in state
        // Logging handled by caller if needed
      }
    }
    loadHighlightedCode();
  }, [resolvedTheme, lang, themes.light, themes.dark, codes]);

  return (
    <>
      <TabsList
        data-slot="install-tabs-list"
        className="border-border/75 bg-muted dark:border-border/50 relative flex h-10 w-full justify-between rounded-none border-b px-4 py-4 text-current"
      >
        <div className="flex h-full gap-x-3">
          {Object.keys(codes).map((code) => (
            <TabsTrigger
              key={code}
              value={code}
              className="text-muted-foreground px-4 data-[state=active]:text-current"
            >
              {code}
            </TabsTrigger>
          ))}
        </div>

        {copyButton && activeValue && (
          <CopyButton
            content={codes[activeValue] ?? ''}
            size="sm"
            variant="ghost"
            className="-me-2 bg-transparent hover:bg-foreground/5"
            {...(onCopy ? { onCopy: (content: string) => onCopy(content) } : {})}
          />
        )}
      </TabsList>
      {Object.entries(codes).map(([code, rawCode]) => (
        <TabsContent
          data-slot="install-tabs-content"
          key={code}
          className="flex w-full items-center overflow-auto p-4 text-sm"
          value={code}
        >
          <div className="w-full [&_.shiki]:bg-transparent! [&_code]:bg-transparent! [&_code]:text-base [&_code]:leading-relaxed [&>pre]:m-0 [&>pre]:border-none [&>pre]:bg-transparent! [&>pre]:p-4 [&>pre]:text-base [&>pre]:leading-relaxed"> {/* text-base = 13px */}
            {highlightedCodes[code] !== undefined && highlightedCodes[code] !== rawCode ? (
              <div dangerouslySetInnerHTML={{ __html: highlightedCodes[code]! }} />
            ) : (
              <pre>
                <code>{rawCode}</code>
              </pre>
            )}
          </div>
        </TabsContent>
      ))}
    </>
  );
}

function CodeTabs({
  codes,
  lang = 'bash',
  themes = getThemeConfig(), // Use centralized theme config
  className,
  defaultValue,
  value,
  onValueChange,
  copyButton = true,
  onCopy,
}: CodeTabsProps) {
  const firstKey = React.useMemo(() => Object.keys(codes)[0] ?? '', [codes]);
  const [activeValue, setActiveValue] = React.useState(value ?? defaultValue ?? firstKey);

  // Update activeValue when value changes (controlled mode)
  React.useEffect(() => {
    if (value !== undefined) {
      setActiveValue(value);
    }
  }, [value]);

  // Handle value changes
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setActiveValue(newValue);
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  // Handle controlled vs uncontrolled properly
  const finalTabsProps =
    value !== undefined
      ? { value, onValueChange: handleValueChange }
      : { defaultValue: defaultValue ?? firstKey, onValueChange: handleValueChange };

  return (
    <Tabs
      data-slot="install-tabs"
      className={cn('bg-muted/50 w-full gap-0 overflow-hidden rounded-xl border', className)}
      {...finalTabsProps}
    >
      <CodeTabsContent
        codes={codes}
        lang={lang}
        themes={themes}
        copyButton={copyButton}
        {...(onCopy ? { onCopy } : {})}
        activeValue={value ?? activeValue}
      />
    </Tabs>
  );
}

export { CodeTabs, type CodeTabsProps };
