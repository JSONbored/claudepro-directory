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

import { Constants, type Database } from '@heyclaude/database-types';
import { submitContentForReview } from '@heyclaude/web-runtime/actions';
import { logger, normalizeError, ParseStrategy, safeParse } from '@heyclaude/web-runtime/core';
import { getAnimationConfig } from '@heyclaude/web-runtime/data';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  CheckCircle,
  Code,
  FileText,
  Github,
  Layers,
  Send,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import {
  SUBMISSION_CONTENT_TYPES,
  type SubmissionContentType,
  type SubmissionFormConfig,
  type SubmissionFormSection,
  type TextFieldDefinition,
} from '@heyclaude/web-runtime/types/component.types';
import {
  between,
  cluster,
  iconLeading,
  iconSize,
  marginBottom,
  marginTop,
  muted,
  responsive,
  stack,
  weight,
  size,
  gap,
  padding,
  radius,
  bgColor,
  textColor,
  alignItems,
  flexDir,
  flexGrow,
  borderColor,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useEffect, useId, useState, useTransition } from 'react';
import { z } from 'zod';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';
import { Textarea } from '@heyclaude/web-runtime/ui';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

import { FormSectionCard } from '@heyclaude/web-runtime/ui';
import { GenericNameWarning } from './duplicate-warning';
import { ContentTypeFieldRenderer } from './dynamic-form-field';
import { ExamplesArrayInput } from './examples-array-input';
import { TemplateSelector } from './template-selector';

/**
 * Usage example schema (Zod)
 * Validates structured examples from ExamplesArrayInput component
 * Must match the output format of ExamplesArrayInput and expectations of content-detail-view.tsx
 */
const usageExampleSchema = z.object({
  title: z.string().min(1).max(100),
  code: z.string().min(1).max(10000),
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

const DEFAULT_CONTENT_TYPE: SubmissionContentType = Constants.public.Enums.submission_type[0]; // 'agents'

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
 * Render a multi-section submission form for creating content review requests.
 *
 * Supports template pre-fill, dynamic type-specific fields, client-side required-field enforcement based on formConfig, examples parsing, duplicate-name checking, and server-side submission via submitContentForReview.
 *
 * @param formConfig - Mapping of submission content types to their form section definitions used to render common, type-specific, name, and tag fields and to derive required fields at submit time.
 * @param templates - Array of merged content templates shown in the Quick Start template selector; selecting a template pre-fills form inputs.
 *
 * @see TemplateSelector
 * @see submitContentForReview
 * @see GenericNameWarning
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

  const runLoggedAsync = useLoggedAsync({
    scope: 'SubmitFormClient',
    defaultMessage: 'Content submission failed',
    defaultRethrow: false,
  });

  /** Submission result for success message display */
  const [submissionResult, setSubmissionResult] = useState<{
    submission_id: string;
    status: Database['public']['Enums']['submission_status'];
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
    const config = getAnimationConfig();
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
  }, []);

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
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    // Set common fields (present in all templates)
    const templateName = template['name'] ?? '';
    setName(templateName);
    const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
    if (nameInput) nameInput.value = templateName;

    const descInput = form.querySelector('[name="description"]') as HTMLTextAreaElement;
    if (descInput) descInput.value = template['description'] || '';

    const categoryInput = form.querySelector('[name="category"]') as HTMLInputElement;
    if (categoryInput && template['category']) categoryInput.value = template['category'];

    const tagsInput = form.querySelector('[name="tags"]') as HTMLInputElement;
    if (tagsInput && template['tags']) tagsInput.value = template['tags'] ?? '';

    if (template.type === 'agent') {
      const promptInput = form.querySelector('[name="systemPrompt"]') as HTMLTextAreaElement;
      if (promptInput && typeof template['systemPrompt'] === 'string')
        promptInput.value = template['systemPrompt'] ?? '';

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput && typeof template['temperature'] === 'number')
        tempInput.value = template['temperature'].toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput && typeof template['maxTokens'] === 'number')
        tokensInput.value = template['maxTokens'].toString();
    }

    if (template.type === Constants.public.Enums.submission_type[2]) { // 'rules'
      const rulesInput = form.querySelector('[name="rulesContent"]') as HTMLTextAreaElement;
      if (rulesInput && typeof template['rulesContent'] === 'string')
        rulesInput.value = template['rulesContent'];

      const tempInput = form.querySelector('[name="temperature"]') as HTMLInputElement;
      if (tempInput && typeof template['temperature'] === 'number')
        tempInput.value = template['temperature'].toString();

      const tokensInput = form.querySelector('[name="maxTokens"]') as HTMLInputElement;
      if (tokensInput && typeof template['maxTokens'] === 'number')
        tokensInput.value = template['maxTokens'].toString();
    }

    if (template.type === Constants.public.Enums.submission_type[1]) { // 'mcp'
      const npmInput = form.querySelector('[name="npmPackage"]') as HTMLInputElement;
      if (npmInput && typeof template['npmPackage'] === 'string')
        npmInput.value = template['npmPackage'];

      const typeInput = form.querySelector('[name="serverType"]') as HTMLSelectElement;
      if (typeInput && typeof template['serverType'] === 'string')
        typeInput.value = template['serverType'];

      const installInput = form.querySelector('[name="installCommand"]') as HTMLInputElement;
      if (installInput && typeof template['installCommand'] === 'string')
        installInput.value = template['installCommand'];

      const configInput = form.querySelector('[name="configCommand"]') as HTMLInputElement;
      if (configInput && typeof template['configCommand'] === 'string')
        configInput.value = template['configCommand'];

      const toolsInput = form.querySelector('[name="toolsDescription"]') as HTMLTextAreaElement;
      if (toolsInput && typeof template['toolsDescription'] === 'string')
        toolsInput.value = template['toolsDescription'];

      if (template['envVars'] && typeof template['envVars'] === 'string') {
        const envInput = form.querySelector('[name="envVars"]') as HTMLTextAreaElement;
        if (envInput) envInput.value = template['envVars'];
      }
    }

    if (template.type === 'command') {
      const cmdInput = form.querySelector('[name="commandContent"]') as HTMLTextAreaElement;
      if (cmdInput && typeof template['commandContent'] === 'string') {
        cmdInput.value = template['commandContent'];
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
                const examplesJson = value as string;
                if (examplesJson && examplesJson !== '[]') {
                  try {
                    submissionData['examples'] = safeParse(examplesJson, examplesArraySchema, {
                      strategy: ParseStrategy.VALIDATED_JSON,
                    });
                  } catch (error) {
                    const normalized = normalizeError(error, 'Failed to parse examples JSON');
                    logger.warn('Failed to parse examples JSON, field will be omitted', {
                      error: normalized.message,
                    });
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

            // Filter out extracted fields from content_data to avoid duplicates
            const contentData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(submissionData)) {
              if (!extractedFields.includes(key as (typeof extractedFields)[number])) {
                contentData[key] = value;
              }
            }

            // Server action call - database validates everything
            const tags = submissionData['tags']
              ? (submissionData['tags'] as string)
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
              : undefined;

            const result = await submitContentForReview({
              submission_type: contentType,
              name: submissionData['name'] as string,
              description: submissionData['description'] as string,
              category: submissionData[
                'category'
              ] as Database['public']['Enums']['content_category'],
              author: submissionData['author'] as string,
              author_profile_url: (submissionData['author_profile_url'] as string) || '',
              github_url: (submissionData['github_url'] as string) || '',
              tags: tags || [],
              content_data: contentData,
            });

            if (result?.serverError || result?.validationErrors) {
              throw new Error(result.serverError || 'Validation failed');
            }

            if (result?.data?.success) {
              if (!result.data.submission_id) {
                logger.warn('Success response missing submission ID', {
                  component: 'SubmitFormClient',
                  contentType,
                });
              }

              setSubmissionResult({
                submission_id: (result.data.submission_id as string) || 'unknown',
                status: Constants.public.Enums.submission_status[0], // 'pending'
                message: 'Your submission has been received and is pending review!',
              });

              toasts.success.submissionCreated(contentType);
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
        toasts.error.submissionFailed(normalizeError(error, 'Failed to submit content').message);
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
          <Card className={`${marginBottom.comfortable} border-green-500/20 bg-green-500/5`}>
            <CardContent className={'pt-6'}>
              <div className={`flex ${flexDir.col} ${alignItems.start} ${gap.default} sm:flex-row`}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...springBouncy, delay: 0.2 }}
                >
                  <CheckCircle
                    className={`${iconSize.lg} ${textColor.green} ${marginTop.micro} ${flexGrow.shrink0}`}
                  />
                </motion.div>
                <div className={`min-w-0 ${flexGrow['1']}`}>
                  <motion.p
                    className={`${weight.semibold} ${textColor.green} ${size.lg} dark:text-green-400`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Submission Successful! 🎉
                  </motion.p>
                  <motion.p
                    className={`${marginTop.tight} ${muted.sm}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {submissionResult.message}
                  </motion.p>
                  <motion.p
                    className={`${marginTop.tight} ${muted.default} ${size.xs}`}
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
      <form onSubmit={handleSubmit} className={stack.loose}>
        {/* Section 1: Content Type + Template */}
        <FormSectionCard
          step={1}
          title="Choose Configuration Type"
          description="Select what you're submitting"
          icon={Layers}
          theme="primary"
          showBorderBeam={false}
        >
          <div className={`grid ${gap.comfortable} sm:grid-cols-2`}>
            <div className={stack.compact}>
              <Label htmlFor={`${formId}-type`}>Content Type *</Label>
              <div className="relative">
                <Layers
                  className={cn(
                    iconSize.sm,
                    '-translate-y-1/2 pointer-events-none absolute top-1/2 left-3',
                    muted.default
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
                    `flex h-10 w-full ${radius.md} border ${borderColor.input} ${bgColor.background} ${padding.yCompact} pr-3 pl-10 ${size.sm}`
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

            <div className={stack.compact}>
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
          <div className={stack.default}>
            {/* Name Field + Duplicate Warning */}
            <div className={stack.compact}>
              <div className={between.center}>
                <Label htmlFor={`${formId}-name`}>{nameFieldConfig.label}</Label>
                <span className={cn(`${muted.default} ${size.xs}`, weight.medium)}>
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
                    <CheckCircle className={cn(iconSize.sm, 'text-green-600')} />
                  </motion.div>
                )}
              </div>
              <p className={`${muted.default} ${size.xs}`}>
                {nameFieldConfig.helpText ?? 'A clear, descriptive name for your configuration'}
              </p>
              <GenericNameWarning contentType={contentType} name={name} />
            </div>

            {/* Description Field with Markdown Preview */}
            <div className={stack.compact}>
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
                <TabsContent value="write" className={marginTop.compact}>
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
                  <p className={cn(`${muted.default} ${size.xs}`, marginBottom.micro)}>
                    Supports markdown formatting (bold, italic, lists, links, code blocks)
                  </p>
                </TabsContent>
                <TabsContent value="preview" className={marginTop.compact}>
                  <div
                    className={cn(
                      `min-h-[150px] ${radius.md} border ${borderColor.input} ${bgColor.background} ${padding.default}`,
                      `prose prose-sm dark:prose-invert ${maxWidth.none}`
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
          <div className={stack.default}>
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
          className={`${responsive.smRowGap} pt-2 sm:pt-4`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button type="submit" disabled={isPending} className={`w-full ${flexGrow['1']} sm:flex-initial`}>
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
                  <Github className={iconSize.sm} />
                </motion.div>
                Creating PR...
              </>
            ) : (
              <>
                <Send className={iconLeading.sm} />
                Submit for Review
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Box */}
        <div className={`${radius.lg} border border-blue-500/20 bg-blue-500/10 ${padding.compact} sm:${padding.default}`}>
          <div className={`${cluster.compact} sm:${gap.default}`}>
            <Github className={`${iconSize.md} text-blue-400 ${marginTop.micro} ${flexGrow.shrink0}`} />
            <div className={`min-w-0 ${flexGrow['1']}`}>
              <p className={`${weight.medium} text-blue-400 ${size.sm}`}>How it works</p>
              <p className={`${marginTop.tight} ${muted.sm}`}>
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