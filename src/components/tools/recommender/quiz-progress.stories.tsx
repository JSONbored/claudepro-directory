'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { QuizProgress } from './quiz-progress';

/**
 * QuizProgress Component Stories
 *
 * Progress indicator for quiz/questionnaire flow.
 * Shows current question, progress bar, and step indicators.
 *
 * Features:
 * - Question counter badge (current/total)
 * - Animated progress bar with percentage
 * - Step indicators with completion states
 * - Completion checkmark when 100%
 * - Accessible with ARIA progressbar
 * - CheckCircle icons for completed steps
 * - Smooth transitions (duration-300)
 *
 * Component: src/components/tools/recommender/quiz-progress.tsx (75 LOC)
 * Used in: quiz-form.tsx for config recommender
 *
 * States:
 * - In Progress: Shows current step highlighted
 * - Completed: Shows checkmarks and "Complete!" message
 * - Each step: completed (checkmark), current (border), upcoming (muted)
 */
const meta = {
  title: 'Tools/Recommender/QuizProgress',
  component: QuizProgress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Progress indicator for quiz flow. Displays question counter, animated progress bar, and step indicators with completion states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentQuestion: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Current question number (1-indexed)',
    },
    totalQuestions: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Total number of questions',
    },
    percentComplete: {
      control: { type: 'number', min: 0, max: 100, step: 5 },
      description: 'Progress percentage (0-100)',
    },
  },
} satisfies Meta<typeof QuizProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Question 1 of 5
 *
 * Starting state of a 5-question quiz.
 * First step highlighted, 20% progress.
 *
 * Usage:
 * ```tsx
 * <QuizProgress
 *   currentQuestion={1}
 *   totalQuestions={5}
 *   percentComplete={20}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    currentQuestion: 1,
    totalQuestions: 5,
    percentComplete: 20,
  },
};

/**
 * Question 3 of 5 (Middle Progress)
 *
 * Mid-quiz state showing:
 * - Steps 1-2: Completed with checkmarks
 * - Step 3: Current (highlighted border)
 * - Steps 4-5: Upcoming (muted)
 * - 60% progress bar
 */
export const MiddleProgress: Story = {
  args: {
    currentQuestion: 3,
    totalQuestions: 5,
    percentComplete: 60,
  },
};

/**
 * Question 5 of 5 (Nearly Complete)
 *
 * Last question state:
 * - Steps 1-4: Completed
 * - Step 5: Current
 * - 100% progress bar
 * - "Complete!" checkmark shown
 */
export const NearlyComplete: Story = {
  args: {
    currentQuestion: 5,
    totalQuestions: 5,
    percentComplete: 100,
  },
};

/**
 * Completed (100%)
 *
 * Quiz completed state.
 * All steps show checkmarks.
 * "Complete!" message with CheckCircle icon.
 */
export const Completed: Story = {
  args: {
    currentQuestion: 5,
    totalQuestions: 5,
    percentComplete: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Completion state shows "Complete!" message with icon when percentComplete === 100.',
      },
    },
  },
};

/**
 * Short Quiz (3 Questions)
 *
 * Smaller quiz with only 3 steps.
 * Shows step indicators adapt to count.
 */
export const ShortQuiz: Story = {
  args: {
    currentQuestion: 2,
    totalQuestions: 3,
    percentComplete: 67,
  },
};

/**
 * Long Quiz (8 Questions)
 *
 * Longer quiz showing more step indicators.
 * Tests layout with many steps.
 */
export const LongQuiz: Story = {
  args: {
    currentQuestion: 4,
    totalQuestions: 8,
    percentComplete: 50,
  },
};

/**
 * First Question (0% → 12.5%)
 *
 * Starting a quiz.
 * No completed steps, just current step highlighted.
 */
export const FirstQuestion: Story = {
  args: {
    currentQuestion: 1,
    totalQuestions: 8,
    percentComplete: 12.5,
  },
};

/**
 * Last Question (87.5% → 100%)
 *
 * Final question of 8-question quiz.
 * Shows progression to completion.
 */
export const LastQuestion: Story = {
  args: {
    currentQuestion: 8,
    totalQuestions: 8,
    percentComplete: 100,
  },
};

/**
 * Two Question Quiz
 *
 * Minimal quiz with only 2 questions.
 * Each step is 50% progress.
 */
export const TwoQuestionQuiz: Story = {
  args: {
    currentQuestion: 1,
    totalQuestions: 2,
    percentComplete: 50,
  },
};

/**
 * Ten Question Quiz
 *
 * Maximum complexity quiz.
 * Tests layout with 10 step indicators.
 */
export const TenQuestionQuiz: Story = {
  args: {
    currentQuestion: 6,
    totalQuestions: 10,
    percentComplete: 60,
  },
  parameters: {
    docs: {
      description: {
        story: '10-question quiz showing how step indicators adapt to larger counts.',
      },
    },
  },
};

/**
 * Animation Showcase
 *
 * Shows progress states in sequence.
 * Demonstrates smooth progress bar animation.
 */
export const AnimationShowcase: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-4">Start (20%)</p>
        <QuizProgress currentQuestion={1} totalQuestions={5} percentComplete={20} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Progress (40%)</p>
        <QuizProgress currentQuestion={2} totalQuestions={5} percentComplete={40} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Halfway (60%)</p>
        <QuizProgress currentQuestion={3} totalQuestions={5} percentComplete={60} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Almost done (80%)</p>
        <QuizProgress currentQuestion={4} totalQuestions={5} percentComplete={80} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-4">Complete (100%)</p>
        <QuizProgress currentQuestion={5} totalQuestions={5} percentComplete={100} />
      </div>
    </div>
  ),
  args: {},
};

/**
 * In Context Example
 *
 * QuizProgress in realistic quiz layout.
 * Shows integration with question card.
 */
export const InContextExample: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-6 space-y-6 border rounded-xl bg-card">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configuration Recommender</h2>
        <p className="text-muted-foreground">
          Answer a few questions to get personalized recommendations
        </p>
      </div>

      <QuizProgress currentQuestion={2} totalQuestions={5} percentComplete={40} />

      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            What's your experience level?
            <span className="text-destructive text-sm" title="Required">
              *
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            This helps us recommend the right tools for you
          </p>
        </div>
        <div className="grid gap-3">
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Beginner (0-1 years)
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Intermediate (1-3 years)
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Advanced (3+ years)
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" className="px-6 py-2 border rounded-lg hover:bg-accent">
          Back
        </button>
        <button
          type="button"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  ),
  args: {},
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Progress Bar Rendering Test
 * Tests progress bar element is rendered
 */
export const ProgressBarRenderingTest: Story = {
  args: {
    currentQuestion: 3,
    totalQuestions: 5,
    percentComplete: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests QuizProgress renders progress bar with correct ARIA attributes.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify progress bar is rendered', async () => {
      const progressBar = canvas.getByRole('progressbar');
      await expect(progressBar).toBeInTheDocument();
    });

    await step('Verify progress bar ARIA attributes', async () => {
      const progressBar = canvas.getByRole('progressbar');
      await expect(progressBar.getAttribute('aria-valuenow')).toBe('60');
      await expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      await expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    });
  },
};

/**
 * Question Counter Test
 * Tests current/total question display
 */
export const QuestionCounterTest: Story = {
  args: {
    currentQuestion: 2,
    totalQuestions: 5,
    percentComplete: 40,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests question counter badge shows current and total questions.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify question counter is displayed', async () => {
      const counter = canvas.getByText(/2 \/ 5/);
      await expect(counter).toBeInTheDocument();
    });

    await step('Verify Progress label is shown', async () => {
      const label = canvas.getByText(/^progress$/i);
      await expect(label).toBeInTheDocument();
    });
  },
};

/**
 * Completion Message Test
 * Tests "Complete!" message shows at 100%
 */
export const CompletionMessageTest: Story = {
  args: {
    currentQuestion: 5,
    totalQuestions: 5,
    percentComplete: 100,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests "Complete!" message with CheckCircle icon appears when percentComplete is 100.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify completion message is displayed', async () => {
      const completeText = canvas.getByText(/complete!/i);
      await expect(completeText).toBeInTheDocument();
    });
  },
};

/**
 * Step Indicators Test
 * Tests step indicator circles are rendered
 */
export const StepIndicatorsTest: Story = {
  args: {
    currentQuestion: 3,
    totalQuestions: 5,
    percentComplete: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests step indicator circles render for each question with proper states.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify 5 step indicators are rendered', async () => {
      const stepIndicators = canvasElement.querySelectorAll('[title^="Question"]');
      await expect(stepIndicators.length).toBe(5);
    });

    await step('Verify step titles are descriptive', async () => {
      const step1 = canvasElement.querySelector('[title="Question 1 (completed)"]');
      const step3 = canvasElement.querySelector('[title="Question 3 (current)"]');
      const step5 = canvasElement.querySelector('[title="Question 5"]');

      await expect(step1).toBeInTheDocument();
      await expect(step3).toBeInTheDocument();
      await expect(step5).toBeInTheDocument();
    });
  },
};
