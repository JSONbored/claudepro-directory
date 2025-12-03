'use client';

/**
 * Quiz Form - Database-First Architecture
 * All questions/options fetched from PostgreSQL.
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { getQuizConfigurationAction } from '@heyclaude/web-runtime/actions';
import { generateConfigRecommendations, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import {
  between,
  bgColor,
  borderColor,
  cluster,
  gap,
  grid,
  helper,
  iconLeading,
  iconSize,
  alignItems,
  justify,
  marginTop,
  muted,
  opacityLevel,
  overflow,
  padding,
  radius,
  size,
  spaceY,
  textColor,
  transition,
  weight,
  display,
  position,
  borderWidth,
  textAlign,
  marginY,
  marginLeft,
  cursor,
  hoverBorder,
} from '@heyclaude/web-runtime/design-system';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { z } from 'zod';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { Separator } from '@heyclaude/web-runtime/ui';

// Use enum values directly from @heyclaude/database-types Constants
const EXPERIENCE_LEVEL_VALUES = Constants.public.Enums.experience_level;
const FOCUS_AREA_TYPE_VALUES = Constants.public.Enums.focus_area_type;
const INTEGRATION_TYPE_VALUES = Constants.public.Enums.integration_type;
const USE_CASE_TYPE_VALUES = Constants.public.Enums.use_case_type;

// Use generated type directly from @heyclaude/database-types
type QuizConfigurationResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

type QuizQuestion = {
  id: string;
  question: string;
  description: string | null;
  required: boolean;
  displayOrder: number;
  options: Array<{
    value: string;
    label: string;
    description: string | null;
    iconName: string | null;
  }>;
};

/**
 * Convert a raw quiz configuration RPC result into an array of normalized QuizQuestion objects.
 *
 * The function normalizes nullable/missing fields into sensible defaults (empty strings for text,
 * `false` for booleans, `0` for numeric ordering, and empty arrays for options) and maps option
 * fields to the QuizQuestion option shape.
 *
 * @param config - Raw `QuizConfigurationResult` returned from the `get_quiz_configuration` RPC; may be `null` or an empty array.
 * @returns An array of `QuizQuestion` objects when `config` contains entries, or `null` if `config` is `null`, not an array, or empty.
 *
 * @see get_quiz_configurationAction
 * @see QuizForm
 * @see QuizQuestion
 */
function mapQuizConfigToQuestions(config: QuizConfigurationResult | null): QuizQuestion[] | null {
  if (!(config && Array.isArray(config)) || config.length === 0) {
    return null;
  }

  return config.map((q) => ({
    id: q.id ?? '',
    question: q.question ?? '',
    description: q.description,
    required: q.required ?? false,
    displayOrder: q.display_order ?? 0,
    options: (q.options ?? []).map((opt) => ({
      value: opt.value ?? '',
      label: opt.label ?? '',
      description: opt.description,
      iconName: opt.icon_name,
    })),
  }));
}

import { ArrowLeft, ArrowRight, Sparkles } from '@heyclaude/web-runtime/icons';
import { toasts } from '@heyclaude/web-runtime/ui';
import { minWidth } from '@heyclaude/web-runtime/design-system';
import { InlineSpinner } from '@heyclaude/web-runtime/ui';
import { QuestionCard } from './question-card';
import { QuizProgress } from './quiz-progress';

// Manual Zod schema (database validates via RPC function)
const quizAnswersSchema = z.object({
  useCase: z.enum([...USE_CASE_TYPE_VALUES] as [
    Database['public']['Enums']['use_case_type'],
    ...Database['public']['Enums']['use_case_type'][],
  ]),
  experienceLevel: z.enum([...EXPERIENCE_LEVEL_VALUES] as [
    Database['public']['Enums']['experience_level'],
    ...Database['public']['Enums']['experience_level'][],
  ]),
  toolPreferences: z.array(z.string()).min(1).max(5),
  p_integrations: z
    .array(
      z.enum([...INTEGRATION_TYPE_VALUES] as [
        Database['public']['Enums']['integration_type'],
        ...Database['public']['Enums']['integration_type'][],
      ])
    )
    .optional(),
  p_focus_areas: z
    .array(
      z.enum([...FOCUS_AREA_TYPE_VALUES] as [
        Database['public']['Enums']['focus_area_type'],
        ...Database['public']['Enums']['focus_area_type'][],
      ])
    )
    .optional(),
  teamSize: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

type QuizAnswers = z.infer<typeof quizAnswersSchema>;

/**
 * Encodes a quiz answers object into a URL-safe base64 string.
 *
 * @param answers - The quiz answers object to encode.
 * @returns A URL-safe base64 (base64url) representation of `answers`.
 */
function encodeQuizAnswers(answers: QuizAnswers): string {
  return Buffer.from(JSON.stringify(answers)).toString('base64url');
}

/**
 * Renders an interactive multi-step quiz that fetches question configuration, collects and validates user answers, and generates configuration recommendations.
 *
 * This component:
 * - Loads quiz configuration from the server on mount and maps it to internal question data.
 * - Presents questions one at a time (single- and multi-select), enforces required fields and per-question validation, and shows a review step.
 * - Submits validated answers to generate recommendations, encodes the answers, and navigates to the results page on success.
 * - Displays loading states, per-field errors, and user-facing toasts for load/validation/submission failures.
 *
 * @returns The quiz form UI element for collecting and submitting quiz answers.
 *
 * @see QuizProgress
 * @see QuestionCard
 * @see generateConfigRecommendations
 */
export function QuizForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const runLoggedAsync = useLoggedAsync({
    scope: 'QuizForm',
    defaultMessage: 'Quiz operation failed',
    defaultRethrow: false,
  });
  const [quizConfig, setQuizConfig] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    toolPreferences: [],
    p_integrations: [],
    p_focus_areas: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getQuizConfigurationAction({})
      .then((result) => {
        if (result?.data) {
          const mapped = mapQuizConfigToQuestions(result.data);
          setQuizConfig(mapped);
        }
        if (result?.serverError) {
          // Error already logged by safe-action middleware
          const normalized = normalizeError(
            result.serverError,
            'Failed to load quiz configuration'
          );
          logger.error('Failed to load quiz configuration', normalized);
          toasts.error.actionFailed('load quiz');
        }
      })
      .catch((err) => {
        const normalized = normalizeError(err, 'Failed to load quiz configuration');
        logger.error('Failed to load quiz configuration', normalized);
        toasts.error.actionFailed('load quiz');
      });
  }, []);

  const updateAnswer = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleArrayAnswer = <K extends keyof QuizAnswers>(key: K, value: string) => {
    const currentArray = (answers[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];

    updateAnswer(key, newArray as QuizAnswers[K]);
  };

  const validateCurrentQuestion = (): boolean => {
    if (!quizConfig) return false;

    const question = quizConfig[currentQuestion - 1];
    if (!question?.required) return true;

    const newErrors: Record<string, string> = {};
    const fieldMap: Record<string, keyof QuizAnswers> = {
      use_case: 'useCase',
      experience_level: 'experienceLevel',
      tool_preferences: 'toolPreferences',
    };

    const fieldKey = fieldMap[question.id];
    if (fieldKey) {
      const value = answers[fieldKey];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        newErrors[fieldKey] = `Please select ${question.question.toLowerCase()}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNext = () => {
    if (validateCurrentQuestion()) {
      if (quizConfig && currentQuestion < quizConfig.length) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!(answers.useCase && answers.experienceLevel && answers.toolPreferences?.length)) {
      toasts.error.requiredFields();
      setCurrentQuestion(1);
      return;
    }

    try {
      const validatedAnswers = quizAnswersSchema.parse({
        ...answers,
        timestamp: new Date().toISOString(),
      });

      startTransition(async () => {
        try {
          await runLoggedAsync(
            async () => {
              const result = await generateConfigRecommendations({
                useCase: validatedAnswers.useCase,
                experienceLevel: validatedAnswers.experienceLevel,
                toolPreferences: validatedAnswers.toolPreferences,
                ...(validatedAnswers.p_integrations && {
                  integrations: validatedAnswers.p_integrations,
                }),
                ...(validatedAnswers.p_focus_areas && {
                  focusAreas: validatedAnswers.p_focus_areas,
                }),
              });

              if (result?.success && result.recommendations) {
                const encoded = encodeQuizAnswers(validatedAnswers);

                router.push(
                  `/tools/config-recommender/results/${result.recommendations.id}?answers=${encoded}`
                );

                logger.info('Quiz completed', {
                  useCase: validatedAnswers.useCase,
                  experienceLevel: validatedAnswers.experienceLevel,
                  resultId: result.recommendations.id,
                });
              } else {
                throw new Error('Failed to generate recommendations');
              }
            },
            {
              message: 'Quiz submission failed',
              context: {
                useCase: validatedAnswers.useCase,
                experienceLevel: validatedAnswers.experienceLevel,
                toolPreferencesCount: validatedAnswers.toolPreferences?.length ?? 0,
              },
            }
          );
        } catch (error) {
          // Error already logged by useLoggedAsync
          toasts.error.actionFailed('generate recommendations');
        }
      });
    } catch (error) {
      toasts.error.invalidInput();
      const normalized = normalizeError(error, 'Quiz validation failed');
      logger.error('Quiz validation failed', normalized);
    }
  };

  if (!quizConfig) {
    return (
      <div className={`${display.flex} ${alignItems.center} ${justify.center} ${padding.section}`}>
        <InlineSpinner size="lg" />
      </div>
    );
  }

  const totalQuestions = quizConfig.length;
  const progressPercentage = Math.round((currentQuestion / totalQuestions) * 100);
  const currentQuestionData = quizConfig[currentQuestion - 1];

  if (!currentQuestionData) return null;

  const fieldMap: Record<string, keyof QuizAnswers> = {
    use_case: 'useCase',
    experience_level: 'experienceLevel',
    tool_preferences: 'toolPreferences',
    integrations: 'p_integrations',
    focus_areas: 'p_focus_areas',
    team_size: 'teamSize',
  };

  const fieldKey = fieldMap[currentQuestionData.id];
  const isMultiSelect = ['tool_preferences', 'integrations', 'focus_areas'].includes(
    currentQuestionData.id
  );

  return (
    <div className={spaceY.relaxed}>
      <QuizProgress
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        percentComplete={progressPercentage}
      />

      <Card className={`${position.relative} ${overflow.hidden}`}>
        <CardHeader>
          <CardTitle className={cluster.compact}>
            <span className={muted.sm}>
              Question {currentQuestion} of {totalQuestions}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className={spaceY.relaxed}>
          {currentQuestionData.id === 'review' ? (
            <QuestionCard
              question={currentQuestionData.question}
              {...(currentQuestionData.description && {
                description: currentQuestionData.description,
              })}
            >
              <div className={spaceY.comfortable}>
                <div className={`${spaceY.compact} ${radius.lg} ${bgColor.muted} ${padding.default}`}>
                  <div>
                    <span className={weight.medium}>Use Case:</span>{' '}
                    <span className={muted.default}>
                      {answers.useCase?.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className={weight.medium}>Experience:</span>{' '}
                    <span className={muted.default}>{answers.experienceLevel}</span>
                  </div>
                  <div>
                    <span className={weight.medium}>Tool Preferences:</span>{' '}
                    <span className={muted.default}>
                      {answers.toolPreferences?.join(', ')}
                    </span>
                  </div>
                  {answers.p_integrations && answers.p_integrations.length > 0 && (
                    <div>
                      <span className={weight.medium}>Integrations:</span>{' '}
                      <span className={muted.default}>
                        {answers.p_integrations.join(', ')}
                      </span>
                    </div>
                  )}
                  {answers.p_focus_areas && answers.p_focus_areas.length > 0 && (
                    <div>
                      <span className={weight.medium}>Focus Areas:</span>{' '}
                      <span className={muted.default}>
                        {answers.p_focus_areas.join(', ')}
                      </span>
                    </div>
                  )}
                  {answers.teamSize && (
                    <div>
                      <span className={weight.medium}>Team Size:</span>{' '}
                      <span className={muted.default}>{answers.teamSize}</span>
                    </div>
                  )}
                </div>

                <Card className={`${borderColor['primary/20']} ${bgColor['primary/5']}`}>
                  <CardHeader>
                    <CardTitle className={`${cluster.compact} ${size.lg}`}>
                      <Sparkles className={`${iconSize.md} ${textColor.primary}`} />
                      What happens next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className={`${spaceY.compact} ${muted.sm}`}>
                      <li>? We'll analyze 147+ configurations</li>
                      <li>? Match them to your specific needs</li>
                      <li>? Show you the top 8-10 best fits</li>
                      <li>? Explain why each was recommended</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </QuestionCard>
          ) : (
            <QuestionCard
              question={currentQuestionData.question}
              required={currentQuestionData.required}
              {...(currentQuestionData.description && {
                description: currentQuestionData.description,
              })}
            >
              <div
                className={`${grid.base} ${gap.default} ${currentQuestionData.options.length > 3 ? `sm:${grid.responsive2.split(' ')[2]}` : ''}`}
              >
                {currentQuestionData.options.map((option) => {
                  if (!fieldKey) return null;

                  const isSelected = isMultiSelect
                    ? (answers[fieldKey] as string[])?.includes(option.value)
                    : answers[fieldKey] === option.value;

                  const canSelect =
                    !isMultiSelect ||
                    isSelected ||
                    (currentQuestionData.id === 'focus_areas' &&
                      ((answers[fieldKey] as string[])?.length || 0) < 3) ||
                    currentQuestionData.id !== 'focus_areas';

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (isMultiSelect && fieldKey) {
                          toggleArrayAnswer(fieldKey, option.value);
                        } else if (fieldKey) {
                          updateAnswer(fieldKey, option.value as string);
                        }
                      }}
                      disabled={!canSelect}
                      className={`${radius.lg} ${borderWidth['2']} ${padding.default} ${textAlign.left} ${transition.all} ${
                        isSelected
                          ? `${borderColor.primary} ${bgColor['primary/5']}`
                          : canSelect
                            ? `${borderColor.border} ${hoverBorder.primary}`
                            : `${cursor.notAllowed} ${borderColor.border} ${opacityLevel[50]}`
                      }`}
                    >
                      <div className={weight.medium}>{option.label}</div>
                      <div className={`${marginTop.tight} ${muted.sm}`}>{option.description}</div>
                    </button>
                  );
                })}
              </div>
              {fieldKey && errors[fieldKey] && (
                <p className={`${marginTop.compact} ${helper.destructive}`}>{errors[fieldKey]}</p>
              )}
            </QuestionCard>
          )}

          <Separator className={marginY.relaxed} />
          <div className={between.center}>
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestion === 1 || isPending}
            >
              <ArrowLeft className={iconLeading.sm} />
              Previous
            </Button>

            {currentQuestion < totalQuestions ? (
              <Button type="button" onClick={goToNext} disabled={isPending}>
                Next
                <ArrowRight className={`${marginLeft.compact} ${iconSize.sm}`} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={minWidth.input}
              >
                {isPending ? (
                  <InlineSpinner size="sm" message="Generating..." />
                ) : (
                  <>
                    <Sparkles className={iconLeading.sm} />
                    Get Results
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}