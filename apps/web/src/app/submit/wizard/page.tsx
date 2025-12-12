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
 *
 * Note: This is a client component ('use client'), so segment config exports are not allowed.
 * Dynamic rendering behavior is determined by the parent layout and page configuration.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { getEnvVar, normalizeError } from '@heyclaude/shared-runtime';
import { submitContentForReview } from '@heyclaude/web-runtime/actions';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { type DraftFormData, DraftManager } from '@heyclaude/web-runtime/data/drafts/draft-manager';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import {
  useConfetti,
  useFieldHighlight,
  useFormTracking,
  useLoggedAsync,
} from '@heyclaude/web-runtime/hooks';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  Camera as ImageIcon, Code, FileText, Plus, Sparkles, Tag, X,
} from '@heyclaude/web-runtime/icons';
import { useClientLogger } from '@heyclaude/web-runtime/logging/client';
import { type SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  toasts,
} from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  AnimatedFormField,
  type ValidationState,
} from '@/src/components/core/forms/wizard/animated-form-field';
import { InlinePreview } from '@/src/components/core/forms/wizard/inline-preview';
import { type WizardStep } from '@/src/components/core/forms/wizard/progress-indicator';
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
import { useAuthModal } from '@/src/hooks/use-auth-modal';
import { useOnboardingToasts } from '@/src/hooks/use-onboarding-toasts';
import { useTemplateApplication } from '@/src/hooks/use-template-application';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

interface FormData {
  author: string;
  author_profile_url?: string;
  category: Database['public']['Enums']['content_category'];
  description: string;
  examples: string[];
  github_url?: string;
  name: string;
  submission_type: SubmissionContentType;
  tags: string[];
  thumbnail_url?: string; // Generated thumbnail URL from uploaded image
  type_specific: Record<string, unknown>;
}

// Use Constants for default enum values
const DEFAULT_CONTENT_CATEGORY = Constants.public.Enums.content_category[0]; // 'agents'
const DEFAULT_SUBMISSION_TYPE = Constants.public.Enums.submission_type[0]; // 'agents'

// Submission type enum values for comparisons
const SUBMISSION_TYPE_AGENTS = Constants.public.Enums.submission_type[0]; // 'agents'
const SUBMISSION_TYPE_MCP = Constants.public.Enums.submission_type[1]; // 'mcp'
const SUBMISSION_TYPE_RULES = Constants.public.Enums.submission_type[2]; // 'rules'
const SUBMISSION_TYPE_COMMANDS = Constants.public.Enums.submission_type[3]; // 'commands'

const DEFAULT_FORM_DATA: FormData = {
  author: '',
  author_profile_url: '',
  category: DEFAULT_CONTENT_CATEGORY, // Default to match submission_type
  description: '',
  examples: [],
  github_url: '',
  name: '',
  submission_type: DEFAULT_SUBMISSION_TYPE,
  tags: [],
  type_specific: {},
  // thumbnail_url is optional, don't include in default
};

/**
 * Multi-step submission wizard that collects content details, manages drafts, loads and applies templates, validates and uploads thumbnails, computes a quality score, and submits content for review.
 *
 * @returns The wizard UI as a React element.
 *
 * @see WizardLayout
 * @see DraftManager
 * @see useTemplateApplication
 */
export default function WizardSubmissionPage() {
  // Onboarding toasts
  useOnboardingToasts({ context: 'wizard', enabled: true });
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useAuthenticatedUser({
    context: 'WizardSubmissionPage',
    subscribe: false,
  });
  const { openAuthModal } = useAuthModal();
  const formTracking = useFormTracking();
  const { celebrateSubmission } = useConfetti();

  // Client-side logging with automatic component context
  const log = useClientLogger({
    component: 'WizardSubmissionPage',
    module: 'app/submit/wizard',
  });

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Wizard submission operation failed',
    defaultRethrow: false,
    scope: 'WizardSubmissionPage',
  }) as <T>(
    operation: () => Promise<T>,
    options?: {
      context?: Record<string, unknown>;
      level?: 'error' | 'warn';
      message?: string;
      rethrow?: boolean;
    }
  ) => Promise<T | undefined>;

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

  // Thumbnail upload state
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<null | string>(null);

  // Field highlighting for template application feedback
  const { getHighlightClasses, highlightFields } = useFieldHighlight();

  // Draft manager
  const draftManager = useMemo(
    () => new DraftManager(formData.submission_type),
    [formData.submission_type]
  );

  // Update form data helper - centralizes category/submission_type sync
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((previous) => {
      const next: FormData = { ...previous, ...updates };

      // Keep category and submission_type in sync
      if (updates.submission_type && updates.submission_type !== previous.submission_type) {
        next.category = updates.submission_type as Database['public']['Enums']['content_category'];
      }

      return next;
    });
  }, []);

  // Template application hook
  const { applyTemplate } = useTemplateApplication({
    currentFormData: formData,
    onFormUpdate: (updates) => {
      // Use updateFormData to ensure category/submission_type sync is centralized
      // Filter out undefined values to satisfy exactOptionalPropertyTypes
      const cleanUpdates = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Required for exactOptionalPropertyTypes
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ) as Partial<FormData>;
      updateFormData(cleanUpdates);

      // Highlight fields that were updated
      const updatedFields = Object.keys(updates).filter((key) => key !== 'type_specific');
      if (updatedFields.length > 0) {
        highlightFields(updatedFields);
      }
      // Highlight type-specific fields
      if (updates.type_specific) {
        const typeFields = Object.keys(updates.type_specific);
        highlightFields(typeFields.map((f) => `type_specific.${f}`));
      }
    },
    onTrackEvent: (event, data) => {
      if (event === 'template_applied') {
        formTracking.trackFieldFocused('template_applied', { ...data }).catch((error) => {
          log.warn('Failed to track template applied event', error, 'templateApplied', {
            ...data,
          });
        });
        toasts.success.templateApplied();
      }
    },
  });

  // Load templates when submission type changes
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      await runLoggedAsync(
        async () => {
          // Use static templates route (ISR) instead of API route
          // Falls back to API route if static route fails
          let response: Response;
          try {
            response = await fetch(`/templates/${formData.submission_type}`);
            // If static route returns 404, fallback to API route
            if (!response.ok && response.status === 404) {
              response = await fetch(`/api/templates?category=${formData.submission_type}`);
            }
          } catch {
            // If static route fails completely, fallback to API route
            response = await fetch(`/api/templates?category=${formData.submission_type}`);
          }

          if (response.ok) {
            const data = (await response.json()) as {
              category: string;
              count: number;
              success: boolean;
              templates: MergedTemplateItem[];
            };
            setTemplates(data.templates);
          }
        },
        {
          level: 'warn',
          message: 'Failed to load templates',
          rethrow: false,
        }
      );
      setTemplatesLoading(false);
    };

    void loadTemplates();
  }, [formData.submission_type, runLoggedAsync]);

  // Load social proof stats on mount
  useEffect(() => {
    const loadSocialProofStats = async () => {
      await runLoggedAsync(
        async () => {
          const response = await fetch('/api/stats/social-proof');
          if (response.ok) {
            const data = (await response.json()) as {
              stats: {
                contributors?: { count: number; names: string[] };
                submissions?: number;
                successRate?: number;
                totalUsers?: number;
              };
              success: boolean;
              timestamp: string;
            };
            setSocialProofStats(data.stats);
          }
        },
        {
          level: 'warn',
          message: 'Failed to load social proof stats',
          rethrow: false,
        }
      );
    };

    void loadSocialProofStats();
  }, [runLoggedAsync]);

  // Handle thumbnail image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      // Proactive auth check - show modal before attempting action
      if (status === 'loading') {
        // Wait for auth check to complete
        return;
      }

      if (!user) {
        // User is not authenticated - show auth modal
        openAuthModal({
          redirectTo: pathname ?? undefined,
          valueProposition: 'Sign in to upload images',
        });
        return;
      }

      // Client-side validation
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const MAX_DIMENSION = 2048; // 2048px

      if (file.size > MAX_FILE_SIZE) {
        toasts.error.actionFailed(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
        );
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toasts.error.actionFailed('Invalid file type. Only JPG, PNG, and WebP are allowed.');
        return;
      }

      // Verify actual file content matches MIME type (magic bytes check)
      try {
        const buffer = await file.slice(0, 12).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const isValidImage =
          // JPEG: FF D8 FF
          (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
          // PNG: 89 50 4E 47
          (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
          // WebP: 52 49 46 46 ... 57 45 42 50
          (bytes[0] === 0x52 &&
            bytes[1] === 0x49 &&
            bytes[2] === 0x46 &&
            bytes[3] === 0x46 &&
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50);

        if (!isValidImage) {
          toasts.error.actionFailed(
            'Invalid image file. File content does not match expected format.'
          );
          return;
        }
      } catch {
        toasts.error.actionFailed('Failed to validate image file.');
        return;
      }

      // Check dimensions using createImageBitmap
      try {
        const bitmap = await createImageBitmap(file);
        const { height, width } = bitmap;
        bitmap.close(); // Release memory

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          toasts.error.actionFailed(
            `Image too large. Maximum dimensions are ${MAX_DIMENSION}x${MAX_DIMENSION}px.`
          );
          return;
        }
      } catch {
        toasts.error.actionFailed('Failed to read image dimensions.');
        return;
      }

      // Create preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);

      setIsUploadingThumbnail(true);

      try {
        await runLoggedAsync(
          async () => {
            // Get Supabase session for authentication
            // eslint-disable-next-line architectural-rules/no-client-component-data-fetching -- Event handler context (user interaction), not render-time fetch
            const supabase = createSupabaseBrowserClient();
            const sessionResult = await supabase.auth.getSession();
            const session = sessionResult.data.session;

            if (!session?.access_token) {
              throw new Error('Authentication required');
            }

            // Get edge function URL
            const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
            if (!supabaseUrl) {
              throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
            }

            // Create FormData with file
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', user.id);

            // Call edge function directly with FormData
            // Note: Event handler context (user interaction), not render-time data fetching
            // eslint-disable-next-line architectural-rules/no-client-component-data-fetching -- Event handler context
            const response = await fetch(
              `${supabaseUrl}/functions/v1/public-api/transform/image/thumbnail`,
              {
                body: formData,
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
                method: 'POST',
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `Thumbnail generation failed (${response.status})`;
              try {
                const errorJson = JSON.parse(errorText) as { error?: string };
                errorMessage = errorJson.error ?? errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }
              throw new Error(errorMessage);
            }

            const result = (await response.json()) as {
              error?: string;
              path?: string;
              publicUrl?: string;
              success: boolean;
            };

            if (!result.success || !result.publicUrl) {
              throw new Error(result.error ?? 'Thumbnail generation failed');
            }

            // Update form data with thumbnail URL
            updateFormData({ thumbnail_url: result.publicUrl });
            setThumbnailPreview(result.publicUrl); // Use the generated thumbnail for preview
            toasts.success.actionCompleted('Thumbnail generated successfully!');
          },
          {
            context: {
              fileName: file.name,
              fileSize: file.size,
            },
            message: 'Thumbnail generation failed',
          }
        );
      } catch (error) {
        // Error already logged by useLoggedAsync
        setThumbnailPreview(null);
        // Remove thumbnail_url from form data on error
        setFormData((previous) => {
          const {
            author,
            author_profile_url,
            category,
            description,
            examples,
            github_url,
            name,
            submission_type,
            tags,
            type_specific,
          } = previous;
          const newData: FormData = {
            author,
            description,
            name,
            submission_type,
            ...(author_profile_url ? { author_profile_url } : {}),
            ...(github_url ? { github_url } : {}),
            category,
            examples,
            tags,
            type_specific,
          };
          return newData;
        });
        const normalized = normalizeError(error, 'Failed to generate thumbnail');
        const errorMessage = normalized.message;

        // Check if error is auth-related and show modal if so
        if (
          errorMessage.includes('signed in') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('unauthorized')
        ) {
          openAuthModal({
            redirectTo: pathname ?? undefined,
            valueProposition: 'Sign in to upload images',
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to generate thumbnail', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleImageUpload(file);
              },
            },
          });
        }
      } finally {
        setIsUploadingThumbnail(false);
      }
    },
    [user, status, openAuthModal, pathname, runLoggedAsync, updateFormData, setFormData]
  );

  // Check if can proceed from current step (defined early for draft resume validation)
  const canProceedFromStep = useCallback((step: number, data: FormData): boolean => {
    switch (step) {
      case 1: {
        return !!data.submission_type;
      }
      case 2: {
        return data.name.length >= 3 && data.description.length >= 10;
      }
      case 3: {
        return true;
      } // Type-specific fields are optional
      case 4: {
        return true;
      } // Examples are optional
      case 5: {
        return false;
      } // Last step
      default: {
        return false;
      }
    }
  }, []);

  // Build draft payload helper - centralizes draft save logic
  const buildDraftPayload = useCallback(
    (step: number, score: number): Partial<DraftFormData> => ({
      description: formData.description,
      // Convert string[] examples to structured format for DraftFormData
      examples: formData.examples.map((ex, index) => ({
        code: '',
        id: `ex-${index}`,
        language: 'typescript',
        title: ex,
      })),
      last_step: step,
      name: formData.name,
      quality_score: score,
      submission_type: formData.submission_type,
      tags: formData.tags,
      type_specific: formData.type_specific,
    }),
    [formData]
  );

  // Load draft on mount
  useEffect(() => {
    const draft = draftManager.load();
    if (draft) {
      const loadedFormData: FormData = {
        author: user?.email ?? '',
        author_profile_url: '',
        category: draft.submission_type, // Use submission_type as category
        description: draft.description,
        // Convert structured examples to string[] (extract title only for UI)
        examples: draft.examples.map((ex) => ex.title).filter(Boolean),
        github_url: '',
        name: draft.name,
        submission_type: draft.submission_type,
        tags: draft.tags,
        type_specific: draft.type_specific,
      };

      setFormData(loadedFormData);

      // Resume wizard at the last step the user was on (clamped to valid range)
      if (draft.last_step >= 1 && draft.last_step <= 5) {
        // Validate that we can proceed to this step using loaded form data
        const targetStep = draft.last_step;
        if (targetStep === 1 || canProceedFromStep(targetStep - 1, loadedFormData)) {
          setCurrentStep(targetStep);
        }
      }

      void formTracking.trackDraftLoaded({
        quality_score: draft.quality_score,
        submission_type: draft.submission_type,
      });
    }
  }, [draftManager, user, formTracking, canProceedFromStep]);

  // Calculate quality score
  const qualityScore = useMemo(() => {
    let score = 0;

    // Name (20 points)
    score += formData.name.length >= 5 ? 20 : (formData.name.length / 5) * 20;

    // Description (30 points)
    score += formData.description.length >= 100 ? 30 : (formData.description.length / 100) * 30;

    // Examples (25 points)
    score += formData.examples.length >= 3 ? 25 : (formData.examples.length / 3) * 25;

    // Tags (15 points)
    score += formData.tags.length >= 3 ? 15 : (formData.tags.length / 3) * 15;

    // Type-specific fields (10 points)
    const typeFieldCount = Object.keys(formData.type_specific).length;
    score += typeFieldCount >= 2 ? 10 : (typeFieldCount / 2) * 10;

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
        description: 'Select submission type',
        id: 'type',
        isAccessible: true,
        isCompleted: currentStep > 1,
        isCurrent: currentStep === 1,
        label: 'Choose Type',
        number: 1,
        shortLabel: 'Type',
      },
      {
        description: 'Name and description',
        id: 'basic',
        isAccessible: currentStep >= 1,
        isCompleted: currentStep > 2,
        isCurrent: currentStep === 2,
        label: 'Basic Info',
        number: 2,
        shortLabel: 'Info',
      },
      {
        description: 'Type-specific settings',
        id: 'config',
        isAccessible: currentStep >= 2 && canProceedFromCurrentStep(2),
        isCompleted: currentStep > 3,
        isCurrent: currentStep === 3,
        label: 'Configuration',
        number: 3,
        shortLabel: 'Config',
      },
      {
        description: 'Add examples and tags',
        id: 'examples',
        isAccessible: currentStep >= 3 && canProceedFromCurrentStep(3),
        isCompleted: currentStep > 4,
        isCurrent: currentStep === 4,
        label: 'Examples & Tags',
        number: 4,
        shortLabel: 'Examples',
      },
      {
        description: 'Review and submit',
        id: 'review',
        isAccessible: currentStep >= 4 && canProceedFromCurrentStep(4),
        isCompleted: false,
        isCurrent: currentStep === 5,
        label: 'Review & Submit',
        number: 5,
        shortLabel: 'Submit',
      },
    ],
    [currentStep, canProceedFromCurrentStep]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    if (canProceedFromCurrentStep(currentStep)) {
      setCurrentStep((previous) => Math.min(previous + 1, 5));
    }
  }, [currentStep, canProceedFromCurrentStep]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    setCurrentStep((previous) => Math.max(previous - 1, 1));
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
  const handleSave = useCallback(() => {
    draftManager.save(buildDraftPayload(currentStep, qualityScore));
    toasts.success.changesSaved();
  }, [draftManager, buildDraftPayload, currentStep, qualityScore]);

  // Handle final submit
  const handleSubmit = useCallback(async () => {
    // Proactive auth check - show modal before attempting action
    if (status === 'loading') {
      // Wait for auth check to complete
      return;
    }

    if (!user) {
      // User is not authenticated - show auth modal
      openAuthModal({
        redirectTo: pathname ?? undefined,
        valueProposition: 'Sign in to submit content',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContentForReview({
        author: formData.author || (user.email ?? 'Anonymous'),
        author_profile_url: formData.author_profile_url ?? '',
        category: formData.category,
        content_data: {
          ...formData.type_specific,
          examples: formData.examples,
          ...(formData.thumbnail_url
            ? {
                metadata: {
                  thumbnail_url: formData.thumbnail_url,
                },
              }
            : {}),
        },
        description: formData.description,
        github_url: formData.github_url ?? '',
        name: formData.name,
        submission_type: formData.submission_type,
        tags: formData.tags,
      });

      await formTracking.trackSubmitted(formData.submission_type, {
        quality_score: qualityScore,
        submission_id: result.data?.submission_id,
      });

      if (result.data?.success) {
        setShowCelebration(true);
        draftManager.clear();
        toasts.success.submissionCreated(formData.submission_type);

        // Fire confetti celebration for successful submission
        const confettiEnabled = checkConfettiEnabled();
        if (confettiEnabled) {
          celebrateSubmission();
        }

        // Redirect after celebration
        setTimeout(() => {
          router.push('/submit?success=true');
        }, 3000);
      } else {
        // Check if server error is auth-related
        const serverError = result.serverError || '';
        if (
          serverError.includes('signed in') ||
          serverError.includes('auth') ||
          serverError.includes('unauthorized')
        ) {
          openAuthModal({
            redirectTo: pathname ?? undefined,
            valueProposition: 'Sign in to submit content',
          });
        } else {
          // Non-auth errors - show toast with retry option
          toasts.raw.error('Failed to submit content', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleSubmit();
              },
            },
          });
        }
      }
    } catch (error) {
      log.error('Submission failed', error, 'handleSubmit', {
        qualityScore,
        submissionType: formData.submission_type,
      });
      const normalized = normalizeError(error, 'Failed to submit content');
      const errorMessage = normalized.message;

      // Check if error is auth-related and show modal if so
      if (
        errorMessage.includes('signed in') ||
        errorMessage.includes('auth') ||
        errorMessage.includes('unauthorized')
      ) {
        openAuthModal({
          redirectTo: pathname ?? undefined,
          valueProposition: 'Sign in to submit content',
        });
      } else {
        // Non-auth errors - show toast with retry option
        toasts.raw.error('Failed to submit content', {
          action: {
            label: 'Retry',
            onClick: () => {
              handleSubmit();
            },
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    status,
    openAuthModal,
    pathname,
    formData,
    formTracking,
    qualityScore,
    draftManager,
    router,
    log,
    celebrateSubmission,
  ]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        return (
          <StepTypeSelection
            onSelect={(type) => updateFormData({ submission_type: type })}
            selected={formData.submission_type}
          />
        );
      }
      case 2: {
        return (
          <StepBasicInfo
            data={formData}
            isUploadingThumbnail={isUploadingThumbnail}
            thumbnailPreview={thumbnailPreview ?? formData.thumbnail_url ?? null}
            onChange={updateFormData}
            onImageUpload={handleImageUpload}
            onRemoveThumbnail={() => {
              setFormData((previous) => {
                const {
                  submission_type,
                  name,
                  description,
                  author,
                  author_profile_url,
                  github_url,
                  type_specific,
                  tags,
                  examples,
                  category,
                } = previous;
                const newData: FormData = {
                  submission_type,
                  name,
                  description,
                  author,
                  ...(author_profile_url ? { author_profile_url } : {}),
                  ...(github_url ? { github_url } : {}),
                  type_specific,
                  tags,
                  examples,
                  category,
                };
                return newData;
              });
              setThumbnailPreview(null);
            }}
          />
        );
      }
      case 3: {
        return (
          <StepConfiguration
            data={formData.type_specific}
            getHighlightClasses={getHighlightClasses}
            onApplyTemplate={applyTemplate}
            onChange={(data) => updateFormData({ type_specific: data })}
            submissionType={formData.submission_type}
            templates={templates}
            templatesLoading={templatesLoading}
          />
        );
      }
      case 4: {
        return <StepExamplesTags data={formData} onChange={updateFormData} />;
      }
      case 5: {
        return (
          <StepReviewSubmit
            data={formData}
            isSubmitting={isSubmitting}
            qualityScore={qualityScore}
            showCelebration={showCelebration}
            onSubmit={() => {
              void handleSubmit();
            }}
          />
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <>
      {/* Inline Preview - Desktop Sidebar */}
      <div className="hidden lg:sticky lg:top-24 lg:block lg:w-80">
        <InlinePreview formData={formData} qualityScore={qualityScore} />
      </div>
      <WizardLayout
        canGoNext={canProceedFromCurrentStep(currentStep)}
        canGoPrevious={currentStep > 1}
        currentStep={currentStep}
        isLastStep={currentStep === 5}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleSave}
        onStepChange={handleStepChange}
        qualityScore={qualityScore}
        steps={steps}
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
 * Renders the "Choose Your Submission Type" step UI for the submission wizard.
 *
 * Displays a header with decorative icon and social proof, and renders the type selection cards.
 *
 * @param root0
 * @param root0.onSelect
 * @param props.selected - Currently selected submission content type.
 * @param props.onSelect - Callback invoked when a submission type is chosen.
 * @param root0.selected
 * @returns The JSX element for the type selection step.
 *
 * @see WizardSubmissionPage
 */
function StepTypeSelection({
  onSelect,
  selected,
}: {
  onSelect: (type: SubmissionContentType) => void;
  selected: SubmissionContentType;
}) {
  return (
    <div className="space-y-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={SPRING.smooth}
      >
        <motion.div
          animate={{ scale: 1 }}
          className="mb-4 inline-flex"
          initial={{ scale: 0 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Choose Your Submission Type</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          What would you like to share with the community?
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={1} />
        </div>
      </motion.div>

      <TypeSelectionCards onSelect={onSelect} selected={selected} />
    </div>
  );
}

/**
 * Render the "Basic Information" step of the submission wizard, providing inputs for name,
 * description, author, GitHub URL, and an optional thumbnail upload with preview and removal.
 *
 * Provides live validation state for the name and description fields and invokes callbacks
 * when form values change, an image is selected for thumbnail generation, or the thumbnail is removed.
 *
 * @param props.data - Current form values for the step.
 * @param root0
 * @param root0.data
 * @param root0.isUploadingThumbnail
 * @param props.onChange - Called with partial updates to form data when any field changes.
 * @param root0.onChange
 * @param props.onImageUpload - Handler invoked with a selected image file to generate/upload a thumbnail.
 * @param props.isUploadingThumbnail - Whether a thumbnail is currently being generated/uploaded.
 * @param root0.onImageUpload
 * @param root0.onRemoveThumbnail
 * @param props.thumbnailPreview - Local or remote URL to render the thumbnail preview, or `null` if none.
 * @param props.onRemoveThumbnail - Callback to remove the current thumbnail and clear its preview.
 * @param root0.thumbnailPreview
 * @returns The JSX for step 2 (basic information) of the wizard.
 *
 * @see WizardSubmissionPage
 * @see AnimatedFormField
 */
function StepBasicInfo({
  data,
  isUploadingThumbnail,
  onChange,
  onImageUpload,
  onRemoveThumbnail,
  thumbnailPreview,
}: {
  data: FormData;
  isUploadingThumbnail: boolean;
  onChange: (updates: Partial<FormData>) => void;
  onImageUpload: (file: File) => Promise<void>;
  onRemoveThumbnail: () => void;
  thumbnailPreview: null | string;
}) {
  // Real-time validation - computed directly from data (derived state)
  // Using useMemo instead of useState + useEffect to avoid cascading renders
  const nameValidation = useMemo<ValidationState>(() => {
    if (data.name.length === 0) {
      return 'idle';
    } else if (data.name.length < 3) {
      return 'invalid';
    } else {
      return 'valid';
    }
  }, [data.name]);

  const descValidation = useMemo<ValidationState>(() => {
    if (data.description.length === 0) {
      return 'idle';
    } else if (data.description.length < 10) {
      return 'warning';
    } else if (data.description.length < 50) {
      return 'valid';
    } else {
      return 'valid';
    }
  }, [data.description]);

  return (
    <div className="space-y-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={SPRING.smooth}
      >
        <motion.div
          animate={{ scale: 1 }}
          className="mb-4 inline-flex"
          initial={{ scale: 0 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
        >
          <FileText className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Tell us about it</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Give your submission a clear name and description
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="space-y-6 pt-6">
            <AnimatedFormField
              helpText="A clear, descriptive name"
              id="wizard-name"
              label="Name"
              required
              validationState={nameValidation}
              {...(nameValidation === 'invalid'
                ? { errorMessage: 'Name must be at least 3 characters' }
                : {})}
              {...(nameValidation === 'valid' ? { successMessage: 'Great name!' } : {})}
              currentLength={data.name.length}
              maxLength={100}
              showCharCount
            >
              <Input
                className="pr-12"
                id="wizard-name"
                maxLength={100}
                onChange={(event) => onChange({ name: event.target.value })}
                placeholder="e.g., React Query Expert"
                value={data.name}
              />
            </AnimatedFormField>

            <AnimatedFormField
              helpText="Explain what your configuration does and how to use it"
              id="wizard-description"
              label="Description"
              required
              validationState={descValidation}
              {...(descValidation === 'warning'
                ? {
                    warningMessage: 'Add more details to help users understand',
                  }
                : {})}
              {...(descValidation === 'valid' && data.description.length >= 50
                ? { successMessage: 'Excellent description!' }
                : {})}
              currentLength={data.description.length}
              maxLength={500}
              showCharCount
            >
              <Textarea
                id="wizard-description"
                maxLength={500}
                placeholder="Describe what your configuration does..."
                rows={6}
                value={data.description}
                onChange={(event) => onChange({ description: event.target.value })}
              />
            </AnimatedFormField>

            <AnimatedFormField
              helpText="Your name or username"
              id="wizard-author"
              label="Author Name"
              required
            >
              <Input
                id="wizard-author"
                placeholder="Your name"
                value={data.author}
                onChange={(event) => onChange({ author: event.target.value })}
              />
            </AnimatedFormField>

            <AnimatedFormField
              helpText="Link to the repository or your profile"
              id="wizard-github"
              label="GitHub URL (Optional)"
            >
              <Input
                id="wizard-github"
                placeholder="https://github.com/..."
                type="url"
                value={data.github_url ?? ''}
                onChange={(event) => onChange({ github_url: event.target.value })}
              />
            </AnimatedFormField>

            {/* Thumbnail Image Upload */}
            <AnimatedFormField
              helpText="Upload an image to generate an optimized thumbnail for your submission"
              id="wizard-thumbnail"
              label="Thumbnail Image (Optional)"
            >
              <div className="space-y-4">
                {/* File Input */}
                <div className="flex items-center gap-4">
                  <label
                    className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 transition-colors"
                    htmlFor="thumbnail-upload"
                    style={{
                      borderColor: TOKENS.colors.border.light,
                      ...(isUploadingThumbnail && { opacity: 0.6, pointerEvents: 'none' }),
                    }}
                  >
                    <ImageIcon className="text-muted-foreground h-5 w-5" />
                    <span className="text-sm font-medium">
                      {isUploadingThumbnail ? 'Generating thumbnail...' : 'Choose image'}
                    </span>
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingThumbnail}
                      id="thumbnail-upload"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void onImageUpload(file);
                        }
                        // Reset input to allow re-selecting the same file
                        event.target.value = '';
                      }}
                      type="file"
                    />
                  </label>
                </div>

                {/* Thumbnail Preview */}
                <AnimatePresence mode="wait">
                  {thumbnailPreview ? (
                    <motion.div
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative inline-block"
                      exit={{ opacity: 0, scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      transition={SPRING.smooth}
                    >
                      <div
                        className="relative h-32 w-32 overflow-hidden rounded-lg border"
                        style={{ borderColor: TOKENS.colors.border.light }}
                      >
                        <Image
                          alt="Thumbnail preview"
                          className="object-cover"
                          fill
                          src={thumbnailPreview}
                          unoptimized={thumbnailPreview.startsWith('blob:')}
                        />
                      </div>
                      <motion.button
                        className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm"
                        disabled={isUploadingThumbnail}
                        onClick={onRemoveThumbnail}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </AnimatedFormField>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Render the configuration step of the submission wizard for the selected content type.
 *
 * @param submissionType.data
 * @param submissionType.getHighlightClasses
 * @param submissionType.onApplyTemplate
 * @param submissionType.onChange
 * @param submissionType - The selected content type which controls which type-specific fields are shown.
 * @param data - Current type-specific form values (e.g., systemPrompt, temperature, npmPackage).
 * @param onChange - Callback invoked with updated type-specific data when any field changes.
 * @param submissionType.submissionType
 * @param templates - Optional templates available for the current content type shown in the quick-select.
 * @param submissionType.templates
 * @param templatesLoading - When true, show a loading skeleton for the template selector.
 * @param onApplyTemplate - Optional callback invoked when a template is applied from the quick-select.
 * @param getHighlightClasses - Optional helper that returns CSS classes to highlight a given field path (e.g., "type_specific.systemPrompt").
 * @param submissionType.templatesLoading
 * @returns The rendered React element for the configuration step.
 *
 * @see StepSocialProof
 * @see TemplateQuickSelect
 * @see AnimatedFormField
 */
function StepConfiguration({
  data,
  getHighlightClasses,
  onApplyTemplate,
  onChange,
  submissionType,
  templates,
  templatesLoading,
}: {
  data: Record<string, unknown>;
  getHighlightClasses?: (field: string) => string;
  onApplyTemplate?: (template: MergedTemplateItem) => void;
  onChange: (data: Record<string, unknown>) => void;
  submissionType: SubmissionContentType;
  templates?: MergedTemplateItem[];
  templatesLoading?: boolean;
}) {
  const hasTemplates = templates && templates.length > 0;
  return (
    <div className="space-y-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={SPRING.smooth}
      >
        <motion.div
          animate={{ scale: 1 }}
          className="mb-4 inline-flex"
          initial={{ scale: 0 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
        >
          <Code className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Configuration Details</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Type-specific settings for your {submissionType}
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={3} />
        </div>
      </motion.div>

      {/* Template Quick Select - Show at top of configuration step */}
      {templatesLoading ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.medium }}
        >
          <TemplateQuickSelectSkeleton />
        </motion.div>
      ) : null}

      {hasTemplates && onApplyTemplate && !templatesLoading ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ ...SPRING.smooth, delay: STAGGER.medium }}
        >
          <TemplateQuickSelect
            contentType={submissionType as Database['public']['Enums']['content_category']}
            maxVisible={3}
            onApplyTemplate={onApplyTemplate}
            templates={templates}
          />
        </motion.div>
      ) : null}

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
      >
        <Card
          style={{
            backgroundColor: TOKENS.colors.background.secondary,
            borderColor: TOKENS.colors.border.light,
          }}
        >
          <CardContent className="space-y-6 pt-6">
            {submissionType === SUBMISSION_TYPE_AGENTS && (
              <>
                <AnimatedFormField
                  currentLength={((data['systemPrompt'] as string) || '').length}
                  helpText="The main prompt that defines the agent's behavior"
                  id="wizard-system-prompt"
                  label="System Prompt"
                  maxLength={2000}
                  required
                  showCharCount
                >
                  <Textarea
                    className={getHighlightClasses?.('type_specific.systemPrompt')}
                    id="wizard-system-prompt"
                    maxLength={2000}
                    onChange={(event) => onChange({ ...data, systemPrompt: event.target.value })}
                    placeholder="You are an expert in..."
                    rows={8}
                    value={(data['systemPrompt'] as string) || ''}
                  />
                </AnimatedFormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AnimatedFormField
                    helpText="0.0 to 1.0 (default: 0.7)"
                    id="wizard-temperature"
                    label="Temperature"
                  >
                    <Input
                      id="wizard-temperature"
                      max={1}
                      min={0}
                      step={0.1}
                      type="number"
                      value={(data['temperature'] as number | undefined) ?? 0.7}
                      onChange={(event) => {
                        const raw = event.target.value;
                        const parsed = raw === '' ? undefined : Number.parseFloat(raw);
                        onChange({
                          ...data,
                          temperature: Number.isNaN(parsed as number) ? undefined : parsed,
                        });
                      }}
                    />
                  </AnimatedFormField>

                  <AnimatedFormField
                    helpText="Maximum response length"
                    id="wizard-max-tokens"
                    label="Max Tokens"
                  >
                    <Input
                      id="wizard-max-tokens"
                      max={4096}
                      min={100}
                      step={100}
                      type="number"
                      value={(data['maxTokens'] as number | undefined) ?? 2048}
                      onChange={(event) => {
                        const raw = event.target.value;
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

            {submissionType === SUBMISSION_TYPE_MCP && (
              <>
                <AnimatedFormField
                  helpText="The npm package name"
                  id="wizard-npm-package"
                  label="NPM Package"
                  required
                >
                  <Input
                    id="wizard-npm-package"
                    placeholder="@modelcontextprotocol/server-..."
                    value={(data['npmPackage'] as string) || ''}
                    onChange={(event) => onChange({ ...data, npmPackage: event.target.value })}
                  />
                </AnimatedFormField>

                <AnimatedFormField
                  helpText="How to install this MCP server"
                  id="wizard-install-command"
                  label="Install Command"
                >
                  <Input
                    id="wizard-install-command"
                    placeholder="npm install -g @modelcontextprotocol/..."
                    value={(data['installCommand'] as string) || ''}
                    onChange={(event) => onChange({ ...data, installCommand: event.target.value })}
                  />
                </AnimatedFormField>

                <AnimatedFormField
                  helpText="Describe the tools this MCP server provides"
                  id="wizard-tools-description"
                  label="Tools Description"
                >
                  <Textarea
                    id="wizard-tools-description"
                    placeholder="This server provides tools for..."
                    rows={4}
                    value={(data['toolsDescription'] as string) || ''}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        toolsDescription: event.target.value,
                      })
                    }
                  />
                </AnimatedFormField>
              </>
            )}

            {submissionType === SUBMISSION_TYPE_RULES && (
              <AnimatedFormField
                currentLength={((data['rulesContent'] as string) || '').length}
                helpText="The expertise rules or guidelines"
                id="wizard-rules-content"
                label="Rules Content"
                maxLength={3000}
                required
                showCharCount
              >
                <Textarea
                  id="wizard-rules-content"
                  maxLength={3000}
                  placeholder="When working with TypeScript..."
                  rows={10}
                  value={(data['rulesContent'] as string) || ''}
                  onChange={(event) => onChange({ ...data, rulesContent: event.target.value })}
                />
              </AnimatedFormField>
            )}

            {submissionType === SUBMISSION_TYPE_COMMANDS && (
              <AnimatedFormField
                currentLength={((data['commandContent'] as string) || '').length}
                helpText="The shell command or script"
                id="wizard-command-content"
                label="Command Content"
                maxLength={1000}
                required
                showCharCount
              >
                <Textarea
                  className="font-mono"
                  id="wizard-command-content"
                  maxLength={1000}
                  onChange={(event) => onChange({ ...data, commandContent: event.target.value })}
                  placeholder="#!/bin/bash..."
                  rows={6}
                  value={(data['commandContent'] as string) || ''}
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
 * Renders the "Examples & Tags" wizard step allowing users to add, remove, and review usage examples and discovery tags.
 *
 * @param data - Current form data containing `examples` and `tags`.
 * @param data.data
 * @param onChange - Callback invoked with partial `FormData` updates when examples or tags change.
 * @param data.onChange
 * @see WizardSubmissionPage
 * @see StepSocialProof
 
 * @returns {unknown} Description of return value*/
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
      examples: data.examples.filter((_, index_) => index_ !== index),
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
      tags: data.tags.filter((_, index_) => index_ !== index),
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        transition={SPRING.smooth}
      >
        <motion.div
          animate={{ scale: 1 }}
          className="mb-4 inline-flex"
          initial={{ scale: 0 }}
          transition={{ ...SPRING.bouncy, delay: STAGGER.default }}
        >
          <Sparkles className="h-12 w-12" style={{ color: TOKENS.colors.accent.primary }} />
        </motion.div>
        <h2 className="text-foreground text-3xl font-bold">Examples & Tags</h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Help others understand and discover your submission
        </p>
        <div className="mt-4 flex justify-center">
          <StepSocialProof step={4} />
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
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
                className="flex-1"
                onChange={(event) => setNewExample(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addExample();
                  }
                }}
                placeholder="e.g., 'Create a React component'"
                value={newExample}
              />
              <Button
                disabled={!newExample.trim()}
                onClick={addExample}
                style={{
                  backgroundColor: TOKENS.colors.accent.primary,
                }}
                type="button"
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
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className="group hover:border-accent/50 flex items-start gap-3 rounded-lg border p-3 transition-all"
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        initial={{ opacity: 0, scale: 0.9, x: -20 }}
                        key={exampleKey}
                        style={{
                          backgroundColor: TOKENS.colors.background.primary,
                          borderColor: TOKENS.colors.border.default,
                        }}
                        transition={SPRING.snappy}
                      >
                        <div
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}20`,
                            color: TOKENS.colors.accent.primary,
                          }}
                        >
                          {index + 1}
                        </div>
                        <span className="flex-1 text-sm leading-relaxed">{example}</span>
                        <motion.button
                          className="shrink-0 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100"
                          onClick={() => removeExample(index)}
                          style={{
                            color: TOKENS.colors.error.text,
                          }}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-8 text-center"
                  initial={{ opacity: 0 }}
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Code className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
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
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ ...SPRING.smooth, delay: STAGGER.default }}
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
              <span className="text-muted-foreground ml-auto text-sm font-normal">
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
                className="flex-1"
                maxLength={30}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g., 'react', 'typescript', 'api'"
                value={newTag}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="gap-2"
                  disabled={!newTag.trim()}
                  onClick={addTag}
                  style={{
                    backgroundColor: TOKENS.colors.accent.primary,
                  }}
                  type="button"
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
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        initial={{ opacity: 0, scale: 0 }}
                        key={tagKey}
                        transition={SPRING.bouncy}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge
                          className="group gap-1.5 pr-1 text-sm"
                          style={{
                            backgroundColor: `${TOKENS.colors.accent.primary}15`,
                            borderColor: `${TOKENS.colors.accent.primary}30`,
                            color: TOKENS.colors.accent.primary,
                          }}
                          variant="secondary"
                        >
                          {tag}
                          <button
                            className="hover:bg-accent/20 ml-1 rounded-full p-0.5 transition-colors"
                            onClick={() => {
                              const tagIndex = data.tags.indexOf(tag);
                              if (tagIndex !== -1) {
                                removeTag(tagIndex);
                              }
                            }}
                            type="button"
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
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-dashed p-6 text-center"
                  initial={{ opacity: 0 }}
                  style={{
                    borderColor: TOKENS.colors.border.light,
                  }}
                >
                  <Tag className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
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
