'use client';

/**
 * Wizard Submission Page - Multi-Step Form Experience
 *
 * A gorgeously animated redesign of the submission form with:
 * - 5-step progressive disclosure wizard
 * - Buttery smooth spring animations
 * - Real-time draft auto-save
 * - Form tracking analytics
 * - Quality score gamification
 * - Celebration micro-interactions
 * - Mobile-responsive design
 * - Template gallery with one-click application
 *
 * Steps:
 * 1. Type Selection - Animated card picker
 * 2. Basic Info - Name, description, author
 * 3. Configuration - Type-specific fields with templates
 * 4. Examples & Tags - Usage examples with tag input
 * 5. Review & Submit - Celebration with confetti-style effects
 */

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '@heyclaude/web-runtime';
import { toasts } from '@heyclaude/web-runtime/client';
import { Code, FileText, Plus, Sparkles, Tag, X } from '@heyclaude/web-runtime/icons';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimatedFormField,
  type ValidationState,
} from '@/src/components/core/forms/wizard/animated-form-field';
import { InlinePreview } from '@/src/components/core/forms/wizard/inline-preview';
import type { WizardStep } from '@/src/components/core/forms/wizard/progress-indicator';
import {
  SocialProofBar,
  StepSocialProof,
} from '@/src/components/core/forms/wizard/social-proof-badge';
import {
  TemplateQuickSelect,
  TemplateQuickSelectSkeleton,
} from '@/src/components/core/forms/wizard/template-gallery';
import { TypeSelectionCards } from '@/src/components/core/forms/wizard/type-selection-cards';
import { WizardLayout } from '@/src/components/core/forms/wizard/wizard-layout';
import { StepReviewSubmit } from '@/src/components/core/forms/wizard/wizard-steps';
import { Badge } from '@/src/components/primitives/ui/badge';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { Input } from '@/src/components/primitives/ui/input';
import { Textarea } from '@/src/components/primitives/ui/textarea';
import { useFieldHighlight } from '@/src/hooks/use-field-highlight';
import { useFormTracking } from '@/src/hooks/use-form-tracking';
import { useOnboardingToasts } from '@/src/hooks/use-onboarding-toasts';
import { useTemplateApplication } from '@/src/hooks/use-template-application';
import { submitContentForReview } from '@/src/lib/actions/content.actions';
import { useAuthenticatedUser } from '@/src/lib/auth/use-authenticated-user';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@/src/lib/design-tokens/submission-form';
import { type DraftFormData, DraftManager } from '@/src/lib/drafts/draft-manager';
import type { SubmissionContentType } from '@/src/lib/types/component.types';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

interface FormData {
  submission_type: SubmissionContentType;
  name: string;
  description: string;
  author: string;
  author_profile_url?: string;
  github_url?: string;
  type_specific: Record<string, unknown>;
  tags: string[];
  examples: string[];
  category: Database['public']['Enums']['content_category'];
}

const DEFAULT_FORM_DATA: FormData = {
  submission_type: 'agents',
  name: '',
  description: '',
  author: '',
  author_profile_url: '',
  github_url: '',
  type_specific: {},
  tags: [],
  examples: [],
  category: 'agents', // Default to match submission_type
};

export default function WizardSubmissionPage() {
  // Onboarding toasts
  useOnboardingToasts({ enabled: true, context: 'wizard' });
  const router = useRouter();
  const { user } = useAuthenticatedUser({
    context: 'WizardSubmissionPage',
    subscribe: false,
  });
  const formTracking = useFormTracking();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [templates, setTemplates] = useState<MergedTemplateItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [socialProofStats, setSocialProofStats] = useState<{
    contributors?: { count: number; names: string[] };
    submissions?: number;
    successRate?: number;
    totalUsers?: number;
  }>({});

  // Field highlighting for template application feedback
  const { highlightFields, getHighlightClasses } = useFieldHighlight();

  // Draft manager
  const draftManager = useMemo(
    () => new DraftManager(formData.submission_type),
    [formData.submission_type]
  );

  // Update form data helper - centralizes category/submission_type sync
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => {
      const next: FormData = { ...prev, ...updates };

      // Keep category and submission_type in sync
      if (updates.submission_type && updates.submission_type !== prev.submission_type) {
        next.category = updates.submission_type as Database['public']['Enums']['content_category'];
      }

      return next;
    });
  }, []);

  // Template application hook
  const { applyTemplate } = useTemplateApplication({
    onFormUpdate: (updates) => {
      // Use updateFormData to ensure category/submission_type sync is centralized
      // Filter out undefined values to satisfy exactOptionalPropertyTypes
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ) as Partial<FormData>;
      updateFormData(cleanUpdates);

      // Highlight fields that were updated
      const updatedFields = Object.keys(updates).filter(
        (key) => key !== 'type_specific' && updates[key as keyof typeof updates]
      );
      if (updatedFields.length > 0) {
        highlightFields(updatedFields);
      }
      // Highlight type-specific fields
      if (updates.type_specific) {
        const typeFields = Object.keys(updates.type_specific);
        highlightFields(typeFields.map((f) => `type_specific.${f}`));
      }
    },
    currentFormData: formData,
    onTrackEvent: (event, data) => {
      if (event === 'template_applied') {
        formTracking.trackFieldFocused('template_applied', { ...data });
        toasts.success.templateApplied();
      }
    },
  });

  // Load templates when submission type changes
  useEffect(() => {
    const loadTemplates = async () => {
      if (!formData.submission_type) return;

      setTemplatesLoading(true);
      try {
        const response = await fetch(`/api/templates?category=${formData.submission_type}`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load templates');
        logger.warn('Failed to load templates', { error: normalized.message });
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates().catch((error) => {
      const normalized = normalizeError(error, 'Failed to load templates in useEffect');
      logger.warn('Failed to load templates in useEffect', { error: normalized.message });
    });
  }, [formData.submission_type]);

  // Load social proof stats on mount
  useEffect(() => {
    const loadSocialProofStats = async () => {
      try {
        const response = await fetch('/api/stats/social-proof');
        if (response.ok) {
          const data = await response.json();
          setSocialProofStats(data.stats || {});
        }
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load social proof stats');
        logger.warn('Failed to load social proof stats', { error: normalized.message });
      }
    };

    loadSocialProofStats().catch((error) => {
      const normalized = normalizeError(error, 'Failed to load social proof stats in useEffect');
      logger.warn('Failed to load social proof stats in useEffect', { error: normalized.message });
    });
  }, []);

  // Check if can proceed from current step (defined early for draft resume validation)
  const canProceedFromStep = useCallback((step: number, data: FormData): boolean => {
    switch (step) {
      case 1:
        return !!data.submission_type;
      case 2:
        return data.name.length >= 3 && data.description.length >= 10;
      case 3:
        return true; // Type-specific fields are optional
      case 4:
        return true; // Examples are optional
      case 5:
        return false; // Last step
      default:
        return false;
    }
  }, []);

  // Build draft payload helper - centralizes draft save logic
  const buildDraftPayload = useCallback(
    (step: number, score: number): Partial<DraftFormData> => ({
      submission_type: formData.submission_type,
      name: formData.name,
      description: formData.description,
      type_specific: formData.type_specific,
      // Convert string[] examples to structured format for DraftFormData
      examples: formData.examples.map((ex, i) => ({
        id: `ex-${i}`,
        title: ex,
        code: '',
        language: 'typescript',
      })),
      tags: formData.tags,
      last_step: step,
      quality_score: score,
    }),
    [formData]
  );

  // Load draft on mount
  useEffect(() => {
    const draft = draftManager.load();
    if (draft) {
      const loadedFormData: FormData = {
        submission_type: draft.submission_type || 'agents',
        name: draft.name || '',
        description: draft.description || '',
        author: user?.email || '',
        author_profile_url: '',
        github_url: '',
        type_specific: draft.type_specific || {},
        tags: draft.tags || [],
        // Convert structured examples to string[] (extract title only for UI)
        examples:
          draft.examples?.map((ex) => ex.title).filter((title): title is string => !!title) || [],
        category: draft.submission_type, // Use submission_type as category
      };

      setFormData(loadedFormData);

      // Resume wizard at the last step the user was on (clamped to valid range)
      if (draft.last_step && draft.last_step >= 1 && draft.last_step <= 5) {
        // Validate that we can proceed to this step using loaded form data
        const targetStep = draft.last_step;
        if (targetStep === 1 || canProceedFromStep(targetStep - 1, loadedFormData)) {
          setCurrentStep(targetStep);
        }
      }

      formTracking.trackDraftLoaded({
        submission_type: draft.submission_type,
        quality_score: draft.quality_score,
      });
    }
  }, [draftManager, user, formTracking, canProceedFromStep]);

  // Calculate quality score
  const qualityScore = useMemo(() => {
    let score = 0;

    // Name (20 points)
    if (formData.name.length >= 5) score += 20;
    else score += (formData.name.length / 5) * 20;

    // Description (30 points)
    if (formData.description.length >= 100) score += 30;
    else score += (formData.description.length / 100) * 30;

    // Examples (25 points)
    if (formData.examples.length >= 3) score += 25;
    else score += (formData.examples.length / 3) * 25;

    // Tags (15 points)
    if (formData.tags.length >= 3) score += 15;
    else score += (formData.tags.length / 3) * 15;

    // Type-specific fields (10 points)
    const typeFieldCount = Object.keys(formData.type_specific).length;
    if (typeFieldCount >= 2) score += 10;
    else score += (typeFieldCount / 2) * 10;

    return Math.round(score);
  }, [formData]);

  // Auto-save draft on form data change (debounced)
  // buildDraftPayload already depends on formData, so we don't need formData in the dependency array
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      draftManager.save(buildDraftPayload(currentStep, qualityScore));
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [currentStep, draftManager, qualityScore, buildDraftPayload]);

  // Check if can proceed from current step (wrapper using current formData)
  const canProceedFromCurrentStep = useCallback(
    (step: number): boolean => canProceedFromStep(step, formData),
    [canProceedFromStep, formData]
  );

  // Define wizard steps
  const steps: WizardStep[] = useMemo(
    () => [
      {
        id: 'type',
        number: 1,
        label: 'Choose Type',
        shortLabel: 'Type',
        description: 'Select submission type',
        isCompleted: currentStep > 1,
        isCurrent: currentStep === 1,
        isAccessible: true,
      },
      {
        id: 'basic',
        number: 2,
        label: 'Basic Info',
        shortLabel: 'Info',
        description: 'Name and description',
        isCompleted: currentStep > 2,
        isCurrent: currentStep === 2,
        isAccessible: currentStep >= 1,
      },
      {
        id: 'config',
        number: 3,
        label: 'Configuration',
        shortLabel: 'Config',
        description: 'Type-specific settings',
        isCompleted: currentStep > 3,
        isCurrent: currentStep === 3,
        isAccessible: currentStep >= 2 && canProceedFromCurrentStep(2),
      },
      {
        id: 'examples',
        number: 4,
        label: 'Examples & Tags',
        shortLabel: 'Examples',
        description: 'Add examples and tags',
        isCompleted: currentStep > 4,
        isCurrent: currentStep === 4,
        isAccessible: currentStep >= 3 && canProceedFromCurrentStep(3),
      },
      {
        id: 'review',
        number: 5,
        label: 'Review & Submit',
        shortLabel: 'Submit',
        description: 'Review and submit',
        isCompleted: false,
        isCurrent: currentStep === 5,
        isAccessible: currentStep >= 4 && canProceedFromCurrentStep(4),
      },
    ],
    [currentStep, canProceedFromCurrentStep]
  );

  // Handle next step
  const handleNext = useCallback(async () => {
    if (canProceedFromCurrentStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  }, [currentStep, canProceedFromCurrentStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Handle step change (from progress indicator)
  const handleStepChange = useCallback(
    (step: number) => {
      const targetStep = steps.find((s) => s.number === step);
      if (targetStep?.isAccessible) {
        setCurrentStep(step);
      }
    },
    [steps]
  );

  // Handle save draft
  const handleSave = useCallback(async () => {
    draftManager.save(buildDraftPayload(currentStep, qualityScore));
    toasts.success.changesSaved();
  }, [draftManager, buildDraftPayload, currentStep, qualityScore]);

  // Handle final submit
  const handleSubmit = useCallback(async () => {
    if (!user) {
      toasts.error.authRequired();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContentForReview({
        submission_type: formData.submission_type,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        author: formData.author || user.email || 'Anonymous',
        author_profile_url: formData.author_profile_url,
        github_url: formData.github_url,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        content_data: {
          ...formData.type_specific,
          examples: formData.examples,
        },
      });

      await formTracking.trackSubmitted(formData.submission_type, {
        quality_score: qualityScore,
        submission_id: result?.data?.submissionId,
      });

      if (result?.data?.success) {
        setShowCelebration(true);
        draftManager.clear();
        toasts.success.submissionCreated(formData.submission_type);

        // Redirect after celebration
        setTimeout(() => {
          router.push('/submit?success=true');
        }, 3000);
      } else {
        toasts.error.submissionFailed(result?.serverError);
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Submission failed');
      logger.error('Submission failed', normalized, {
        submissionType: formData.submission_type,
      });
      toasts.error.submissionFailed();
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, formTracking, qualityScore, draftManager, router]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepTypeSelection
            selected={formData.submission_type}
            onSelect={(type) => updateFormData({ submission_type: type })}
          />
        );
      case 2:
        return <StepBasicInfo data={formData} onChange={updateFormData} />;
      case 3:
        return (
          <StepConfiguration
            submissionType={formData.submission_type}
            data={formData.type_specific}
            onChange={(data) => updateFormData({ type_specific: data })}
            templates={templates}
            templatesLoading={templatesLoading}
            onApplyTemplate={applyTemplate}
            getHighlightClasses={getHighlightClasses}
          />
        );
      case 4:
        return <StepExamplesTags data={formData} onChange={updateFormData} />;
      case 5:
        return (
          <StepReviewSubmit
            data={formData}
            qualityScore={qualityScore}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showCelebration={showCelebration}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Inline Preview - Desktop Sidebar */}
      <div className="hidden lg:sticky lg:top-24 lg:block lg:w-80">
        <InlinePreview formData={formData} qualityScore={qualityScore} />
      </div>
      <WizardLayout
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleSave}
        canGoNext={canProceedFromCurrentStep(currentStep)}
        canGoPrevious={currentStep > 1}
        isLastStep={currentStep === 5}
        qualityScore={qualityScore}
        submissionType={formData.submission_type}
      >
        {renderStepContent()}

        {/* Social Proof Bar - Bottom of wizard */}
        {Object.keys(socialProofStats).length > 0 && (
          <div className="mt-8 flex justify-center">
            <SocialProofBar stats={socialProofStats} />
          </div>
        )}
      </WizardLayout>
    </>
  );
}

/**
 * Step 1: Type Selection
 */
function StepTypeSelection({
  selected,
  onSelect,
}: {
  selected: SubmissionContentType;
  onSelect: (type: SubmissionContentType) => void;
}) {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className="mb-4 inline-flex"
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="font-bold text-3xl text-foreground">Choose Your Submission Type</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          What would you like to share with the community?
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={1} />
        </div>
      </motion.div>

      <TypeSelectionCards selected={selected} onSelect={onSelect} />
    </div>
  );
}

/**
 * Step 2: Basic Information
 */
function StepBasicInfo({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const [nameValidation, setNameValidation] = useState<ValidationState>('idle');
  const [descValidation, setDescValidation] = useState<ValidationState>('idle');

  // Real-time validation
  useEffect(() => {
    if (data.name.length === 0) {
      setNameValidation('idle');
    } else if (data.name.length < 3) {
      setNameValidation('invalid');
    } else {
      setNameValidation('valid');
    }
  }, [data.name]);

  useEffect(() => {
    if (data.description.length === 0) {
      setDescValidation('idle');
    } else if (data.description.length < 10) {
      setDescValidation('warning');
    } else if (data.description.length < 50) {
      setDescValidation('valid');
    } else {
      setDescValidation('valid');
    }
  }, [data.description]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className="mb-4 inline-flex"
        >
          <FileText className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="font-bold text-3xl text-foreground">Tell us about it</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Give your submission a clear name and description
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.1 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="space-y-6 pt-6">
            <AnimatedFormField
              label="Name"
              id="wizard-name"
              required={true}
              validationState={nameValidation}
              helpText="A clear, descriptive name"
              {...(nameValidation === 'invalid'
                ? { errorMessage: 'Name must be at least 3 characters' }
                : {})}
              {...(nameValidation === 'valid' ? { successMessage: 'Great name!' } : {})}
              showCharCount={true}
              currentLength={data.name.length}
              maxLength={100}
            >
              <Input
                id="wizard-name"
                value={data.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g., React Query Expert"
                maxLength={100}
                className="pr-12"
              />
            </AnimatedFormField>

            <AnimatedFormField
              label="Description"
              id="wizard-description"
              required={true}
              validationState={descValidation}
              helpText="Explain what your configuration does and how to use it"
              {...(descValidation === 'warning'
                ? {
                    warningMessage: 'Add more details to help users understand',
                  }
                : {})}
              {...(descValidation === 'valid' && data.description.length >= 50
                ? { successMessage: 'Excellent description!' }
                : {})}
              showCharCount={true}
              currentLength={data.description.length}
              maxLength={500}
            >
              <Textarea
                id="wizard-description"
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Describe what your configuration does..."
                rows={6}
                maxLength={500}
              />
            </AnimatedFormField>

            <AnimatedFormField
              label="Author Name"
              id="wizard-author"
              required={true}
              helpText="Your name or username"
            >
              <Input
                id="wizard-author"
                value={data.author}
                onChange={(e) => onChange({ author: e.target.value })}
                placeholder="Your name"
              />
            </AnimatedFormField>

            <AnimatedFormField
              label="GitHub URL (Optional)"
              id="wizard-github"
              helpText="Link to the repository or your profile"
            >
              <Input
                id="wizard-github"
                type="url"
                value={data.github_url || ''}
                onChange={(e) => onChange({ github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </AnimatedFormField>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Step 3: Configuration (Type-Specific)
 */
function StepConfiguration({
  submissionType,
  data,
  onChange,
  templates,
  templatesLoading,
  onApplyTemplate,
  getHighlightClasses,
}: {
  submissionType: SubmissionContentType;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  templates?: MergedTemplateItem[];
  templatesLoading?: boolean;
  onApplyTemplate?: (template: MergedTemplateItem) => void;
  getHighlightClasses?: (field: string) => string;
}) {
  const hasTemplates = templates && templates.length > 0;
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className="mb-4 inline-flex"
        >
          <Code className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="font-bold text-3xl text-foreground">Configuration Details</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Type-specific settings for your {submissionType}
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={3} />
        </div>
      </motion.div>

      {/* Template Quick Select - Show at top of configuration step */}
      {templatesLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TOKENS.animations.spring.smooth, delay: 0.15 }}
        >
          <TemplateQuickSelectSkeleton />
        </motion.div>
      )}

      {hasTemplates && onApplyTemplate && !templatesLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TOKENS.animations.spring.smooth, delay: 0.15 }}
        >
          <TemplateQuickSelect
            templates={templates}
            contentType={submissionType as Database['public']['Enums']['content_category']}
            onApplyTemplate={onApplyTemplate}
            maxVisible={3}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.1 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="space-y-6 pt-6">
            {submissionType === 'agents' && (
              <>
                <AnimatedFormField
                  label="System Prompt"
                  id="wizard-system-prompt"
                  required={true}
                  helpText="The main prompt that defines the agent's behavior"
                  showCharCount={true}
                  currentLength={((data['systemPrompt'] as string) || '').length}
                  maxLength={2000}
                >
                  <Textarea
                    id="wizard-system-prompt"
                    value={(data['systemPrompt'] as string) || ''}
                    onChange={(e) => onChange({ ...data, systemPrompt: e.target.value })}
                    placeholder="You are an expert in..."
                    rows={8}
                    maxLength={2000}
                    className={getHighlightClasses?.('type_specific.systemPrompt')}
                  />
                </AnimatedFormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AnimatedFormField
                    label="Temperature"
                    id="wizard-temperature"
                    helpText="0.0 to 1.0 (default: 0.7)"
                  >
                    <Input
                      id="wizard-temperature"
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={(data['temperature'] as number | undefined) ?? 0.7}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw === '' ? undefined : Number.parseFloat(raw);
                        onChange({
                          ...data,
                          temperature: Number.isNaN(parsed as number) ? undefined : parsed,
                        });
                      }}
                    />
                  </AnimatedFormField>

                  <AnimatedFormField
                    label="Max Tokens"
                    id="wizard-max-tokens"
                    helpText="Maximum response length"
                  >
                    <Input
                      id="wizard-max-tokens"
                      type="number"
                      min={100}
                      max={4096}
                      step={100}
                      value={(data['maxTokens'] as number | undefined) ?? 2048}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const parsed = raw === '' ? undefined : Number.parseInt(raw, 10);
                        onChange({
                          ...data,
                          maxTokens: Number.isNaN(parsed as number) ? undefined : parsed,
                        });
                      }}
                    />
                  </AnimatedFormField>
                </div>
              </>
            )}

            {submissionType === 'mcp' && (
              <>
                <AnimatedFormField
                  label="NPM Package"
                  id="wizard-npm-package"
                  required={true}
                  helpText="The npm package name"
                >
                  <Input
                    id="wizard-npm-package"
                    value={(data['npmPackage'] as string) || ''}
                    onChange={(e) => onChange({ ...data, npmPackage: e.target.value })}
                    placeholder="@modelcontextprotocol/server-..."
                  />
                </AnimatedFormField>

                <AnimatedFormField
                  label="Install Command"
                  id="wizard-install-command"
                  helpText="How to install this MCP server"
                >
                  <Input
                    id="wizard-install-command"
                    value={(data['installCommand'] as string) || ''}
                    onChange={(e) => onChange({ ...data, installCommand: e.target.value })}
                    placeholder="npm install -g @modelcontextprotocol/..."
                  />
                </AnimatedFormField>

                <AnimatedFormField
                  label="Tools Description"
                  id="wizard-tools-description"
                  helpText="Describe the tools this MCP server provides"
                >
                  <Textarea
                    id="wizard-tools-description"
                    value={(data['toolsDescription'] as string) || ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        toolsDescription: e.target.value,
                      })
                    }
                    placeholder="This server provides tools for..."
                    rows={4}
                  />
                </AnimatedFormField>
              </>
            )}

            {submissionType === 'rules' && (
              <AnimatedFormField
                label="Rules Content"
                id="wizard-rules-content"
                required={true}
                helpText="The expertise rules or guidelines"
                showCharCount={true}
                currentLength={((data['rulesContent'] as string) || '').length}
                maxLength={3000}
              >
                <Textarea
                  id="wizard-rules-content"
                  value={(data['rulesContent'] as string) || ''}
                  onChange={(e) => onChange({ ...data, rulesContent: e.target.value })}
                  placeholder="When working with TypeScript..."
                  rows={10}
                  maxLength={3000}
                />
              </AnimatedFormField>
            )}

            {submissionType === 'commands' && (
              <AnimatedFormField
                label="Command Content"
                id="wizard-command-content"
                required={true}
                helpText="The shell command or script"
                showCharCount={true}
                currentLength={((data['commandContent'] as string) || '').length}
                maxLength={1000}
              >
                <Textarea
                  id="wizard-command-content"
                  value={(data['commandContent'] as string) || ''}
                  onChange={(e) => onChange({ ...data, commandContent: e.target.value })}
                  placeholder="#!/bin/bash..."
                  rows={6}
                  maxLength={1000}
                  className="font-mono"
                />
              </AnimatedFormField>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Step 4: Examples & Tags
 */
function StepExamplesTags({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const [newExample, setNewExample] = useState('');
  const [newTag, setNewTag] = useState('');

  const addExample = () => {
    if (newExample.trim()) {
      onChange({ examples: [...data.examples, newExample.trim()] });
      setNewExample('');
    }
  };

  const removeExample = (index: number) => {
    onChange({
      examples: data.examples.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (newTag.trim() && !data.tags.includes(newTag.trim())) {
      onChange({ tags: [...data.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    onChange({
      tags: data.tags.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...TOKENS.animations.spring.bouncy, delay: 0.2 }}
          className="mb-4 inline-flex"
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="font-bold text-3xl text-foreground">Examples & Tags</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Help others understand and discover your submission
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={4} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Examples Section */}
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Usage Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add examples to show how your configuration is used
            </p>

            {/* Add Example Input */}
            <div className="flex gap-2">
              <Input
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExample();
                  }
                }}
                placeholder="e.g., 'Create a React component'"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addExample}
                disabled={!newExample.trim()}
                style={{
                  backgroundColor: TOKENS.colors.accent.primary,
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Examples List */}
            <AnimatePresence mode="popLayout">
              {data.examples.length > 0 ? (
                <div className="space-y-2">
                  {data.examples.map((example, index) => {
                    // Use example content as stable key (examples should be unique)
                    const exampleKey = `example-${example}`;
                    return (
                      <motion.div
                        key={exampleKey}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={TOKENS.animations.spring.snappy}
                        className="group flex items-start gap-3 rounded-lg border p-3 transition-all hover:border-accent-primary/50"
                        style={{
                          backgroundColor: TOKENS.colors.background.primary,
                          borderColor: TOKENS.colors.border.default,
                        }}
                      >
                        <div
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-xs"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}20`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className="flex-1 text-sm leading-relaxed">{example}</span>
                        <motion.button
                          type="button"
                          onClick={() => removeExample(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="shrink-0 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100"
                          style={{
                            color: TOKENS.colors.error.text,
                          }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-8 text-center"
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Code className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No examples yet. Add some to help users understand!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tags Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...TOKENS.animations.spring.smooth, delay: 0.2 }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
              <span className="ml-auto font-normal text-muted-foreground text-sm">
                {data.tags.length} tags
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add tags to help users discover your submission
            </p>

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., 'react', 'typescript', 'api'"
                className="flex-1"
                maxLength={30}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="gap-2"
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </motion.div>
            </div>

            {/* Tags List */}
            <AnimatePresence mode="popLayout">
              {data.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => {
                    // Use tag content as key (tags should be unique)
                    const tagKey = `tag-${tag}`;
                    return (
                      <motion.div
                        key={tagKey}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={TOKENS.animations.spring.bouncy}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge
                          variant="secondary"
                          className="group gap-1.5 pr-1 text-sm"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}15`,
                            borderColor: `${TOKENS.colors.accent.primary}30`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const tagIndex = data.tags.indexOf(tag);
                              if (tagIndex !== -1) {
                                removeTag(tagIndex);
                              }
                            }}
                            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-accent-primary/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-6 text-center"
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    No tags yet. Add tags to improve discoverability!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
