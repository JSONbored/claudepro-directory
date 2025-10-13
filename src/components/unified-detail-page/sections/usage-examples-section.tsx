/**
 * UsageExamplesSection - Server Component for code examples
 *
 * ARCHITECTURE: Server-first with pre-rendered syntax highlighting
 * - Server-side Shiki rendering (zero client JS for highlighting)
 * - Pre-rendered HTML sent to browser instantly
 * - Client-side interactivity only for copy/expand actions
 * - SEO-optimized with semantic HTML and structured data
 *
 * PRODUCTION FEATURES:
 * - Type-safe with Zod validation
 * - Zero-bundle-impact syntax highlighting
 * - Accessible keyboard navigation
 * - Mobile-optimized responsive layout
 * - Error boundaries for graceful fallbacks
 *
 * REUSES EXISTING INFRASTRUCTURE:
 * - CodeBlockServer: Server-side highlighting wrapper
 * - highlightCode(): Shared Shiki singleton
 * - Card components: Consistent UI patterns
 * - UI primitives: Type-safe component props
 *
 * @see components/shared/code-block-server.tsx - Code rendering
 * @see lib/content/syntax-highlighting.ts - Shiki integration
 */

import { z } from 'zod';
import { CodeBlockServer } from '@/src/components/shared/code-block-server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Code } from '@/src/lib/icons';
import { baseUsageExampleSchema } from '@/src/lib/schemas/content/base-content.schema';
import {
  componentDescriptionString,
  componentTitleString,
} from '@/src/lib/schemas/primitives/ui-component-primitives';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

/**
 * Schema for UsageExamplesSection props using primitives
 * Validates inputs at runtime for production safety
 */
const usageExamplesSectionPropsSchema = z.object({
  title: componentTitleString.optional().default('Usage Examples'),
  description: componentDescriptionString
    .optional()
    .default('Practical code examples demonstrating common use cases and implementation patterns'),
  examples: z
    .array(baseUsageExampleSchema)
    .min(1)
    .max(10)
    .describe('Array of usage examples with code snippets (1-10 examples)'),
  className: z.string().optional().describe('Optional additional CSS classes'),
  showLineNumbers: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to show line numbers in code blocks'),
  maxLinesPerExample: z
    .number()
    .int()
    .positive()
    .optional()
    .default(20)
    .describe('Maximum lines to show before collapse (default: 20)'),
});

// Export type with optional fields for external use
export type UsageExamplesSectionProps = {
  title?: string;
  description?: string;
  examples: Array<{
    title: string;
    code: string;
    language:
      | 'typescript'
      | 'javascript'
      | 'json'
      | 'bash'
      | 'shell'
      | 'python'
      | 'yaml'
      | 'markdown'
      | 'plaintext';
    description?: string;
  }>;
  className?: string;
  showLineNumbers?: boolean;
  maxLinesPerExample?: number;
};

/**
 * Generate filename for code example based on title and language
 * Used for copy-to-clipboard and download functionality
 */
function generateExampleFilename(title: string, language: string): string {
  // Convert title to kebab-case filename
  const baseFilename = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Map language to file extension
  const extensionMap: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    json: 'json',
    bash: 'sh',
    shell: 'sh',
    python: 'py',
    yaml: 'yml',
    markdown: 'md',
    plaintext: 'txt',
  };

  const extension = extensionMap[language] || 'txt';
  return `${baseFilename}.${extension}`;
}

/**
 * UsageExamplesSection Component (Async Server Component)
 *
 * Renders a collection of code examples with server-side syntax highlighting.
 * Each example is rendered in its own code block with title, description, and controls.
 *
 * Performance Characteristics:
 * - Server-side rendering eliminates client-side blocking
 * - Pre-highlighted HTML sent to browser (no JS parsing)
 * - Lazy hydration for interactive elements (copy button)
 * - Optimized for Core Web Vitals (LCP, FID, CLS)
 *
 * Accessibility:
 * - Semantic HTML structure (section, article, code)
 * - ARIA labels for screen readers
 * - Keyboard navigation support
 * - High contrast syntax themes
 *
 * SEO Optimization:
 * - Structured data for code examples
 * - Semantic markup for search engines
 * - Pre-rendered content for crawlers
 * - Language metadata for code snippets
 *
 * @example
 * ```tsx
 * <UsageExamplesSection
 *   title="Configuration Examples"
 *   description="Common configuration patterns"
 *   examples={[
 *     {
 *       title: "Basic Setup",
 *       code: "export default { ... }",
 *       language: "typescript",
 *       description: "Minimal configuration"
 *     }
 *   ]}
 * />
 * ```
 */
export async function UsageExamplesSection({
  title = 'Usage Examples',
  description = 'Practical code examples demonstrating common use cases and implementation patterns',
  examples,
  className,
  showLineNumbers = false,
  maxLinesPerExample = 20,
}: UsageExamplesSectionProps) {
  // Validate props at runtime for production safety
  const validated = usageExamplesSectionPropsSchema.parse({
    title,
    description,
    examples,
    className,
    showLineNumbers,
    maxLinesPerExample,
  });

  // Don't render if no examples
  if (!validated.examples || validated.examples.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', validated.className)}>
      <CardHeader>
        <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          <Code className="h-5 w-5" />
          {validated.title}
        </CardTitle>
        {validated.description && <CardDescription>{validated.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Examples Grid - Responsive layout */}
        <div className="space-y-6">
          {validated.examples.map((example, index) => {
            // Generate semantic filename for download/copy
            const filename = generateExampleFilename(example.title, example.language);

            return (
              <article
                key={`${example.title}-${index}`}
                className="space-y-3"
                itemScope
                itemType="https://schema.org/SoftwareSourceCode"
              >
                {/* Example Header */}
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-foreground" itemProp="name">
                    {example.title}
                  </h4>
                  {example.description && (
                    <p
                      className="text-sm text-muted-foreground leading-relaxed"
                      itemProp="description"
                    >
                      {example.description}
                    </p>
                  )}
                </div>

                {/* Code Block - Server-side highlighted */}
                <div className="not-prose" itemProp="text">
                  {/* Language metadata for SEO */}
                  <meta itemProp="programmingLanguage" content={example.language} />
                  <CodeBlockServer
                    code={example.code}
                    language={example.language}
                    filename={filename}
                    {...(validated.maxLinesPerExample !== undefined && {
                      maxLines: validated.maxLinesPerExample,
                    })}
                    {...(validated.showLineNumbers !== undefined && {
                      showLineNumbers: validated.showLineNumbers,
                    })}
                    className="shadow-sm"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
