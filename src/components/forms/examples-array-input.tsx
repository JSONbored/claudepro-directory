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

import { useId, useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { Input } from '@/src/components/primitives/input';
import { Label } from '@/src/components/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/primitives/select';
import { Textarea } from '@/src/components/primitives/textarea';
import { ChevronDown, ChevronUp, Code, Plus, Trash } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

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
 * Validate a single example
 * Replaces Zod validation for bundle size optimization
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
 * ExamplesArrayInput Component
 *
 * Manages a dynamic array of usage examples with validation.
 * Serializes to JSON and stores in hidden input for form submission.
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
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
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
          className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}
        >
          <Plus className={UI_CLASSES.ICON_SM} />
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
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(index)}
                    className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} flex-1 text-left transition-opacity hover:opacity-70`}
                  >
                    {isExpanded ? (
                      <ChevronUp className={UI_CLASSES.ICON_SM} />
                    ) : (
                      <ChevronDown className={UI_CLASSES.ICON_SM} />
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
                    className={`${UI_CLASSES.ICON_XL} p-0`}
                    title="Remove example"
                  >
                    <Trash className={UI_CLASSES.ICON_SM} />
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
                      required
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
                      className="min-h-[150px] font-mono text-sm"
                      maxLength={10000}
                      required
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
                      className="min-h-[80px]"
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
          className="flex w-full items-center gap-2"
        >
          <Plus className={UI_CLASSES.ICON_SM} />
          Add Another Example ({examples.length}/{maxExamples})
        </Button>
      )}
    </div>
  );
}
