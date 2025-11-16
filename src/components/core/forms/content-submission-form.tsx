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

import { motion } from 'motion/react';
import { useEffect, useId, useState, useTransition } from 'react';
import { z } from 'zod';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent } from '@/src/components/primitives/ui/card';
import { Input } from '@/src/components/primitives/ui/input';
import { Label } from '@/src/components/primitives/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/ui/tabs';
import { Textarea } from '@/src/components/primitives/ui/textarea';
import { submitContentForReview } from '@/src/lib/actions/content.actions';
import { getAnimationConfig } from '@/src/lib/actions/feature-flags.actions';
import { useAuthenticatedUser } from '@/src/lib/auth/use-authenticated-user';
import {
  SUBMISSION_CONTENT_TYPES,
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type TextFieldDefinition,
} from '@/src/lib/forms/types';
import { CheckCircle, Code, FileText, Github, Layers, Send, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';
import { normalizeError } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type {
  ContentCategory,
  GetContentTemplatesReturn,
  SubmissionStatus,
  SubmissionType,
} from '@/src/types/database-overrides';
import { DuplicateWarning } from './duplicate-warning';
import { ContentTypeFieldRenderer } from './dynamic-form-field';
import { ExamplesArrayInput } from './examples-array-input';
import { FormSectionCard } from './form-section-card';
import { TemplateSelector } from './template-selector';

/**
 * Examples array schema (Zod)
 * Production-grade runtime validation for form examples field
 */
const examplesArraySchema = z.array(z.string());

const DEFAULT_CONTENT_TYPE: SubmissionContentType = 'agents' as SubmissionType;

const EMPTY_SECTION: SubmissionFormSection = {
  nameField: null,
  common: [],
  typeSpecific: [],
  tags: [],
};

const FALLBACK_NAME_FIELD: TextFieldDefinition = {
  type: 'text',
  name: 'name',
  label: 'Name *',
  placeholder: 'e.g., "React Query Expert" or "Supabase MCP Server"',
  required: true,
  helpText: 'A clear, descriptive name for your configuration',
  gridColumn: 'full',
};

const FORM_TYPE_LABELS: Record<SubmissionContentType, string> = {
  agents: 'Claude Agent (System Prompt)',
  mcp: 'MCP Server',
  rules: 'Claude Rule (Expertise)',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
  skills: 'Skill',
};

interface SubmitFormClientProps {
  formConfig: SubmissionFormConfig;
  templates: GetContentTemplatesReturn;
}

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
export function SubmitFormClient({ formConfig, templates }: SubmitFormClientProps) {
  /**
   * Minimal React State (only what requires reactivity)
   */

  /** Content type for dynamic field rendering */
  const [contentType, setContentType] = useState<SubmissionContentType>(DEFAULT_CONTENT_TYPE);

  /** Name for real-time duplicate checking */
  const [name, setName] = useState('');

  /** Description for markdown preview */
  const [description, setDescription] = useState('');

  /** Form submission loading state */
  const [isPending, startTransition] = useTransition();

  /** Submission result for success message display */
  const [submissionResult, setSubmissionResult] = useState<{
    submission_id: string;
    status: SubmissionStatus;
    message: string;
  } | null>(null);

  /** Animation configs */
  const [springSmooth, setSpringSmooth] = useState({
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  });
  const [springBouncy, setSpringBouncy] = useState({
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  });
  const { user } = useAuthenticatedUser({
    context: 'ContentSubmissionForm',
    subscribe: false,
  });

  useEffect(() => {
    getAnimationConfig({})
      .then((result) => {
        if (!result?.data) return;
        const config = result.data;
        setSpringSmooth({
          type: 'spring' as const,
          stiffness: config['animation.spring.smooth.stiffness'],
          damping: config['animation.spring.smooth.damping'],
        });
        setSpringBouncy({
          type: 'spring' as const,
          stiffness: config['animation.spring.bouncy.stiffness'],
          damping: config['animation.spring.bouncy.damping'],
        });
      })
      .catch((error) => {
        logger.error('SubmitFormClient: failed to load animation config', error);
      });
  }, []);

  /**
   * Single ID prefix for ALL form fields
   * Config-driven pattern: `${formId}-${fieldName}`
   */
  const formId = useId();

  // Handle template selection
  // Templates are type-safe discriminated unions for UI pre-fill convenience
  const handleTemplateSelect = (template: GetContentTemplatesReturn[number]) => {
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
    if (categoryInput && template.category) categoryInput.value = template.category;

    const tagsInput = form.querySelector('[name="tags"]') as HTMLInputElement;
    if (tagsInput && template.tags) tagsInput.value = template.tags;

    if (template.type === 'agent') {
      const promptInput = form.querySelector('[name="systemPrompt"]') as HTMLTextAreaElement;
      if (promptInput && typeof template.systemPrompt === 'string')
        promptInput.value = template.systemPrompt;

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput && typeof template.temperature === 'number')
        tempInput.value = template.temperature.toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput && typeof template.maxTokens === 'number')
        tokensInput.value = template.maxTokens.toString();
    }

    if (template.type === 'rules') {
      const rulesInput = form.querySelector('[name="rulesContent"]') as HTMLTextAreaElement;
      if (rulesInput && typeof template.rulesContent === 'string')
        rulesInput.value = template.rulesContent;

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput && typeof template.temperature === 'number')
        tempInput.value = template.temperature.toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput && typeof template.maxTokens === 'number')
        tokensInput.value = template.maxTokens.toString();
    }

    if (template.type === 'mcp') {
      const npmInput = form.querySelector('[name="npmPackage"]') as HTMLInputElement;
      if (npmInput && typeof template.npmPackage === 'string') npmInput.value = template.npmPackage;

      const typeInput = form.querySelector('[name="serverType"]') as HTMLSelectElement;
      if (typeInput && typeof template.serverType === 'string')
        typeInput.value = template.serverType;

      const installInput = form.querySelector('[name="installCommand"]') as HTMLInputElement;
      if (installInput && typeof template.installCommand === 'string')
        installInput.value = template.installCommand;

      const configInput = form.querySelector('[name="configCommand"]') as HTMLInputElement;
      if (configInput && typeof template.configCommand === 'string')
        configInput.value = template.configCommand;

      const toolsInput = form.querySelector('[name="toolsDescription"]') as HTMLTextAreaElement;
      if (toolsInput && typeof template.toolsDescription === 'string')
        toolsInput.value = template.toolsDescription;

      if (template.envVars && typeof template.envVars === 'string') {
        const envInput = form.querySelector('[name="envVars"]') as HTMLTextAreaElement;
        if (envInput) envInput.value = template.envVars;
      }
    }

    if (template.type === 'command') {
      const cmdInput = form.querySelector('[name="commandContent"]') as HTMLTextAreaElement;
      if (cmdInput && typeof template.commandContent === 'string') {
        cmdInput.value = template.commandContent;
      }
    }

    toasts.success.templateApplied();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        if (!user) {
          toasts.error.submissionFailed('You must be signed in to submit content');
          return;
        }

        const formData = new FormData(event.currentTarget);

        /**
         * DATABASE-FIRST SUBMISSION
         * Extract form fields and call RPC directly.
         * Database validates via CHECK constraints.
         */
        const submissionData: Record<string, unknown> = {};

        // Extract all form fields generically
        for (const [key, value] of formData.entries()) {
          // Handle examples JSON parsing
          if (key === 'examples') {
            const examplesJson = value as string;
            if (examplesJson && examplesJson !== '[]') {
              try {
                submissionData.examples = safeParse(examplesJson, examplesArraySchema, {
                  strategy: ParseStrategy.VALIDATED_JSON,
                });
              } catch (error) {
                logger.warn('Failed to parse examples JSON, field will be omitted', {
                  error: error instanceof Error ? error.message : String(error),
                });
                toasts.raw.warning('Examples field could not be parsed and will be omitted');
                submissionData.examples = undefined;
              }
            }
            continue;
          }

          submissionData[key] = value || undefined;
        }

        // Validate required fields before casting
        const requiredFields = ['name', 'description', 'category', 'author'] as const;
        for (const field of requiredFields) {
          if (!submissionData[field] || typeof submissionData[field] !== 'string') {
            toasts.error.submissionFailed(`Missing or invalid required field: ${field}`);
            return;
          }
        }

        // Server action call - database validates everything
        const tags = submissionData.tags
          ? (submissionData.tags as string)
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0)
          : undefined;

        const result = await submitContentForReview({
          submission_type: contentType,
          name: submissionData.name as string,
          description: submissionData.description as string,
          category: submissionData.category as ContentCategory,
          author: submissionData.author as string,
          author_profile_url: submissionData.author_profile_url as string | undefined,
          github_url: submissionData.github_url as string | undefined,
          tags,
          content_data: submissionData,
        });

        if (result?.serverError || result?.validationErrors) {
          logger.error(
            'Submission server action failed',
            new Error(result.serverError || 'Validation failed'),
            {
              component: 'SubmitFormClient',
              contentType,
              submissionType: contentType,
              hasName: !!submissionData.name,
              hasDescription: !!submissionData.description,
              hasAuthor: !!submissionData.author,
            }
          );
          toasts.error.submissionFailed(
            result.serverError || 'Failed to submit content. Please try again or contact support.'
          );
          return;
        }

        if (result?.data?.success) {
          if (!result.data.submissionId) {
            logger.warn('Success response missing submission ID', {
              component: 'SubmitFormClient',
              contentType,
            });
          }

          setSubmissionResult({
            submission_id: result.data.submissionId || 'unknown',
            status: 'pending',
            message: 'Your submission has been received and is pending review!',
          });

          toasts.success.submissionCreated(contentType);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Content submission failed');
        logger.error('Submission failed', normalized, {
          component: 'SubmitFormClient',
          contentType,
          hasName: !!name,
          hasDescription: !!description,
        });
        toasts.error.submissionFailed(error instanceof Error ? error.message : undefined);
      }
    });
  };

  const getSection = (type: SubmissionContentType): SubmissionFormSection => {
    return formConfig[type] ?? EMPTY_SECTION;
  };

  const activeSection = getSection(contentType);
  const sharedSection = formConfig[DEFAULT_CONTENT_TYPE] ?? EMPTY_SECTION;

  const nameFieldConfig = activeSection.nameField ?? sharedSection.nameField ?? FALLBACK_NAME_FIELD;

  const commonFields =
    activeSection.common.length > 0 ? activeSection.common : sharedSection.common;
  const tagFields = activeSection.tags.length > 0 ? activeSection.tags : sharedSection.tags;
  const typeSpecificFields = activeSection.typeSpecific;

  return (
    <>
      {/* Success Message with celebration animation */}
      {submissionResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={springSmooth}
        >
          <Card className={'mb-6 border-green-500/20 bg-green-500/5'}>
            <CardContent className={'pt-6'}>
              <div className={UI_CLASSES.FLEX_COL_SM_ROW_ITEMS_START}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...springBouncy, delay: 0.2 }}
                >
                  <CheckCircle
                    className={`h-6 w-6 text-green-500 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.p
                    className="font-semibold text-green-600 text-lg dark:text-green-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Submission Successful! 🎉
                  </motion.p>
                  <motion.p
                    className={'mt-1 text-muted-foreground text-sm'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {submissionResult.message}
                  </motion.p>
                  <motion.p
                    className={'mt-1 text-muted-foreground text-xs'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Status: {submissionResult.status} • ID:{' '}
                    {submissionResult.submission_id.slice(0, 8)}...
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Form - Sectioned with visual hierarchy */}
      <form onSubmit={handleSubmit} className={UI_CLASSES.SPACE_Y_6}>
        {/* Section 1: Content Type + Template */}
        <FormSectionCard
          step={1}
          title="Choose Configuration Type"
          description="Select what you're submitting"
          icon={Layers}
          theme="primary"
          showBorderBeam={false}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={UI_CLASSES.SPACE_Y_2}>
              <Label htmlFor={`${formId}-type`}>Content Type *</Label>
              <div className="relative">
                <Layers
                  className={cn(
                    UI_CLASSES.ICON_SM,
                    '-translate-y-1/2 pointer-events-none absolute top-1/2 left-3',
                    UI_CLASSES.TEXT_MUTED
                  )}
                />
                <select
                  id={`${formId}-type`}
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as SubmissionContentType);
                    setName(''); // Reset name when type changes
                  }}
                  required={true}
                  className={
                    'flex h-10 w-full rounded-md border border-input bg-background py-2 pr-3 pl-10 text-sm'
                  }
                >
                  {SUBMISSION_CONTENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {FORM_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={UI_CLASSES.SPACE_Y_2}>
              <Label>Quick Start</Label>
              <TemplateSelector templates={templates} onSelect={handleTemplateSelect} />
            </div>
          </div>
        </FormSectionCard>

        {/* Section 2: Basic Information */}
        <FormSectionCard
          step={2}
          title="Basic Information"
          description="Name and describe your configuration"
          icon={FileText}
          theme="blue"
          showBorderBeam={false}
        >
          <div className={UI_CLASSES.SPACE_Y_4}>
            {/* Name Field + Duplicate Warning */}
            <div className={UI_CLASSES.SPACE_Y_2}>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                <Label htmlFor={`${formId}-name`}>{nameFieldConfig.label}</Label>
                <span className={cn(UI_CLASSES.TEXT_XS_MUTED, 'font-medium')}>
                  {name.length}/100
                </span>
              </div>
              <div className="relative">
                <Input
                  id={`${formId}-name`}
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={nameFieldConfig.placeholder}
                  required={nameFieldConfig.required ?? true}
                  maxLength={100}
                  className="pr-10"
                />
                {name.length > 3 && (
                  <motion.div
                    className="-translate-y-1/2 absolute top-1/2 right-3"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springBouncy}
                  >
                    <CheckCircle className={cn(UI_CLASSES.ICON_SM, UI_CLASSES.ICON_SUCCESS)} />
                  </motion.div>
                )}
              </div>
              <p className={UI_CLASSES.TEXT_XS_MUTED}>
                {nameFieldConfig.helpText ?? 'A clear, descriptive name for your configuration'}
              </p>
              <DuplicateWarning contentType={contentType} name={name} />
            </div>

            {/* Description Field with Markdown Preview */}
            <div className={UI_CLASSES.SPACE_Y_2}>
              <Label htmlFor={`${formId}-description`}>Description *</Label>
              <Tabs defaultValue="write" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="write" className="flex-1">
                    Write
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="write" className="mt-2">
                  <Textarea
                    id={`${formId}-description`}
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your configuration does and how to use it..."
                    required={true}
                    rows={6}
                    className="resize-y font-sans"
                  />
                  <p className={cn(UI_CLASSES.TEXT_XS_MUTED, UI_CLASSES.MARGIN_TOP_MICRO)}>
                    Supports markdown formatting (bold, italic, lists, links, code blocks)
                  </p>
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                  <div
                    className={cn(
                      'min-h-[150px] rounded-md border border-input bg-background p-4',
                      'prose prose-sm dark:prose-invert max-w-none'
                    )}
                  >
                    {description ? (
                      <p className="whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className={UI_CLASSES.TEXT_MUTED}>
                        Nothing to preview yet. Write something in the Write tab!
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Other Common Fields (excluding description) */}
            {commonFields.length > 0 && (
              <ContentTypeFieldRenderer
                config={{ fields: commonFields.filter((f) => f.name !== 'description') }}
                formId={formId}
              />
            )}
          </div>
        </FormSectionCard>

        {/* Section 3: Type-Specific Configuration */}
        {typeSpecificFields.length > 0 && (
          <FormSectionCard
            step={3}
            title="Type-Specific Configuration"
            description={`Configuration details for ${FORM_TYPE_LABELS[contentType]}`}
            icon={Code}
            theme="green"
            showBorderBeam={false}
          >
            <ContentTypeFieldRenderer config={{ fields: typeSpecificFields }} formId={formId} />
          </FormSectionCard>
        )}

        {/* Section 4: Examples & Tags */}
        <FormSectionCard
          step={4}
          title="Examples & Tags"
          description="Help users understand how to use your configuration"
          icon={Sparkles}
          theme="purple"
          showBorderBeam={false}
        >
          <div className={UI_CLASSES.SPACE_Y_4}>
            {/* Tags Field */}
            {tagFields.length > 0 && (
              <ContentTypeFieldRenderer config={{ fields: tagFields }} formId={formId} />
            )}

            {/* Usage Examples */}
            <ExamplesArrayInput name="examples" maxExamples={10} />
          </div>
        </FormSectionCard>

        {/* Enhanced Submit Button */}
        <motion.div
          className={`${UI_CLASSES.FLEX_COL_SM_ROW_GAP_3} pt-2 sm:pt-4`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button type="submit" disabled={isPending} className={'w-full flex-1 sm:flex-initial'}>
            {isPending ? (
              <>
                <motion.div
                  className="mr-2"
                  animate={{ opacity: [1, 0.5, 1], rotate: [0, 360] }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                >
                  <Github className={UI_CLASSES.ICON_SM} />
                </motion.div>
                Creating PR...
              </>
            ) : (
              <>
                <Send className={UI_CLASSES.ICON_SM_LEADING} />
                Submit for Review
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 sm:p-4">
          <div className={`${UI_CLASSES.FLEX_GAP_2} sm:gap-3`}>
            <Github className={`h-5 w-5 text-blue-400 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
            <div className="min-w-0 flex-1">
              <p className={'font-medium text-blue-400 text-sm'}>How it works</p>
              <p className={'mt-1 text-muted-foreground text-sm'}>
                We'll automatically create a Pull Request with your submission. Our team reviews for
                quality and accuracy, then merges it to make your contribution live!
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
