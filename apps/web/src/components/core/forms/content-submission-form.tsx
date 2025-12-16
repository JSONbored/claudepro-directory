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

import { SubmissionType, SubmissionStatus } from '@heyclaude/data-layer/prisma';
import { submission_statusSchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
import type { submission_status, content_category } from '@heyclaude/data-layer/prisma';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import { submitContentForReview } from '@heyclaude/web-runtime/actions';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { ParseStrategy, safeParse } from '@heyclaude/web-runtime/data/utils';
import { SPRING, STAGGER, DURATION, responsive, marginTop, spaceY, iconSize, muted, size, between, marginRight, marginBottom, paddingTop, gap, paddingY, paddingLeft, paddingRight, padding } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { useLoggedAsync, useConfetti } from '@heyclaude/web-runtime/hooks';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { useAuthModal } from '@/src/hooks/use-auth-modal';
import {
  CheckCircle,
  Code,
  FileText,
  Github,
  Layers,
  Send,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  SUBMISSION_CONTENT_TYPES,
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type TextFieldDefinition,
} from '@heyclaude/web-runtime/types/component.types';
import {
  cn,
  toasts,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  FormSectionCard,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useId, useState, useTransition } from 'react';
import { z } from 'zod';

import { DuplicateWarning } from './duplicate-warning';
import { ContentTypeFieldRenderer } from './dynamic-form-field';
import { ExamplesArrayInput } from './examples-array-input';
import { TemplateSelector } from './template-selector';

import type { MergedTemplateItem } from '@heyclaude/web-runtime/data';

/**
 * Usage example schema (Zod)
 * Validates structured examples from ExamplesArrayInput component
 * Must match the output format of ExamplesArrayInput and expectations of content-detail-view.tsx
 */
const usageExampleSchema = z.object({
  title: z.string().min(1).max(100),
  code: z.string().min(1).max(10_000),
  language: z.enum([
    'typescript',
    'javascript',
    'json',
    'bash',
    'shell',
    'python',
    'yaml',
    'markdown',
    'plaintext',
  ]),
  description: z.string().max(500).optional(),
});

/**
 * Examples array schema (Zod)
 * Production-grade runtime validation for form examples field
 * Expects structured objects with title, code, language, and optional description
 */
const examplesArraySchema = z.array(usageExampleSchema);

// Use Prisma enum object directly (no type assertion needed - SubmissionType is the enum object)
const DEFAULT_CONTENT_TYPE: SubmissionContentType = SubmissionType.agents;

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
  templates: MergedTemplateItem[];
}

/**
 * Renders a multi-section submission form for creating content review PRs with dynamic fields and template pre-fill.
 *
 * The form uses an uncontrolled input pattern and minimal React state to drive only reactive pieces (content type selection, name for duplicate checking, description preview, submission status, and loading). It validates required fields from the active section, parses an optional JSON "examples" field, and submits a consolidated payload to the server action that creates a review submission.
 *
 * @param props.formConfig - Configuration object describing the form sections, fields, and validation metadata for each submission type
 * @param props.templates - List of templates used to pre-fill form fields for quick-starts
 * @returns The rendered submission form React element
 *
 * @see TemplateSelector
 * @see ExamplesArrayInput
 * @see ContentTypeFieldRenderer
 */
export function SubmitFormClient({ formConfig, templates }: SubmitFormClientProps) {
  /**
   * Minimal React State (only what requires reactivity)
   */

  const shouldReduceMotion = useReducedMotion();
  /** Content type for dynamic field rendering */
  const [contentType, setContentType] = useState<SubmissionContentType>(DEFAULT_CONTENT_TYPE);

  /** Name for real-time duplicate checking */
  const [name, setName] = useState('');

  /** Description for markdown preview */
  const [description, setDescription] = useState('');

  /** Form submission loading state */
  const [isPending, startTransition] = useTransition();

  const runLoggedAsync = useLoggedAsync({
    scope: 'SubmitFormClient',
    defaultMessage: 'Content submission failed',
    defaultRethrow: false,
  });
  const { celebrateSubmission } = useConfetti();

  /** Submission result for success message display */
  const [submissionResult, setSubmissionResult] = useState<null | {
    message: string;
    status: submission_status;
    submission_id: string;
  }>(null);

  /** Animation configs from design system */
  const springSmooth = SPRING.smooth;
  const springBouncy = SPRING.bouncy;
  
  const { user, status } = useAuthenticatedUser({
    context: 'ContentSubmissionForm',
    subscribe: false,
  });
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  /**
   * Single ID prefix for ALL form fields
   * Config-driven pattern: `${formId}-${fieldName}`
   */
  const formId = useId();

  // Handle template selection
  // Templates are type-safe discriminated unions for UI pre-fill convenience
  const handleTemplateSelect = (template: MergedTemplateItem) => {
    // Pre-fill form with template data using name attributes
    // NOTE: Cannot use querySelector('#id') because useId() generates dynamic IDs like ':r0:'
    // Type guard for form element
    const formElement = document.querySelector('form');
    if (!formElement || !(formElement instanceof HTMLFormElement)) {
      return;
    }
    const form = formElement;

    // Helper functions to safely query and type-check form elements
    function getFormInput(name: string): HTMLInputElement | null {
      const element = form.querySelector(`[name="${name}"]`);
      return element instanceof HTMLInputElement ? element : null;
    }

    function getFormTextarea(name: string): HTMLTextAreaElement | null {
      const element = form.querySelector(`[name="${name}"]`);
      return element instanceof HTMLTextAreaElement ? element : null;
    }

    function getFormSelect(name: string): HTMLSelectElement | null {
      const element = form.querySelector(`[name="${name}"]`);
      return element instanceof HTMLSelectElement ? element : null;
    }

    // Set common fields (present in all templates)
    const templateName = template['name'] ?? '';
    setName(templateName);
    const nameInput = getFormInput('name');
    if (nameInput) nameInput.value = templateName;

    const descInput = getFormTextarea('description');
    if (descInput) descInput.value = template['description'] || '';

    const categoryInput = getFormInput('category');
    if (categoryInput && template['category']) categoryInput.value = template['category'];

    const tagsInput = getFormInput('tags');
    if (tagsInput && template['tags']) tagsInput.value = template['tags'] ?? '';

    if (template.type === 'agent') {
      const promptInput = getFormTextarea('systemPrompt');
      if (promptInput && typeof template['systemPrompt'] === 'string')
        promptInput.value = template['systemPrompt'] ?? '';

      const tempInput = getFormInput('temperature');
      if (tempInput && typeof template['temperature'] === 'number')
        tempInput.value = template['temperature'].toString();

      const tokensInput = getFormInput('maxTokens');
      if (tokensInput && typeof template['maxTokens'] === 'number')
        tokensInput.value = template['maxTokens'].toString();
    }

    if (template.type === 'rules') {
      const rulesInput = getFormTextarea('rulesContent');
      if (rulesInput && typeof template['rulesContent'] === 'string')
        rulesInput.value = template['rulesContent'];

      const tempInput = getFormInput('temperature');
      if (tempInput && typeof template['temperature'] === 'number')
        tempInput.value = template['temperature'].toString();

      const tokensInput = getFormInput('maxTokens');
      if (tokensInput && typeof template['maxTokens'] === 'number')
        tokensInput.value = template['maxTokens'].toString();
    }

    if (template.type === 'mcp') {
      const npmInput = getFormInput('npmPackage');
      if (npmInput && typeof template['npmPackage'] === 'string')
        npmInput.value = template['npmPackage'];

      const typeInput = getFormSelect('serverType');
      if (typeInput && typeof template['serverType'] === 'string')
        typeInput.value = template['serverType'];

      const installInput = getFormInput('installCommand');
      if (installInput && typeof template['installCommand'] === 'string')
        installInput.value = template['installCommand'];

      const configInput = getFormInput('configCommand');
      if (configInput && typeof template['configCommand'] === 'string')
        configInput.value = template['configCommand'];

      const toolsInput = getFormTextarea('toolsDescription');
      if (toolsInput && typeof template['toolsDescription'] === 'string')
        toolsInput.value = template['toolsDescription'];

      if (template['envVars'] && typeof template['envVars'] === 'string') {
        const envInput = getFormTextarea('envVars');
        if (envInput) envInput.value = template['envVars'];
      }
    }

    if (template.type === 'command') {
      const cmdInput = getFormTextarea('commandContent');
      if (cmdInput && typeof template['commandContent'] === 'string') {
        cmdInput.value = template['commandContent'];
      }
    }

    toasts.success.templateApplied();
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Proactive auth check - show modal before attempting action
      if (status === 'loading') {
        // Wait for auth check to complete
        return;
      }

      if (!user) {
        // User is not authenticated - show auth modal
        openAuthModal({
          valueProposition: 'Sign in to submit content',
          redirectTo: pathname ?? undefined,
        });
        return;
      }

      // User is authenticated - proceed with submission
      startTransition(async () => {
        try {

        await runLoggedAsync(
          async () => {
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
                // Type guard: value is string from FormData
                const examplesJson = typeof value === 'string' ? value : '';
                if (examplesJson && examplesJson !== '[]') {
                  try {
                    submissionData['examples'] = safeParse(examplesJson, examplesArraySchema, {
                      strategy: ParseStrategy.VALIDATED_JSON,
                    });
                  } catch (error) {
                    const normalized = normalizeError(error, 'Failed to parse examples JSON');
                    logClientWarn(
                      '[Form] Failed to parse examples JSON',
                      normalized,
                      'SubmitFormClient.parseExamples',
                      {
                        component: 'SubmitFormClient',
                        action: 'parse-examples',
                        category: 'form',
                        error: normalized.message,
                      }
                    );
                    toasts.raw.warning('Examples field could not be parsed and will be omitted');
                    submissionData['examples'] = undefined;
                  }
                }
                continue;
              }

              submissionData[key] = value || undefined;
            }

            // Collect all required fields dynamically from form config
            const activeSection = getSection(contentType);
            const allFields = [
              ...(activeSection.nameField ? [activeSection.nameField] : []),
              ...activeSection.common,
              ...activeSection.typeSpecific,
              ...activeSection.tags,
            ];
            const requiredFieldNames = new Set(
              allFields.filter((field) => field.required).map((field) => field.name)
            );

            // Validate all required fields (including dynamic ones from config)
            for (const fieldName of requiredFieldNames) {
              const value = submissionData[fieldName];
              if (value === undefined || value === null || value === '') {
                const field = allFields.find((f) => f.name === fieldName);
                const fieldLabel = field?.label || fieldName;
                toasts.error.submissionFailed(`Missing required field: ${fieldLabel}`);
                throw new Error(`Missing required field: ${fieldLabel}`);
              }
            }

            // Extract specific fields for RPC parameters
            const extractedFields = [
              'name',
              'description',
              'category',
              'author',
              'author_profile_url',
              'github_url',
              'tags',
            ] as const;

            // Type guard for extractedFields
            function isExtractedField(key: string): key is (typeof extractedFields)[number] {
              // Type narrowing: extractedFields is readonly array, check if key is in it
              return (extractedFields as readonly string[]).includes(key);
            }

            // Filter out extracted fields from content_data to avoid duplicates
            const contentData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(submissionData)) {
              if (!isExtractedField(key)) {
                contentData[key] = value;
              }
            }

            // Server action call - database validates everything
            // Type guard: tags is string from FormData
            const tagsValue = submissionData['tags'];
            const tags = typeof tagsValue === 'string' && tagsValue.trim().length > 0
              ? tagsValue
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
              : undefined;

            // Type guards for submission data
            const name = typeof submissionData['name'] === 'string' ? submissionData['name'] : '';
            const description = typeof submissionData['description'] === 'string' ? submissionData['description'] : '';
            const categoryValue = typeof submissionData['category'] === 'string' && isValidCategory(submissionData['category'])
              ? submissionData['category']
              : 'agents' satisfies content_category; // Fallback to valid category
            const author = typeof submissionData['author'] === 'string' ? submissionData['author'] : '';
            const authorProfileUrl = typeof submissionData['author_profile_url'] === 'string' ? submissionData['author_profile_url'] : '';
            const githubUrl = typeof submissionData['github_url'] === 'string' ? submissionData['github_url'] : '';

            const result = await submitContentForReview({
              submission_type: contentType,
              name,
              description,
              category: categoryValue,
              author,
              author_profile_url: authorProfileUrl,
              github_url: githubUrl,
              tags: tags || [],
              content_data: contentData,
            });

            if (result?.serverError || result?.validationErrors) {
              throw new Error(result.serverError || 'Validation failed');
            }

            if (result?.data?.success) {
              if (!result.data.submission_id) {
                logClientWarn(
                  '[Form] Success response missing submission ID',
                  undefined,
                  'SubmitFormClient.handleSubmit',
                  {
                    component: 'SubmitFormClient',
                    action: 'handle-submit',
                    category: 'form',
                    contentType,
                  }
                );
              }

              // Use Prisma enum object directly (no type assertion needed)
              const validatedStatus = submission_statusSchema.parse(SubmissionStatus.pending);
              setSubmissionResult({
                submission_id: (typeof result.data.submission_id === 'string' ? result.data.submission_id : 'unknown'),
                status: validatedStatus,
                message: 'Your submission has been received and is pending review!',
              });

              toasts.success.submissionCreated(contentType);

              // Fire confetti celebration for successful submission
              const confettiEnabled = checkConfettiEnabled();
              if (confettiEnabled) {
                celebrateSubmission();
              }

              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              throw new Error('Submission failed: unexpected response format');
            }
          },
          {
            message: 'Content submission failed',
            context: {
              contentType,
              hasName: !!name,
              hasDescription: !!description,
            },
          }
        );
        } catch (error) {
          // Error already logged by useLoggedAsync
          const normalized = normalizeError(error, 'Failed to submit content');
          const errorMessage = normalized.message;
          
          // Check if error is auth-related and show modal if so
          if (errorMessage.includes('signed in') || errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
            openAuthModal({
              valueProposition: 'Sign in to submit content',
              redirectTo: pathname ?? undefined,
            });
          } else {
            // Non-auth errors - show toast with retry option
            // Note: Can't retry directly as handleSubmit needs form event
            // User will need to click submit button again
            toasts.error.submissionFailed(normalizeError(error, 'Failed to submit content').message);
          }
        }
      });
    },
    [user, status, openAuthModal, pathname, contentType, name, description, runLoggedAsync, celebrateSubmission, setSubmissionResult]
  );

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
      {submissionResult ? (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          transition={springSmooth}
        >
          <Card className={`${marginBottom.comfortable} border-green-500/20 bg-green-500/5`}>
            <CardContent className={`${paddingTop.comfortable}`}>
              <div className={responsive.colCenter}>
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                  transition={{ ...springBouncy, delay: STAGGER.default }}
                >
                  <CheckCircle
                    className={`h-6 w-6 text-green-500 flex-shrink-0 ${marginTop.micro}`}
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.p
                    className="text-lg font-semibold text-green-600 dark:text-green-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: STAGGER.slow }}
                  >
                    Submission Successful! 🎉
                  </motion.p>
                  <motion.p
                    className={`text-muted-foreground ${marginTop.tight} text-sm`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: STAGGER.relaxed }}
                  >
                    {submissionResult.message}
                  </motion.p>
                  <motion.p
                    className={`text-muted-foreground ${marginTop.tight} text-xs`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: STAGGER.loose }}
                  >
                    Status: {submissionResult.status} • ID:{' '}
                    {submissionResult.submission_id.slice(0, 8)}...
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Main Form - Sectioned with visual hierarchy */}
      <form onSubmit={handleSubmit} className={spaceY.relaxed}>
        {/* Section 1: Content Type + Template */}
        <FormSectionCard
          step={1}
          title="Choose Configuration Type"
          description="Select what you're submitting"
          icon={Layers}
          theme="primary"
          showBorderBeam={false}
        >
          <div className={`grid ${gap.default} sm:grid-cols-2`}>
            <div className={spaceY.compact}>
              <Label htmlFor={`${formId}-type`}>Content Type *</Label>
              <div className="relative">
                <Layers
                  className={cn(
                    iconSize.sm,
                    'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2',
                    muted.default
                  )}
                />
                <select
                  id={`${formId}-type`}
                  value={contentType}
                  onChange={(e) => {
                    // Type guard: validate e.target.value is SubmissionContentType
                    const value = e.target.value;
                    if (value === 'agents' || value === 'rules' || value === 'mcp' || value === 'commands') {
                      setContentType(value as SubmissionContentType);
                    }
                    setName(''); // Reset name when type changes
                  }}
                  required
                  className={`border-input bg-background flex h-10 w-full rounded-md border ${paddingY.tight} ${paddingRight.compact} ${paddingLeft.default} text-sm`}
                >
                  {SUBMISSION_CONTENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {FORM_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={spaceY.compact}>
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
          <div className={spaceY.comfortable}>
            {/* Name Field + Duplicate Warning */}
            <div className={spaceY.compact}>
              <div className={between.center}>
                <Label htmlFor={`${formId}-name`}>{nameFieldConfig.label}</Label>
                <span className={cn(`${size.xs} ${muted.default}`, 'font-medium')}>
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
                  className={`${paddingRight.default}`}
                />
                {name.length > 3 && (
                  <motion.div
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1 }}
                    transition={springBouncy}
                  >
                    <CheckCircle className={cn(iconSize.sm, 'text-green-500 dark:text-green-400')} />
                  </motion.div>
                )}
              </div>
              <p className={`${size.xs} ${muted.default}`}>
                {nameFieldConfig.helpText ?? 'A clear, descriptive name for your configuration'}
              </p>
              <DuplicateWarning contentType={contentType} name={name} />
            </div>

            {/* Description Field with Markdown Preview */}
            <div className={spaceY.compact}>
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
                <TabsContent value="write" className={`${marginTop.compact}`}>
                  <Textarea
                    id={`${formId}-description`}
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your configuration does and how to use it..."
                    required
                    rows={6}
                    className="resize-y font-sans"
                  />
                  <p className={cn(`${size.xs} ${muted.default}`, marginTop.micro)}>
                    Supports markdown formatting (bold, italic, lists, links, code blocks)
                  </p>
                </TabsContent>
                <TabsContent value="preview" className={`${marginTop.compact}`}>
                  <div
                    className={cn(
                      'border-input bg-background min-h-[150px] rounded-md border p-4',
                      'prose prose-sm dark:prose-invert max-w-none'
                    )}
                  >
                    {description ? (
                      <p className="whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className={muted.default}>
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
          <div className={spaceY.comfortable}>
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
          className={`flex flex-col sm:flex-row ${gap.compact} sm:${gap.default} ${paddingTop.tight} sm:${paddingTop.default}`}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        >
          <Button type="submit" disabled={isPending} className="w-full flex-1 sm:flex-initial">
            {isPending ? (
              <>
                <motion.div
                  className={`${marginRight.tight}`}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0.5, 1], rotate: [0, 360] }}
                  transition={
                    shouldReduceMotion
                      ? {}
                      : {
                          duration: DURATION.veryLong,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: 'easeInOut',
                        }
                  }
                >
                  <Github className={iconSize.sm} />
                </motion.div>
                Creating PR...
              </>
            ) : (
              <>
                <Send className={`${iconSize.sm} ${marginRight.compact}`} />
                Submit for Review
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Box */}
        <div className={`rounded-lg border border-blue-500/20 bg-blue-500/10 ${padding.compact} sm:${padding.default}`}>
          <div className={`flex ${gap.tight} sm:${gap.compact}`}>
            <Github className={`h-5 w-5 text-blue-400 flex-shrink-0 ${marginTop.micro}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-400">How it works</p>
              <p className={`text-muted-foreground ${marginTop.tight} text-sm`}>
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