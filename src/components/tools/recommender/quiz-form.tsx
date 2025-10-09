'use client';

/**
 * Configuration Recommender Quiz Form
 *
 * Multi-step form that collects user preferences to generate
 * personalized configuration recommendations.
 *
 * Features:
 * - 7 questions with progressive disclosure
 * - Client-side validation with Zod
 * - Progress tracking
 * - Smooth transitions
 * - Mobile-optimized
 * - Keyboard navigation
 * - Accessible (ARIA labels, screen reader support)
 */

import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { generateConfigRecommendations } from '@/src/lib/actions/recommender-actions';
import { logger } from '@/src/lib/logger';
import {
  type ExperienceLevel,
  encodeQuizAnswers,
  type FocusArea,
  type IntegrationNeed,
  type QuizAnswers,
  quizAnswersSchema,
  type TeamSize,
  type ToolPreference,
  type UseCase,
} from '@/src/lib/schemas/recommender.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { QuestionCard } from './question-card';
import { QuizProgress } from './quiz-progress';

const TOTAL_QUESTIONS = 7;

export function QuizForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({
    toolPreferences: [],
    integrations: [],
    focusAreas: [],
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Answer handlers for each question type
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

  // Validate current question
  const validateCurrentQuestion = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentQuestion) {
      case 1:
        if (!answers.useCase) {
          newErrors.useCase = 'Please select a use case';
        }
        break;
      case 2:
        if (!answers.experienceLevel) {
          newErrors.experienceLevel = 'Please select your experience level';
        }
        break;
      case 3:
        if (!answers.toolPreferences || answers.toolPreferences.length === 0) {
          newErrors.toolPreferences = 'Please select at least one tool type';
        }
        break;
      // Questions 4-7 are optional
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const goToNext = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestion < TOTAL_QUESTIONS) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate all required fields
    if (!(answers.useCase && answers.experienceLevel && answers.toolPreferences?.length)) {
      toast.error('Please answer all required questions');
      setCurrentQuestion(1); // Go back to first unanswered question
      return;
    }

    try {
      // Final validation with Zod
      const validatedAnswers = quizAnswersSchema.parse({
        ...answers,
        timestamp: new Date().toISOString(),
      });

      // Generate recommendations via server action
      startTransition(async () => {
        try {
          const result = await generateConfigRecommendations(validatedAnswers);

          if (result?.data?.success && result.data.recommendations) {
            // Encode answers for URL
            const encoded = encodeQuizAnswers(validatedAnswers);

            // Navigate to results page
            router.push(
              `/tools/config-recommender/results/${result.data.recommendations.id}?answers=${encoded}`
            );

            // Track analytics
            logger.info('Quiz completed', {
              useCase: validatedAnswers.useCase,
              experienceLevel: validatedAnswers.experienceLevel,
              resultId: result.data.recommendations.id,
            });
          } else {
            throw new Error('Failed to generate recommendations');
          }
        } catch (error) {
          toast.error('Failed to generate recommendations. Please try again.');
          logger.error(
            'Quiz submission failed',
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
    } catch (error) {
      toast.error('Please check your answers and try again');
      logger.error(
        'Quiz validation failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const progressPercentage = Math.round((currentQuestion / TOTAL_QUESTIONS) * 100);

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      {/* Progress indicator */}
      <QuizProgress
        currentQuestion={currentQuestion}
        totalQuestions={TOTAL_QUESTIONS}
        percentComplete={progressPercentage}
      />

      {/* Question cards */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion} of {TOTAL_QUESTIONS}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question 1: Use Case */}
          {currentQuestion === 1 && (
            <QuestionCard
              question="What's your primary use case?"
              description="Select what you'll mainly use Claude for"
              required
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'code-review',
                    label: 'Code Review & Optimization',
                    desc: 'Review code quality, suggest improvements',
                  },
                  {
                    value: 'api-development',
                    label: 'API Development',
                    desc: 'Build REST/GraphQL APIs',
                  },
                  {
                    value: 'frontend-development',
                    label: 'Frontend Development',
                    desc: 'React, Vue, UI components',
                  },
                  {
                    value: 'data-science',
                    label: 'Data Science & ML',
                    desc: 'Analysis, machine learning, Python',
                  },
                  {
                    value: 'content-creation',
                    label: 'Content & Documentation',
                    desc: 'Writing docs, blog posts',
                  },
                  {
                    value: 'devops-infrastructure',
                    label: 'DevOps & Infrastructure',
                    desc: 'Deployment, Docker, CI/CD',
                  },
                  {
                    value: 'general-development',
                    label: 'General Development',
                    desc: 'Full-stack development',
                  },
                  {
                    value: 'testing-qa',
                    label: 'Testing & QA',
                    desc: 'Test automation, quality assurance',
                  },
                  {
                    value: 'security-audit',
                    label: 'Security & Compliance',
                    desc: 'Security audits, vulnerabilities',
                  },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateAnswer('useCase', value as UseCase)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      answers.useCase === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                  </button>
                ))}
              </div>
              {errors.useCase && <p className="text-sm text-destructive mt-2">{errors.useCase}</p>}
            </QuestionCard>
          )}

          {/* Question 2: Experience Level */}
          {currentQuestion === 2 && (
            <QuestionCard
              question="What's your experience level with Claude?"
              description="This helps us recommend appropriate complexity"
              required
            >
              <div className="grid gap-3">
                {[
                  {
                    value: 'beginner',
                    label: 'Beginner',
                    desc: 'New to Claude, learning the basics',
                  },
                  {
                    value: 'intermediate',
                    label: 'Intermediate',
                    desc: 'Comfortable with Claude, ready for more',
                  },
                  {
                    value: 'advanced',
                    label: 'Advanced',
                    desc: 'Expert user, looking for advanced features',
                  },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateAnswer('experienceLevel', value as ExperienceLevel)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      answers.experienceLevel === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                  </button>
                ))}
              </div>
              {errors.experienceLevel && (
                <p className="text-sm text-destructive mt-2">{errors.experienceLevel}</p>
              )}
            </QuestionCard>
          )}

          {/* Question 3: Tool Preferences */}
          {currentQuestion === 3 && (
            <QuestionCard
              question="Which tool types interest you?"
              description="Select all that apply (1-5 selections)"
              required
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'agents', label: 'Agents', desc: 'Specialized AI personas' },
                  {
                    value: 'mcp',
                    label: 'MCP Servers',
                    desc: 'Model Context Protocol integrations',
                  },
                  { value: 'rules', label: 'Rules', desc: 'Custom instructions & guidelines' },
                  { value: 'commands', label: 'Commands', desc: 'Quick action commands' },
                  { value: 'hooks', label: 'Hooks', desc: 'Event automation' },
                  { value: 'statuslines', label: 'Statuslines', desc: 'Custom status displays' },
                  { value: 'collections', label: 'Collections', desc: 'Curated bundles' },
                ].map(({ value, label, desc }) => {
                  const isSelected = answers.toolPreferences?.includes(value as ToolPreference);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleArrayAnswer('toolPreferences', value)}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                    </button>
                  );
                })}
              </div>
              {errors.toolPreferences && (
                <p className="text-sm text-destructive mt-2">{errors.toolPreferences}</p>
              )}
            </QuestionCard>
          )}

          {/* Question 4: Integrations (Optional) */}
          {currentQuestion === 4 && (
            <QuestionCard
              question="Do you need specific integrations?"
              description="Optional: Select any required integrations"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'github', label: 'GitHub', desc: 'Git repository access' },
                  { value: 'database', label: 'Database', desc: 'SQL, PostgreSQL, MongoDB' },
                  { value: 'cloud-aws', label: 'AWS', desc: 'Amazon Web Services' },
                  { value: 'cloud-gcp', label: 'Google Cloud', desc: 'GCP services' },
                  { value: 'cloud-azure', label: 'Azure', desc: 'Microsoft Azure' },
                  { value: 'communication', label: 'Communication', desc: 'Slack, Discord, email' },
                  { value: 'none', label: 'No integrations needed', desc: 'Standalone tools only' },
                ].map(({ value, label, desc }) => {
                  const isSelected = answers.integrations?.includes(value as IntegrationNeed);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleArrayAnswer('integrations', value)}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </QuestionCard>
          )}

          {/* Question 5: Focus Areas (Optional) */}
          {currentQuestion === 5 && (
            <QuestionCard
              question="What are your focus areas?"
              description="Optional: Select up to 3 areas"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'security', label: 'Security', desc: 'Security audits, compliance' },
                  { value: 'performance', label: 'Performance', desc: 'Speed, optimization' },
                  {
                    value: 'documentation',
                    label: 'Documentation',
                    desc: 'Docs, guides, tutorials',
                  },
                  { value: 'testing', label: 'Testing', desc: 'Test automation, QA' },
                  {
                    value: 'code-quality',
                    label: 'Code Quality',
                    desc: 'Clean code, best practices',
                  },
                  { value: 'automation', label: 'Automation', desc: 'Workflows, CI/CD' },
                ].map(({ value, label, desc }) => {
                  const isSelected = answers.focusAreas?.includes(value as FocusArea);
                  const canSelect = !isSelected && (answers.focusAreas?.length || 0) < 3;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleArrayAnswer('focusAreas', value)}
                      disabled={!(isSelected || canSelect)}
                      className={`p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : canSelect
                            ? 'border-border hover:border-primary/50'
                            : 'border-border opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </QuestionCard>
          )}

          {/* Question 6: Team Size (Optional) */}
          {currentQuestion === 6 && (
            <QuestionCard
              question="What's your team size?"
              description="Optional: Helps us recommend collaboration features"
            >
              <div className="grid gap-3">
                {[
                  { value: 'solo', label: 'Solo Developer', desc: 'Working independently' },
                  { value: 'small', label: 'Small Team (2-10)', desc: 'Small collaborative team' },
                  { value: 'large', label: 'Large Team (10+)', desc: 'Enterprise or large team' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateAnswer('teamSize', value as TeamSize)}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      answers.teamSize === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </QuestionCard>
          )}

          {/* Question 7: Review & Submit */}
          {currentQuestion === 7 && (
            <QuestionCard
              question="Review your selections"
              description="Ready to get your personalized recommendations?"
            >
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
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
                  {answers.integrations && answers.integrations.length > 0 && (
                    <div>
                      <span className="font-medium">Integrations:</span>{' '}
                      <span className="text-muted-foreground">
                        {answers.integrations.join(', ')}
                      </span>
                    </div>
                  )}
                  {answers.focusAreas && answers.focusAreas.length > 0 && (
                    <div>
                      <span className="font-medium">Focus Areas:</span>{' '}
                      <span className="text-muted-foreground">{answers.focusAreas.join(', ')}</span>
                    </div>
                  )}
                  {answers.teamSize && (
                    <div>
                      <span className="font-medium">Team Size:</span>{' '}
                      <span className="text-muted-foreground">{answers.teamSize}</span>
                    </div>
                  )}
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      What happens next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• We'll analyze 147+ configurations</li>
                      <li>• Match them to your specific needs</li>
                      <li>• Show you the top 8-10 best fits</li>
                      <li>• Explain why each was recommended</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </QuestionCard>
          )}

          {/* Navigation buttons */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestion === 1 || isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestion < TOTAL_QUESTIONS ? (
              <Button type="button" onClick={goToNext} disabled={isPending}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="min-w-[140px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
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
