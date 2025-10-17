'use client';

/**
 * Submit Form Client Component
 * Handles all form logic, state, and submission
 * Integrated with template selector and duplicate detection
 *
 * RESPONSIVE DESIGN:
 * - Desktop: Full-width form fields, grid layouts for numeric inputs
 * - Tablet: Responsive grids (grid-cols-2 → grid-cols-1 on small screens)
 * - Mobile: Single column, optimized spacing
 */

import Link from 'next/link';
import { useId, useState, useTransition } from 'react';
import { z } from 'zod';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { submitConfiguration } from '@/src/lib/actions/business.actions';
import { COMMON_FIELDS, FORM_CONFIGS, TAGS_FIELD } from '@/src/lib/config/form-field-config';
import { ROUTES } from '@/src/lib/constants/routes';
import { CheckCircle, ExternalLink, Github, Send } from '@/src/lib/icons';
// Note: Server action already validates with configSubmissionSchema
// Client-side validation would be redundant and cause type mismatches
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import { ContentTypeFieldRenderer } from './content-type-field-renderer';
import { DuplicateWarning } from './duplicate-warning';
import { ExamplesArrayInput } from './examples-array-input';
import { type Template, TemplateSelector } from './template-selector';

/**
 * Examples array schema (Zod)
 * Production-grade runtime validation for form examples field
 */
const examplesArraySchema = z.array(z.string());

type ContentType = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills';

/**
 * Submit Form - Uncontrolled Form Pattern with Minimal State
 *
 * **Architecture Decision: Uncontrolled Fields + Minimal React State**
 *
 * This form uses an **uncontrolled pattern** where form fields manage their own state
 * via native HTML DOM, and we extract values via FormData on submit. We only use
 * React state for values that REQUIRE reactivity:
 *
 * 1. `contentType` - Dynamic field rendering (entire form structure changes)
 * 2. `name` - Real-time duplicate checking (API calls on every keystroke)
 * 3. `submissionResult` - Success message display after submission
 * 4. `isPending` - Loading state during form submission
 *
 * **Why Uncontrolled?**
 * - Performance: No re-renders on every keystroke
 * - Simplicity: No controlled value/onChange boilerplate for 20+ fields
 * - Native validation: Browser-native required/pattern validation
 * - FormData API: Clean extraction of all fields on submit
 *
 * **Why These 4 State Variables?**
 * - contentType: Must trigger re-render to show/hide type-specific fields
 * - name: Must be reactive for <DuplicateWarning> real-time API checks
 * - submissionResult: Must persist after async submission completes
 * - isPending: Must disable submit button and show loading state
 *
 * **Template Pre-fill Strategy:**
 * Template selection directly mutates DOM via querySelector('[name="..."]')
 * This is intentional - we want instant field updates without triggering
 * React re-renders for all 20+ fields.
 *
 * @see https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData
 */
export function SubmitFormClient() {
  /**
   * Minimal React State (only what requires reactivity)
   */

  /** Content type for dynamic field rendering */
  const [contentType, setContentType] = useState<ContentType>('agents');

  /** Name for real-time duplicate checking */
  const [name, setName] = useState('');

  /** Form submission loading state */
  const [isPending, startTransition] = useTransition();

  /** Submission result for success message display */
  const [submissionResult, setSubmissionResult] = useState<{
    prUrl: string;
    prNumber: number;
    slug: string;
  } | null>(null);

  /**
   * Single ID prefix for ALL form fields
   * Config-driven pattern: `${formId}-${fieldName}`
   */
  const formId = useId();

  // Handle template selection
  // Templates are type-safe discriminated unions for UI pre-fill convenience
  const handleTemplateSelect = (template: Template) => {
    // Pre-fill form with template data using name attributes
    // NOTE: Cannot use querySelector('#id') because useId() generates dynamic IDs like ':r0:'
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    // Set common fields (present in all templates)
    setName(template.name);
    const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
    if (nameInput) nameInput.value = template.name;

    const descInput = form.querySelector('[name="description"]') as HTMLTextAreaElement;
    if (descInput) descInput.value = template.description;

    const categoryInput = form.querySelector('[name="category"]') as HTMLInputElement;
    if (categoryInput) categoryInput.value = template.category;

    const tagsInput = form.querySelector('[name="tags"]') as HTMLInputElement;
    if (tagsInput) tagsInput.value = template.tags;

    // Type-specific fields with TypeScript type narrowing
    if (template.type === 'agent') {
      const promptInput = form.querySelector('[name="systemPrompt"]') as HTMLTextAreaElement;
      if (promptInput) promptInput.value = template.systemPrompt;

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput) tempInput.value = template.temperature.toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput) tokensInput.value = template.maxTokens.toString();
    }

    if (template.type === 'rules') {
      const rulesInput = form.querySelector('[name="rulesContent"]') as HTMLTextAreaElement;
      if (rulesInput) rulesInput.value = template.rulesContent;

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput) tempInput.value = template.temperature.toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput) tokensInput.value = template.maxTokens.toString();
    }

    if (template.type === 'mcp') {
      const npmInput = form.querySelector('[name="npmPackage"]') as HTMLInputElement;
      if (npmInput) npmInput.value = template.npmPackage;

      const typeInput = form.querySelector('[name="serverType"]') as HTMLSelectElement;
      if (typeInput) typeInput.value = template.serverType;

      const installInput = form.querySelector('[name="installCommand"]') as HTMLInputElement;
      if (installInput) installInput.value = template.installCommand;

      const configInput = form.querySelector('[name="configCommand"]') as HTMLInputElement;
      if (configInput) configInput.value = template.configCommand;

      const toolsInput = form.querySelector('[name="toolsDescription"]') as HTMLTextAreaElement;
      if (toolsInput) toolsInput.value = template.toolsDescription;

      if (template.envVars) {
        const envInput = form.querySelector('[name="envVars"]') as HTMLTextAreaElement;
        if (envInput) envInput.value = template.envVars;
      }
    }

    if (template.type === 'command') {
      const cmdInput = form.querySelector('[name="commandContent"]') as HTMLTextAreaElement;
      if (cmdInput) cmdInput.value = template.commandContent;
    }

    toasts.success.templateApplied();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData(event.currentTarget);

        /**
         * CONFIGURATION-DRIVEN SUBMISSION
         * Extract all form fields generically and pass to server action.
         * Server action validates with configSubmissionSchema which handles:
         * - Type discrimination (based on `type` field)
         * - Coercion (string → number)
         * - Validation (min/max/regex)
         * - Transformation (trim, split tags/arrays)
         * - Sanitization (security transforms)
         *
         * Adding new content types = just update form.schema.ts
         * Zero changes needed here!
         */
        const submissionData: Record<string, unknown> = {
          type: contentType,
        };

        // Extract all form fields generically
        for (const [key, value] of formData.entries()) {
          // Handle examples JSON parsing with production-grade validation
          if (key === 'examples') {
            const examplesJson = value as string;
            if (examplesJson && examplesJson !== '[]') {
              try {
                // Production-grade: safeParse with Zod validation (client-safe VALIDATED_JSON strategy)
                submissionData.examples = safeParse(examplesJson, examplesArraySchema, {
                  strategy: ParseStrategy.VALIDATED_JSON,
                });
              } catch {
                // Invalid JSON - server will handle validation error
                submissionData.examples = undefined;
              }
            }
            continue;
          }

          // Add all other fields as-is (server will coerce/transform via Zod)
          submissionData[key] = value || undefined;
        }

        /**
         * Submit to server action for validation
         * Type assertion is correct here because:
         * 1. Data shape is unknown at compile-time (user input)
         * 2. Server validates at runtime with configSubmissionSchema (Zod)
         * 3. This is proper separation: client collects, server validates
         */
        // biome-ignore lint/suspicious/noExplicitAny: Passing unknown user data to validating server action
        const result = await submitConfiguration(submissionData as any);

        if (result?.data?.success) {
          setSubmissionResult({
            prUrl: result.data.prUrl,
            prNumber: result.data.prNumber,
            slug: result.data.slug,
          });

          toasts.success.submissionCreated(contentType);

          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        toasts.error.submissionFailed(error instanceof Error ? error.message : undefined);
      }
    });
  };

  return (
    <>
      {/* Success Message */}
      {submissionResult && (
        <Card className={'mb-6 border-green-500/20 bg-green-500/5'}>
          <CardContent className={'pt-6'}>
            <div className={UI_CLASSES.FLEX_COL_SM_ROW_ITEMS_START}>
              <CheckCircle
                className={`h-5 w-5 text-green-500 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Submission Successful! 🎉</p>
                <p className={'text-sm text-muted-foreground mt-1'}>
                  Your configuration has been submitted for review. Pull Request #
                  {submissionResult.prNumber} created on GitHub.
                </p>
                <div className={`${UI_CLASSES.FLEX_COL_SM_ROW_GAP_2} mt-3`}>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={submissionResult.prUrl} target="_blank" rel="noopener noreferrer">
                      View PR <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={ROUTES.ACCOUNT_SUBMISSIONS}>Track Status</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Configuration Details</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Fill out the form - we'll handle the technical formatting for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Type Selection + Template Selector */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-type`}>Content Type *</Label>
                <select
                  id={`${formId}-type`}
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as ContentType);
                    setName(''); // Reset name when type changes
                  }}
                  required
                  className={
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  }
                >
                  <option value="agents">Claude Agent (System Prompt)</option>
                  <option value="mcp">MCP Server</option>
                  <option value="rules">Claude Rule (Expertise)</option>
                  <option value="commands">Command</option>
                  <option value="hooks">Hook</option>
                  <option value="statuslines">Statusline</option>
                  <option value="skills">Skill</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quick Start</Label>
                <TemplateSelector contentType={contentType} onSelect={handleTemplateSelect} />
              </div>
            </div>

            {/* Name Field + Duplicate Warning (Special case - has interactive validation) */}
            <div className="space-y-2">
              <Label htmlFor={`${formId}-name`}>Name *</Label>
              <Input
                id={`${formId}-name`}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., React Query Expert or Supabase MCP Server"
                required
              />
              <p className="text-xs text-muted-foreground">
                A clear, descriptive name for your configuration
              </p>
              <DuplicateWarning contentType={contentType} name={name} />
            </div>

            {/* Common Fields - Config-Driven Rendering (description, category, author, github) */}
            <ContentTypeFieldRenderer config={{ fields: COMMON_FIELDS.slice(1) }} formId={formId} />

            {/* Type-Specific Fields - Config-Driven Rendering */}
            <ContentTypeFieldRenderer config={FORM_CONFIGS[contentType]} formId={formId} />

            {/* Tags Field - Config-Driven Rendering */}
            <ContentTypeFieldRenderer config={{ fields: [TAGS_FIELD] }} formId={formId} />

            {/* Usage Examples (All Types - Optional) */}
            <ExamplesArrayInput name="examples" maxExamples={10} />

            {/* Submit Button */}
            <div className={`${UI_CLASSES.FLEX_COL_SM_ROW_GAP_3} pt-2 sm:pt-4`}>
              <Button
                type="submit"
                disabled={isPending}
                className={'w-full flex-1 sm:flex-initial'}
              >
                {isPending ? (
                  <>
                    <Github className="mr-2 h-4 w-4 animate-pulse" />
                    Creating PR...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <div className={`${UI_CLASSES.FLEX_GAP_2} sm:gap-3`}>
                <Github className={`h-5 w-5 text-blue-400 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                <div className="flex-1 min-w-0">
                  <p className={'text-sm font-medium text-blue-400'}>How it works</p>
                  <p className={'text-sm text-muted-foreground mt-1'}>
                    We'll automatically create a Pull Request with your submission. Our team reviews
                    for quality and accuracy, then merges it to make your contribution live!
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
