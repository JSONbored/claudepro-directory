'use client';

/**
 * Code Editor Component
 * 
 * An animated code editor component that types out code character-by-character with syntax highlighting.
 * Perfect for demos, landing pages, and interactive code presentations.
 * 
 * @example
 * ```tsx
 * <CodeEditor
 *   lang="typescript"
 *   writing={true}
 *   duration={5}
 *   header={true}
 *   copyButton={true}
 * >
 *   const example = 'Hello World';
 * </CodeEditor>
 * ```
 * 
 * **When to use:**
 * - Landing pages: Animated code demos that grab attention
 * - Documentation: Step-by-step code reveals
 * - Interactive tutorials: Progressive code disclosure
 * - Marketing pages: Eye-catching code presentations
 * 
 * **Key features:**
 * - Character-by-character typing animation
 * - Syntax highlighting via Shiki
 * - macOS-style window chrome (red/yellow/green dots)
 * - Copy to clipboard functionality
 * - Intersection Observer support (animates when in view)
 * - Customizable themes (light/dark)
 * - Cursor animation option
 */

import * as React from 'react';
import { useInView, type UseInViewOptions } from 'motion/react';
import { useTheme } from 'next-themes';
import { Button, cn } from '@heyclaude/web-runtime/ui';
import { useBoolean, useTimeout, useInterval } from '@heyclaude/web-runtime/hooks';
import { getThemeConfig } from '@heyclaude/shared-runtime';
import { Copy, Check } from 'lucide-react';

type CopyButtonProps = {
  content: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
  onCopy?: (content: string) => void;
};

function CopyButton({
  content,
  size = 'default',
  variant = 'default',
  className,
  onCopy,
}: CopyButtonProps) {
  const { value: copied, setTrue: setCopiedTrue, setFalse: setCopiedFalse } = useBoolean();

  // Reset copy state after 2000ms when copied is true
  useTimeout(() => {
    if (copied) {
      setCopiedFalse();
    }
  }, copied ? 2000 : null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTrue();
      onCopy?.(content);
    } catch (err) {
      // Copy failed - silently handle (user can try again)
      // Logging handled by caller if needed
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={cn('h-8 w-8 p-0', className)}
    >
      {copied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

type CodeEditorProps = Omit<React.ComponentProps<'div'>, 'onCopy'> & {
  children: string;
  lang: string;
  themes?: {
    light: string;
    dark: string;
  };
  duration?: number;
  delay?: number;
  header?: boolean;
  dots?: boolean;
  icon?: React.ReactNode;
  cursor?: boolean;
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  inViewOnce?: boolean;
  copyButton?: boolean;
  writing?: boolean;
  title?: string;
  onDone?: () => void;
  onCopy?: (content: string) => void;
};

function CodeEditor({
  children: code,
  lang,
  themes = getThemeConfig(), // Use centralized theme config
  duration = 5,
  delay = 0,
  className,
  header = true,
  dots = true,
  icon,
  cursor = false,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  copyButton = false,
  writing = true,
  title,
  onDone,
  onCopy,
  ...props
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const editorRef = React.useRef<HTMLDivElement>(null);
  const [visibleCode, setVisibleCode] = React.useState('');
  const [highlightedCode, setHighlightedCode] = React.useState('');
  const { value: isDone, setTrue: setIsDoneTrue } = useBoolean();

  const inViewResult = useInView(editorRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;

  React.useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import('shiki');

        const highlighted = await codeToHtml(visibleCode, {
          lang,
          themes: {
            light: themes.light,
            dark: themes.dark,
          },
          defaultColor: resolvedTheme === 'dark' ? 'dark' : 'light',
        });

        setHighlightedCode(highlighted);
      } catch (e) {
        // Language highlighting failed - fallback to plain text
        // Logging handled by caller if needed
      }
    };

    loadHighlightedCode();
  }, [
    lang,
    themes,
    writing,
    isInView,
    duration,
    delay,
    visibleCode,
    resolvedTheme,
  ]);

  // Reset when code/writing changes
  React.useEffect(() => {
    if (!writing) {
      setVisibleCode(code);
      onDone?.();
      return;
    }

    if (!code.length || !isInView) {
      setVisibleCode('');
      return;
    }

    // Reset visible code when starting new animation
    setVisibleCode('');
  }, [code, writing, isInView, onDone]);

  // Track typing index
  const [typingIndex, setTypingIndex] = React.useState(0);

  // Reset index when code/writing changes
  React.useEffect(() => {
    if (!writing || !code.length || !isInView) {
      setTypingIndex(0);
      return;
    }
    setTypingIndex(0);
  }, [code, writing, isInView]);

  const characters = React.useMemo(() => Array.from(code), [code]);
  const totalDuration = duration * 1000;
  const interval = totalDuration / characters.length;

  // Use useTimeout for initial delay, then useInterval for typing
  const shouldStartTyping = writing && code.length > 0 && isInView && typingIndex === 0;
  
  useTimeout(() => {
    if (shouldStartTyping) {
      setTypingIndex(1);
    }
  }, shouldStartTyping ? delay * 1000 : null);

  // Use useInterval for typing animation
  useInterval(() => {
    if (!writing || !code.length || !isInView) return;
    
    if (typingIndex < characters.length) {
      setVisibleCode((prev) => prev + characters[typingIndex]);
      setTypingIndex((prev) => prev + 1);
      editorRef.current?.scrollTo({
        top: editorRef.current?.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      setIsDoneTrue();
      onDone?.();
    }
  }, writing && code.length > 0 && isInView && typingIndex > 0 && typingIndex < characters.length ? interval : null);

  return (
    <div
      data-slot="code-editor"
      className={cn(
        'relative bg-muted/50 w-[600px] h-[400px] border border-border overflow-hidden flex flex-col rounded-xl',
        className,
      )}
      {...(props as any)}
    >
      {header ? (
        <div className="bg-muted border-b border-border/75 dark:border-border/50 relative flex flex-row items-center justify-between gap-y-2 h-10 px-4">
          {dots && (
            <div className="flex flex-row gap-x-2">
              <div className="size-2 rounded-full bg-red-500"></div>
              <div className="size-2 rounded-full bg-yellow-500"></div>
              <div className="size-2 rounded-full bg-green-500"></div>
            </div>
          )}

          {title && (
            <div
              className={cn(
                'flex flex-row items-center gap-2',
                dots &&
                  'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              )}
            >
              {icon ? (
                <div
                  className="text-muted-foreground [&_svg]:size-3.5"
                  dangerouslySetInnerHTML={
                    typeof icon === 'string' ? { __html: icon } : undefined
                  }
                >
                  {typeof icon !== 'string' ? icon : null}
                </div>
              ) : null}
              <figcaption className="flex-1 truncate text-muted-foreground text-[13px]">
                {title}
              </figcaption>
            </div>
          )}

          {copyButton ? (
            <CopyButton
              content={code}
              size="sm"
              variant="ghost"
              className="-me-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
              {...(onCopy ? { onCopy } : {})}
            />
          ) : null}
        </div>
      ) : (
        copyButton && (
          <CopyButton
            content={code}
            size="sm"
            variant="ghost"
            className="absolute right-2 top-2 z-[2] backdrop-blur-md bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
            {...(onCopy ? { onCopy } : {})}
          />
        )
      )}
      <div
        ref={editorRef}
        className="h-[calc(100%-2.75rem)] w-full text-sm p-4 font-mono relative overflow-auto flex-1"
      >
        <div
          className={cn(
            '[&>pre,_&_code]:!bg-transparent [&>pre,_&_code]:[background:transparent_!important] [&>pre,_&_code]:border-none [&_code]:!text-[13px]',
            cursor &&
              !isDone &&
              "[&_.line:last-of-type::after]:content-['|'] [&_.line:last-of-type::after]:animate-pulse [&_.line:last-of-type::after]:inline-block [&_.line:last-of-type::after]:w-[1ch] [&_.line:last-of-type::after]:-translate-px",
          )}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>
    </div>
  );
}

export { CodeEditor, CopyButton, type CodeEditorProps, type CopyButtonProps };
