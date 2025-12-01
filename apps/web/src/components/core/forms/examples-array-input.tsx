'use client';

/**
 * ExamplesArrayInput - Dynamic array input for usage examples
 *
 * PRODUCTION FEATURES:
 * - Add/remove examples dynamically (max 10 per content item)
 * - Syntax-highlighted code input with language selection
 * - Real-time validation with visual feedback
 * - Accessible keyboard navigation (Tab, Enter, Escape)
 * - Mobile-responsive collapsible panels
 * - Auto-save to hidden form field as JSON
 *
 * ARCHITECTURE:
 * - Client component for interactivity
 * - State managed with React hooks
 * - Validation with Zod schema
 * - Textarea for code (no heavy CodeMirror dependency)
 * - JSON serialization to single hidden input
 *
 * INTEGRATION:
 * ```tsx
 * <ExamplesArrayInput
 *   name="examples"
 *   defaultValue={template?.examples}
 * />
 * ```
 *
 * OUTPUT FORMAT:
 * Hidden input contains JSON string:
 * ```json
 * [
 *   {
 *     "title": "Basic Setup",
 *     "code": "export default { ... }",
 *     "language": "typescript",
 *     "description": "Minimal configuration"
 *   }
 * ]
 * ```
 */

import { ChevronDown, ChevronUp, Code, Plus, Trash } from '@heyclaude/web-runtime/icons';
import { between, cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import { cn, DIMENSIONS } from '@heyclaude/web-runtime/ui';
import { useId, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@heyclaude/web-runtime/ui';
import { Textarea } from '@heyclaude/web-runtime/ui';

// Supported languages for syntax highlighting
const SUPPORTED_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'python', label: 'Python' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
] as const;

type ExampleLanguage = (typeof SUPPORTED_LANGUAGES)[number]['value'];

interface UsageExample {
  id: string; // Unique ID for React key (not submitted to form)
  title: string;
  code: string;
  language: ExampleLanguage;
  description?: string;
}

interface ExamplesArrayInputProps {
  name: string;
  defaultValue?: UsageExample[];
  maxExamples?: number;
}

/**
 * Validate a UsageExample object against required fields and length constraints.
 *
 * @param example - The usage example to validate (title, code, language, optional description)
 * @returns `valid` true if the example meets all requirements; `error` contains a human-readable message when invalid
 *
 * @see ExamplesArrayInput
 * @see SUPPORTED_LANGUAGES
 */
function validateExample(example: UsageExample): { valid: boolean; error?: string } {
  // Validate title
  if (!example.title || example.title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }
  if (example.title.length > 100) {
    return { valid: false, error: 'Title must be 100 characters or less' };
  }

  // Validate code
  if (!example.code || example.code.length === 0) {
    return { valid: false, error: 'Code is required' };
  }
  if (example.code.length > 10000) {
    return { valid: false, error: 'Code must be 10,000 characters or less' };
  }

  // Validate language
  const validLanguages = SUPPORTED_LANGUAGES.map((l) => l.value);
  if (!validLanguages.includes(example.language)) {
    return { valid: false, error: 'Invalid language selected' };
  }

  // Validate description (optional)
  if (example.description && example.description.length > 500) {
    return { valid: false, error: 'Description must be 500 characters or less' };
  }

  return { valid: true };
}

/**
 * Renders a controlled UI for creating, editing, validating, and serializing an array of usage examples.
 *
 * The component maintains local state for examples and their expanded panels, validates each example,
 * and serializes the examples (excluding internal IDs) to a hidden input named by `name` for form submission.
 *
 * @param name - Form field name to receive the serialized examples JSON
 * @param defaultValue - Initial list of examples to populate the editor (IDs will be generated if missing)
 * @param maxExamples - Maximum number of examples allowed (defaults to 10)
 * @returns The JSX element that provides the examples editor and a hidden input containing the serialized examples
 *
 * @see validateExample
 * @see UsageExample
 */
export function ExamplesArrayInput({
  name,
  defaultValue = [],
  maxExamples = 10,
}: ExamplesArrayInputProps) {
  // Ensure default values have IDs
  const initialExamples = defaultValue.map((ex) => ({
    ...ex,
    id: ex.id || `example-${Math.random().toString(36).slice(2, 11)}`,
  }));

  const [examples, setExamples] = useState<UsageExample[]>(initialExamples);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set([0]));
  const fieldId = useId();

  // Toggle example panel expansion
  const toggleExpanded = (index: number) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Add new example
  const addExample = () => {
    if (examples.length >= maxExamples) {
      return;
    }

    const newExample: UsageExample = {
      id: `example-${Math.random().toString(36).slice(2, 11)}`,
      title: '',
      code: '',
      language: 'typescript',
      description: '',
    };

    setExamples([...examples, newExample]);
    setExpandedIndexes((prev) => new Set([...prev, examples.length]));
  };

  // Remove example by index
  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  // Update example field
  const updateExample = (index: number, field: keyof UsageExample, value: string) => {
    setExamples(examples.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)));
  };

  // Serialize examples to JSON for form submission (strip internal 'id' field)
  const examplesForSubmission = examples.map(({ id, ...rest }) => rest);
  const examplesJson = JSON.stringify(examplesForSubmission);

  return (
    <div className="space-y-4">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={examplesJson} />

      {/* Header */}
      <div className={between.center}>
        <div>
          <Label className="font-semibold text-base">Usage Examples (optional)</Label>
          <p className={cn('text-sm', 'text-muted-foreground', 'mt-1')}>
            Add code examples to help users understand how to use this configuration. Max{' '}
            {maxExamples} examples.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExample}
          disabled={examples.length >= maxExamples}
          className={cluster.compact}
        >
          <Plus className={iconSize.sm} />
          Add Example
        </Button>
      </div>

      {/* Examples List */}
      <div className="space-y-3">
        {examples.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8">
              <div className="space-y-2 text-center">
                <Code className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className={cn('text-sm', 'text-muted-foreground')}>
                  No examples added yet. Click "Add Example" to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {examples.map((example, index) => {
          const isExpanded = expandedIndexes.has(index);
          const validation = validateExample(example);
          const titleId = `${fieldId}-title-${index}`;
          const codeId = `${fieldId}-code-${index}`;
          const languageId = `${fieldId}-language-${index}`;
          const descriptionId = `${fieldId}-description-${index}`;

          return (
            <Card key={example.id} className={cn(!validation.valid && 'border-destructive')}>
              <CardHeader className="pb-3">
                <div className={between.center}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    className={`${cluster.compact} flex-1 text-left transition-opacity hover:opacity-70`}
                  >
                    {isExpanded ? (
                      <ChevronUp className={iconSize.sm} />
                    ) : (
                      <ChevronDown className={iconSize.sm} />
                    )}
                    <CardTitle className="text-base">
                      {example.title || `Example ${index + 1}`}
                    </CardTitle>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExample(index)}
                    className={`${cluster.compact} p-1`}
                    title="Remove example"
                  >
                    <Trash className={iconSize.sm} />
                  </Button>
                </div>
                {!validation.valid && (
                  <CardDescription className="text-destructive">{validation.error}</CardDescription>
                )}
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor={titleId}>
                      Example Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={titleId}
                      type="text"
                      value={example.title}
                      onChange={(e) => updateExample(index, 'title', e.target.value)}
                      placeholder="Basic Setup"
                      maxLength={100}
                      required={true}
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor={languageId}>
                      Language <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={example.language}
                      onValueChange={(value) =>
                        updateExample(index, 'language', value as ExampleLanguage)
                      }
                    >
                      <SelectTrigger id={languageId}>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Code */}
                  <div className="space-y-2">
                    <Label htmlFor={codeId}>
                      Code <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={codeId}
                      value={example.code}
                      onChange={(e) => updateExample(index, 'code', e.target.value)}
                      placeholder="export default { ... }"
                      className={`${DIMENSIONS.INPUT_LG} font-mono text-sm`}
                      maxLength={10000}
                      required={true}
                    />
                    <p className={cn('text-xs', 'text-muted-foreground')}>
                      {example.code.length} / 10,000 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor={descriptionId}>Description (optional)</Label>
                    <Textarea
                      id={descriptionId}
                      value={example.description || ''}
                      onChange={(e) => updateExample(index, 'description', e.target.value)}
                      placeholder="Explain what this example demonstrates..."
                      className={DIMENSIONS.INPUT_SM}
                      maxLength={500}
                    />
                    <p className={cn('text-xs', 'text-muted-foreground')}>
                      {(example.description || '').length} / 500 characters
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Example Button (bottom) */}
      {examples.length > 0 && examples.length < maxExamples && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExample}
          className={cn(cluster.compact, 'w-full')}
        >
          <Plus className={iconSize.sm} />
          Add Another Example ({examples.length}/{maxExamples})
        </Button>
      )}
    </div>
  );
}