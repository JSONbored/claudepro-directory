/**
 * Hook Detail Page Section Components
 * Optimized, reusable section components for hook detail pages
 */

import { AlertTriangle, Copy, Lightbulb } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HookContent } from '@/lib/schemas/content.schema';

// Extended hook content interface to handle additional properties that may exist
interface ExtendedHookContent extends HookContent {
  matchers?: string[];
}

// Memoized dot component for list items
const ListDot = memo(({ color = 'primary' }: { color?: string }) => (
  <div className={`h-1.5 w-1.5 rounded-full bg-${color} mt-2 flex-shrink-0`} />
));
ListDot.displayName = 'ListDot';

// Memoized list item component
const ListItem = memo(
  ({ children, dotColor = 'primary' }: { children: ReactNode; dotColor?: string }) => (
    <li className="flex items-start gap-3">
      <ListDot color={dotColor} />
      <span className="text-sm leading-relaxed">{children}</span>
    </li>
  )
);
ListItem.displayName = 'ListItem';

// Optimized Requirements Section
export const RequirementsSection = memo(({ requirements }: { requirements: string[] }) => {
  if (!requirements?.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-orange-500" />
        <h4 className="font-semibold">Requirements</h4>
      </div>
      <ul className="space-y-2">
        {requirements.map((req) => (
          <ListItem key={req} dotColor="orange-500">
            {req}
          </ListItem>
        ))}
      </ul>
    </div>
  );
});
RequirementsSection.displayName = 'RequirementsSection';

// Optimized Use Cases Section
export const UseCasesSection = memo(({ useCases }: { useCases: string[] }) => (
  <ul className="space-y-2">
    {useCases.map((useCase) => (
      <ListItem key={useCase} dotColor="accent">
        {useCase}
      </ListItem>
    ))}
  </ul>
));
UseCasesSection.displayName = 'UseCasesSection';

// Optimized Troubleshooting Section
export const TroubleshootingSection = memo(
  ({
    troubleshooting,
  }: {
    troubleshooting: Array<{ issue: string; solution: string } | string>;
  }) => (
    <ul className="space-y-4">
      {troubleshooting.map((tip, index) => {
        const key = typeof tip === 'string' ? `tip-${index}` : `issue-${index}`;

        if (typeof tip === 'string') {
          return (
            <ListItem key={key} dotColor="red-500">
              {tip}
            </ListItem>
          );
        }

        return (
          <li key={key} className="space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{tip.issue}</p>
                <p className="text-sm text-muted-foreground">{tip.solution}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  )
);
TroubleshootingSection.displayName = 'TroubleshootingSection';

// Optimized Hook Details Section
export const HookDetailsSection = memo(({ item }: { item: ExtendedHookContent }) => {
  const hookTypeColors = {
    PreToolUse: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    PostToolUse: 'bg-green-500/20 text-green-500 border-green-500/30',
  } as const;

  return (
    <div className="space-y-4">
      {/* Category */}
      {item.category && (
        <div>
          <h4 className="font-medium mb-1">Category</h4>
          <Badge
            variant="default"
            className="text-xs font-medium bg-pink-500/20 text-pink-500 border-pink-500/30"
          >
            {item.category === 'hooks' ? 'Hook' : item.category}
          </Badge>
        </div>
      )}

      {/* Hook Type */}
      {item.hookType && (
        <div>
          <h4 className="font-medium mb-1">Hook Type</h4>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="default"
              className={`text-xs font-medium ${
                hookTypeColors[item.hookType as keyof typeof hookTypeColors] ||
                'bg-gray-500/20 text-gray-500 border-gray-500/30'
              }`}
            >
              {item.hookType}
            </Badge>
          </div>
        </div>
      )}

      {/* Tool Matchers */}
      {item.matchers && Array.isArray(item.matchers) && item.matchers.length > 0 && (
        <div>
          <h4 className="font-medium mb-1">Tool Matchers</h4>
          <div className="flex flex-wrap gap-1">
            {item.matchers.map((matcher: string) => (
              <Badge key={matcher} variant="secondary" className="text-xs font-mono">
                {matcher}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div>
          <h4 className="font-medium mb-1">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {item.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
HookDetailsSection.displayName = 'HookDetailsSection';

// Optimized Installation Steps Component
export const InstallationSteps = memo(
  ({ steps }: { steps: Array<{ step: number; instruction: string; command?: string }> }) => (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={`step-${step.step}`} className="flex gap-3">
          <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
            {step.step}
          </span>
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-sm leading-relaxed">{step.instruction}</p>
            {step.command && (
              <div className="relative">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                  <code>{step.command}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(step.command!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
);
InstallationSteps.displayName = 'InstallationSteps';
