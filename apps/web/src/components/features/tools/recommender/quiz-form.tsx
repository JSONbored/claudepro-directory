'use client';

/**
 * Quiz Form - Database-First Architecture
 * All questions/options fetched from PostgreSQL.
 */

import { getQuizConfigurationAction } from '@heyclaude/web-runtime/actions/quiz';
import { generateConfigRecommendations } from '@heyclaude/web-runtime/pulse-client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { ArrowLeft, ArrowRight, Sparkles } from '@heyclaude/web-runtime/icons';
import {
  logClientError,
  logClientInfo,
  normalizeError,
} from '@heyclaude/web-runtime/logging/client';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  toasts,
  InlineSpinner,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { z } from 'zod';

import { QuestionCard } from './question-card';
import { QuizProgress } from './quiz-progress';

import {
  experience_level as ExperienceLevel,
  focus_area_type as FocusAreaType,
  integration_type as IntegrationType,
  use_case_type as UseCaseType,
} from '@prisma/client';
import type {
  experience_level,
  focus_area_type,
  integration_type,
  use_case_type,
} from '@prisma/client';
import type { GetQuizConfigurationReturns } from '@heyclaude/data-layer';

// Use enum values directly from Prisma enum objects
const EXPERIENCE_LEVEL_VALUES = Object.values(ExperienceLevel) as readonly experience_level[];
const FOCUS_AREA_TYPE_VALUES = Object.values(FocusAreaType) as readonly focus_area_type[];
const INTEGRATION_TYPE_VALUES = Object.values(IntegrationType) as readonly integration_type[];
const USE_CASE_TYPE_VALUES = Object.values(UseCaseType) as readonly use_case_type[];
type QuizConfigurationResult = GetQuizConfigurationReturns;

interface QuizQuestion {
  description: null | string;
  displayOrder: number;
  id: string;
  options: Array<{
    description: null | string;
    iconName: null | string;
    label: string;
    value: string;
  }>;
  question: string;
  required: boolean;
}

// GetQuizConfigurationReturns is QuizConfigurationQuestion (single object with options array)
// The function returns a single question object, but we need to convert it to array format
// for the component. If the database actually returns an array, the generator needs to be fixed.
function mapQuizConfigToQuestions(config: null | QuizConfigurationResult): null | QuizQuestion[] {
  if (!config) {
    return null;
  }

  // Handle as single object (generated type says it's QuizConfigurationQuestion, not array)
  // If database actually returns array, generator needs fixing
  const questions = Array.isArray(config) ? config : [config];

  if (questions.length === 0) {
    return null;
  }

  return questions.map((q) => ({
    id: q.id ?? '',
    question: q.question ?? '',
    description: q.description,
    required: q.required ?? false,
    displayOrder: q.display_order ?? 0,
    options: (q.options ?? []).map((opt: NonNullable<typeof q.options>[number]) => ({
      value: opt.value ?? '',
      label: opt.label ?? '',
      description: opt.description,
      iconName: opt.icon_name,
    })),
  }));
}

// Manual Zod schema (database validates via RPC function)
const quizAnswersSchema = z.object({
  useCase: z.enum([...USE_CASE_TYPE_VALUES] as [use_case_type, ...use_case_type[]]),
  experienceLevel: z.enum([...EXPERIENCE_LEVEL_VALUES] as [
    experience_level,
    ...experience_level[],
  ]),
  toolPreferences: z.array(z.string()).min(1).max(5),
  p_integrations: z
    .array(z.enum([...INTEGRATION_TYPE_VALUES] as [integration_type, ...integration_type[]]))
    .optional(),
  p_focus_areas: z
    .array(z.enum([...FOCUS_AREA_TYPE_VALUES] as [focus_area_type, ...focus_area_type[]]))
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
  const runLoggedAsync = useLoggedAsync({
    scope: 'QuizForm',
    defaultMessage: 'Quiz operation failed',
    defaultRethrow: false,
  });
  const [quizConfig, setQuizConfig] = useState<null | QuizQuestion[]>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    toolPreferences: [],
    p_integrations: [],
    p_focus_areas: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadConfig = useCallback(async () => {
    try {
      const result = await getQuizConfigurationAction({});
      if (result?.data) {
        // result.data is QuizConfigurationQuestion (single object) or null
        const mapped = mapQuizConfigToQuestions(result.data);
        setQuizConfig(mapped);
      }
      if (result?.serverError) {
        // Error already logged by safe-action middleware
        const normalized = normalizeError(result.serverError, 'Failed to load quiz configuration');
        logClientError(
          '[Quiz] Failed to load quiz configuration',
          normalized,
          'QuizForm.loadConfig',
          {
            component: 'QuizForm',
            action: 'load-config',
            category: 'quiz',
          }
        );
        // Show error toast with "Retry" button
        toasts.raw.error('Failed to load quiz', {
          action: {
            label: 'Retry',
            onClick: () => {
              loadConfig();
            },
          },
        });
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load quiz configuration');
      logClientError(
        '[Quiz] Failed to load quiz configuration',
        normalized,
        'QuizForm.loadConfig',
        {
          component: 'QuizForm',
          action: 'load-config',
          category: 'quiz',
        }
      );
      // Show error toast with "Retry" button
      toasts.raw.error('Failed to load quiz', {
        action: {
          label: 'Retry',
          onClick: () => {
            loadConfig();
          },
        },
      });
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
    if (validateCurrentQuestion() && quizConfig && currentQuestion < quizConfig.length) {
      setCurrentQuestion((prev) => prev + 1);
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

                logClientInfo('Quiz completed', 'QuizForm.handleSubmit', {
                  component: 'QuizForm',
                  action: 'submit',
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
        } catch {
          // Error already logged by useLoggedAsync
          // Show error toast with "Retry" button
          toasts.raw.error('Failed to generate recommendations', {
            action: {
              label: 'Retry',
              onClick: () => {
                handleSubmit();
              },
            },
          });
        }
      });
    } catch (error) {
      toasts.error.invalidInput();
      const normalized = normalizeError(error, 'Quiz validation failed');
      logClientError('[Quiz] Validation failed', normalized, 'QuizForm.validate', {
        component: 'QuizForm',
        action: 'validate',
        category: 'quiz',
      });
    }
  };

  if (!quizConfig) {
    return (
      <div className="flex-center p-12">
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
          <CardTitle className="flex items-center gap-2">
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
                <div className="bg-muted space-y-2 rounded-lg p-4">
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
                  {answers.p_integrations && answers.p_integrations.length > 0 ? (
                    <div>
                      <span className="font-medium">Integrations:</span>{' '}
                      <span className="text-muted-foreground">
                        {answers.p_integrations.join(', ')}
                      </span>
                    </div>
                  ) : null}
                  {answers.p_focus_areas && answers.p_focus_areas.length > 0 ? (
                    <div>
                      <span className="font-medium">Focus Areas:</span>{' '}
                      <span className="text-muted-foreground">
                        {answers.p_focus_areas.join(', ')}
                      </span>
                    </div>
                  ) : null}
                  {answers.teamSize ? (
                    <div>
                      <span className="font-medium">Team Size:</span>{' '}
                      <span className="text-muted-foreground">{answers.teamSize}</span>
                    </div>
                  ) : null}
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="text-primary h-5 w-5" />
                      What happens next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-muted-foreground space-y-2 text-sm">
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
                          updateAnswer(fieldKey, option.value);
                        }
                      }}
                      disabled={!canSelect}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : canSelect
                            ? 'border-border hover:border-primary/50'
                            : 'border-border cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground mt-1 text-sm">{option.description}</div>
                    </button>
                  );
                })}
              </div>
              {fieldKey && errors[fieldKey] ? (
                <p className="text-destructive mt-2 text-sm">{errors[fieldKey]}</p>
              ) : null}
            </QuestionCard>
          )}

          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestion === 1 || isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
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
                className="min-w-[200px]"
              >
                {isPending ? (
                  <InlineSpinner size="sm" message="Generating..." />
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
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
