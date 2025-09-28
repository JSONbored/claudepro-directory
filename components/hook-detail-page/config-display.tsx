/**
 * Hook Configuration Display Component
 * Optimized configuration rendering with lazy loading
 */

import { Copy } from 'lucide-react';
import { lazy, memo, Suspense } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { type HookContent, hookContentSchema } from '@/lib/schemas/content.schema';

// Lazy load CodeHighlight only when needed
const CodeHighlight = lazy(() =>
  import('@/components/code-highlight').then((module) => ({
    default: module.CodeHighlight,
  }))
);

// Zod schema for component props
const configDisplayPropsSchema = z.object({
  item: hookContentSchema,
  displayConfig: hookContentSchema.shape.configuration,
  onCopy: z.function(),
});

type ConfigDisplayProps = z.infer<typeof configDisplayPropsSchema>;

// Memoized loading skeleton for code blocks
const CodeSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="bg-muted rounded-md p-4 space-y-2">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
      <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
      <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
    </div>
  </div>
));
CodeSkeleton.displayName = 'CodeSkeleton';

// Optimized configuration display component
export const ConfigDisplay = memo(({ item, displayConfig, onCopy }: ConfigDisplayProps) => {
  // Separate script content and config for optimized rendering
  const scriptContent = item.configuration?.scriptContent as string | undefined;
  const hookConfig = displayConfig?.hookConfig;

  return (
    <div className="space-y-6">
      {/* Script Content */}
      {scriptContent && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Script Content</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(String(scriptContent))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Script
            </Button>
          </div>
          <Suspense fallback={<CodeSkeleton />}>
            <CodeHighlight code={String(scriptContent)} language="bash" showCopy={true} />
          </Suspense>
        </div>
      )}

      {/* Hook Configuration */}
      {hookConfig && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Hook Configuration</h4>
            <Button variant="ghost" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
          </div>
          <Suspense fallback={<CodeSkeleton />}>
            <CodeHighlight
              code={JSON.stringify(hookConfig, null, 2)}
              language="json"
              showCopy={true}
            />
          </Suspense>
        </div>
      )}

      {/* Additional Configuration */}
      {displayConfig && !hookConfig && !scriptContent && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Configuration</h4>
            <Button variant="ghost" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
          </div>
          <Suspense fallback={<CodeSkeleton />}>
            <CodeHighlight
              code={JSON.stringify(displayConfig, null, 2)}
              language="json"
              showCopy={true}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
});
ConfigDisplay.displayName = 'ConfigDisplay';

// Export a lightweight preview component for sidebar/cards
export const ConfigPreview = memo(({ config }: { config: HookContent['configuration'] }) => {
  const configStr = JSON.stringify(config, null, 2);
  const lines = configStr.split('\n').slice(0, 5);

  return (
    <div className="bg-muted rounded-md p-2">
      <pre className="text-xs text-muted-foreground overflow-hidden">
        <code>{lines.join('\n')}...</code>
      </pre>
    </div>
  );
});
ConfigPreview.displayName = 'ConfigPreview';
