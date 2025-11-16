'use client';

/**
 * Quiz Form - Database-First Architecture
 * All questions/options fetched from PostgreSQL.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { z } from 'zod';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { Separator } from '@/src/components/primitives/ui/separator';
import { getQuizConfiguration } from '@/src/lib/actions/quiz.actions';
import { generateConfigRecommendations } from '@/src/lib/edge/client';
import type {
  ExperienceLevel,
  FocusAreaType,
  GetQuizConfigurationReturn,
  IntegrationType,
  UseCaseType,
} from '@/src/types/database-overrides';
import {
  EXPERIENCE_LEVEL_VALUES,
  FOCUS_AREA_TYPE_VALUES,
  INTEGRATION_TYPE_VALUES,
  USE_CASE_TYPE_VALUES,
} from '@/src/types/database-overrides';

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

function mapQuizConfigToQuestions(
  config: GetQuizConfigurationReturn | null
): QuizQuestion[] | null {
  if (!config?.questions) {
    return null;
  }

  // GetQuizConfigurationReturn has simpler structure - map to QuizQuestion format
  // Note: This is a type mismatch - the RPC returns a different structure than expected
  // This should be addressed in a future refactor to align RPC return with component needs
  return config.questions.map((q, index) => ({
    id: q.id,
    question: q.question,
    description: null,
    required: true,
    displayOrder: index,
    options: q.options.map((opt) => ({
      value: opt,
      label: opt,
      description: null,
      iconName: null,
    })),
  }));
}

import { InlineSpinner } from '@/src/components/primitives/feedback/loading-factory';
import { ArrowLeft, ArrowRight, Sparkles } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { DIMENSIONS, UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import { QuestionCard } from './question-card';
import { QuizProgress } from './quiz-progress';

// Manual Zod schema (database validates via RPC function)
const quizAnswersSchema = z.object({
  useCase: z.enum([...USE_CASE_TYPE_VALUES] as [UseCaseType, ...UseCaseType[]]),
  experienceLevel: z.enum([...EXPERIENCE_LEVEL_VALUES] as [ExperienceLevel, ...ExperienceLevel[]]),
  toolPreferences: z.array(z.string()).min(1).max(5),
  p_integrations: z
    .array(z.enum([...INTEGRATION_TYPE_VALUES] as [IntegrationType, ...IntegrationType[]]))
    .optional(),
  p_focus_areas: z
    .array(z.enum([...FOCUS_AREA_TYPE_VALUES] as [FocusAreaType, ...FocusAreaType[]]))
    .optional(),
  teamSize: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

type QuizAnswers = z.infer<typeof quizAnswersSchema>;

function encodeQuizAnswers(answers: QuizAnswers): string {
  return Buffer.from(JSON.stringify(answers)).toString('base64url');
}

export function QuizForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quizConfig, setQuizConfig] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    toolPreferences: [],
    p_integrations: [],
    p_focus_areas: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getQuizConfiguration({})
      .then((result) => {
        if (result?.data) {
          const mapped = mapQuizConfigToQuestions(result.data);
          setQuizConfig(mapped);
        }
        if (result?.serverError) {
          // Error already logged by safe-action middleware
          logger.error('Failed to load quiz configuration', new Error(result.serverError));
          toasts.error.actionFailed('load quiz');
        }
      })
      .catch((err) => {
        logger.error('Failed to load quiz configuration', err);
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
          const result = await generateConfigRecommendations({
            useCase: validatedAnswers.useCase,
            experienceLevel: validatedAnswers.experienceLevel,
            toolPreferences: validatedAnswers.toolPreferences,
            ...(validatedAnswers.p_integrations && {
              integrations: validatedAnswers.p_integrations,
            }),
            ...(validatedAnswers.p_focus_areas && { focusAreas: validatedAnswers.p_focus_areas }),
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
        } catch (error) {
          toasts.error.actionFailed('generate recommendations');
          logger.error(
            'Quiz submission failed',
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
    } catch (error) {
      toasts.error.invalidInput();
      logger.error(
        'Quiz validation failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  if (!quizConfig) {
    return (
      <div className="flex items-center justify-center p-12">
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
    <div className="space-y-6">
      <QuizProgress
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        percentComplete={progressPercentage}
      />

      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <span className="text-muted-foreground text-sm">
              Question {currentQuestion} of {totalQuestions}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentQuestionData.id === 'review' ? (
            <QuestionCard
              question={currentQuestionData.question}
              {...(currentQuestionData.description && {
                description: currentQuestionData.description,
              })}
            >
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <div>
                    <span className="font-medium">Use Case:</span>{' '}
                    <span className="text-muted-foreground">
                      {answers.useCase?.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Experience:</span>{' '}
                    <span className="text-muted-foreground">{answers.experienceLevel}</span>
                  </div>
                  <div>
                    <span className="font-medium">Tool Preferences:</span>{' '}
                    <span className="text-muted-foreground">
                      {answers.toolPreferences?.join(', ')}
                    </span>
                  </div>
                  {answers.p_integrations && answers.p_integrations.length > 0 && (
                    <div>
                      <span className="font-medium">Integrations:</span>{' '}
                      <span className="text-muted-foreground">
                        {answers.p_integrations.join(', ')}
                      </span>
                    </div>
                  )}
                  {answers.p_focus_areas && answers.p_focus_areas.length > 0 && (
                    <div>
                      <span className="font-medium">Focus Areas:</span>{' '}
                      <span className="text-muted-foreground">
                        {answers.p_focus_areas.join(', ')}
                      </span>
                    </div>
                  )}
                  {answers.teamSize && (
                    <div>
                      <span className="font-medium">Team Size:</span>{' '}
                      <span className="text-muted-foreground">{answers.teamSize}</span>
                    </div>
                  )}
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className={`${UI_CLASSES.ICON_MD} text-primary`} />
                      What happens next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground text-sm">
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
                className={`grid gap-3 ${currentQuestionData.options.length > 3 ? 'sm:grid-cols-2' : ''}`}
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
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : canSelect
                            ? 'border-border hover:border-primary/50'
                            : 'cursor-not-allowed border-border opacity-50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="mt-1 text-muted-foreground text-sm">{option.description}</div>
                    </button>
                  );
                })}
              </div>
              {fieldKey && errors[fieldKey] && (
                <p className="mt-2 text-destructive text-sm">{errors[fieldKey]}</p>
              )}
            </QuestionCard>
          )}

          <Separator className="my-6" />
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestion === 1 || isPending}
            >
              <ArrowLeft className={UI_CLASSES.ICON_SM_LEADING} />
              Previous
            </Button>

            {currentQuestion < totalQuestions ? (
              <Button type="button" onClick={goToNext} disabled={isPending}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={DIMENSIONS.MIN_W_INPUT}
              >
                {isPending ? (
                  <InlineSpinner size="sm" message="Generating..." />
                ) : (
                  <>
                    <Sparkles className={UI_CLASSES.ICON_SM_LEADING} />
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
