'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { QuestionCard } from './question-card';

/**
 * QuestionCard Component Stories
 *
 * Form layout wrapper for quiz questions in the recommender tool.
 * Displays question text with optional description and required indicator.
 *
 * Features:
 * - Question heading with required asterisk
 * - Optional description text
 * - Children slot for form controls (buttons, inputs, etc.)
 * - Clean spacing with space-y-4
 * - Accessible with proper heading structure
 *
 * Component: src/components/tools/recommender/question-card.tsx (74 LOC)
 * Architecture: Standalone form wrapper (NOT consolidated with BaseCard)
 * Usage: Quiz form questions in config recommender tool
 *
 * Design Decisions:
 * - Simple, focused component with single responsibility
 * - Accepts arbitrary children (form controls)
 * - Different purpose than content display cards
 */
const meta = {
  title: 'Tools/Recommender/QuestionCard',
  component: QuestionCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Form layout wrapper for quiz questions. Displays question text, optional description, and required indicator with children slot for form controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    question: {
      control: 'text',
      description: 'Question text',
    },
    description: {
      control: 'text',
      description: 'Optional description or help text',
    },
    required: {
      control: 'boolean',
      description: 'Show required asterisk (*)',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    children: {
      control: false,
      description: 'Form controls (buttons, inputs, etc.)',
    },
  },
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Multiple Choice Question
 *
 * Standard question with button options.
 * Shows typical use case in quiz form.
 *
 * Usage:
 * ```tsx
 * <QuestionCard question="What's your primary use case?">
 *   <div className="grid gap-3">
 *     <button>Option 1</button>
 *     <button>Option 2</button>
 *   </div>
 * </QuestionCard>
 * ```
 */
export const Default: Story = {
  args: {
    question: "What's your primary use case?",
    children: (
      <div className="grid gap-3">
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Web Development
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Mobile Development
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Data Science
        </button>
      </div>
    ),
  },
};

/**
 * Required Question
 *
 * Question with required asterisk indicator.
 * Shows validation requirement to users.
 *
 * Usage:
 * ```tsx
 * <QuestionCard question="Select your framework" required>
 *   {content}
 * </QuestionCard>
 * ```
 */
export const RequiredQuestion: Story = {
  args: {
    question: 'Select your framework',
    required: true,
    children: (
      <div className="grid gap-3">
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          React
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Vue
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Angular
        </button>
      </div>
    ),
  },
};

/**
 * With Description
 *
 * Question with helpful description text.
 * Provides context and guidance to users.
 *
 * Usage:
 * ```tsx
 * <QuestionCard
 *   question="Choose your experience level"
 *   description="This helps us recommend the right tools for you"
 * >
 *   {content}
 * </QuestionCard>
 * ```
 */
export const WithDescription: Story = {
  args: {
    question: 'Choose your experience level',
    description: 'This helps us recommend the right tools and configurations for you',
    children: (
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
    ),
  },
};

/**
 * Required with Description
 *
 * Combines required indicator and description.
 * Full question card with all features.
 */
export const RequiredWithDescription: Story = {
  args: {
    question: 'What type of project are you building?',
    description: 'Select the option that best matches your project type',
    required: true,
    children: (
      <div className="grid gap-3">
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Personal Project
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Startup/Small Business
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Enterprise Application
        </button>
      </div>
    ),
  },
};

/**
 * Two Column Layout
 *
 * Options arranged in 2-column grid.
 * Shows responsive layout capabilities.
 */
export const TwoColumnLayout: Story = {
  args: {
    question: 'Select your preferred tools',
    description: 'You can choose multiple options',
    children: (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          TypeScript
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          JavaScript
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Tailwind CSS
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          CSS Modules
        </button>
      </div>
    ),
  },
};

/**
 * With Radio Inputs
 *
 * Question using native radio inputs instead of buttons.
 * Shows flexibility of children slot.
 */
export const WithRadioInputs: Story = {
  args: {
    question: 'How often will you deploy?',
    required: true,
    children: (
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="radio" name="deploy-frequency" value="daily" className="w-4 h-4" />
          <span>Daily - Continuous deployment</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="radio" name="deploy-frequency" value="weekly" className="w-4 h-4" />
          <span>Weekly - Regular releases</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="radio" name="deploy-frequency" value="monthly" className="w-4 h-4" />
          <span>Monthly - Stable releases</span>
        </label>
      </div>
    ),
  },
};

/**
 * With Checkboxes
 *
 * Multi-select question using checkboxes.
 * Allows multiple answers.
 */
export const WithCheckboxes: Story = {
  args: {
    question: 'Which features do you need?',
    description: 'Select all that apply',
    children: (
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span>Authentication</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span>Database Integration</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span>File Upload</span>
        </label>
        <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
          <input type="checkbox" className="w-4 h-4" />
          <span>Real-time Updates</span>
        </label>
      </div>
    ),
  },
};

/**
 * Text Input Question
 *
 * Free-form text input question.
 * Shows flexibility with different input types.
 */
export const TextInputQuestion: Story = {
  args: {
    question: 'What is your project name?',
    description: 'This will help us personalize your recommendations',
    required: true,
    children: (
      <input
        type="text"
        placeholder="Enter project name..."
        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    ),
  },
};

/**
 * Textarea Question
 *
 * Long-form text input question.
 * For detailed descriptions or comments.
 */
export const TextareaQuestion: Story = {
  args: {
    question: 'Tell us more about your project',
    description: 'Optional: Provide additional details that might help our recommendations',
    children: (
      <textarea
        placeholder="Describe your project goals, challenges, or specific requirements..."
        rows={5}
        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    ),
  },
};

/**
 * Long Question Text
 *
 * Tests component with very long question.
 * Verifies text wrapping and layout stability.
 */
export const LongQuestionText: Story = {
  args: {
    question:
      'Based on your previous answers about development experience and project requirements, which of these advanced configuration options would you like to enable for optimal performance and developer experience?',
    description:
      'This is a more detailed description that provides additional context and guidance for answering this complex question. It may span multiple lines to fully explain the implications of each choice.',
    required: true,
    children: (
      <div className="grid gap-3">
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Option A - Recommended for most users
        </button>
        <button
          type="button"
          className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
        >
          Option B - Advanced configuration
        </button>
      </div>
    ),
  },
};

/**
 * Minimal Question
 *
 * Simplest possible configuration.
 * Just question and children, no optional props.
 */
export const MinimalQuestion: Story = {
  args: {
    question: 'Continue?',
    children: (
      <div className="flex gap-3">
        <button
          type="button"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Yes
        </button>
        <button type="button" className="px-6 py-2 border rounded-lg hover:bg-accent">
          No
        </button>
      </div>
    ),
  },
};

/**
 * Multiple Questions (Stacked)
 *
 * Shows multiple QuestionCards in sequence.
 * Typical quiz flow layout.
 */
export const MultipleQuestions: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <QuestionCard question="What's your primary goal?" required>
        <div className="grid gap-3">
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Build a new product
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Improve existing system
          </button>
        </div>
      </QuestionCard>

      <QuestionCard
        question="What's your timeline?"
        description="This helps us recommend appropriate tools"
      >
        <div className="grid gap-3">
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Less than 1 month
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            1-3 months
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            3+ months
          </button>
        </div>
      </QuestionCard>

      <QuestionCard question="Team size?" required>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            Solo
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            2-5
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            6-10
          </button>
          <button
            type="button"
            className="px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            10+
          </button>
        </div>
      </QuestionCard>
    </div>
  ),
  args: {},
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Question Text Rendering Test
 * Tests question heading is displayed
 */
export const QuestionTextRenderingTest: Story = {
  args: {
    question: 'Test Question Text',
    children: <div>Content</div>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests QuestionCard displays question text in heading.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify question heading is displayed', async () => {
      const heading = canvas.getByRole('heading', { name: /test question text/i });
      await expect(heading).toBeInTheDocument();
    });
  },
};

/**
 * Required Indicator Test
 * Tests required asterisk is shown when required=true
 */
export const RequiredIndicatorTest: Story = {
  args: {
    question: 'Required Question',
    required: true,
    children: <div>Content</div>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests required asterisk (*) appears when required prop is true.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify required asterisk is displayed', async () => {
      const asterisk = canvas.getByTitle('Required');
      await expect(asterisk).toBeInTheDocument();
      await expect(asterisk.textContent).toBe('*');
    });
  },
};

/**
 * Description Text Test
 * Tests description appears when provided
 */
export const DescriptionTextTest: Story = {
  args: {
    question: 'Question',
    description: 'This is the description text',
    children: <div>Content</div>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests description text displays when description prop is provided.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify description text is displayed', async () => {
      const description = canvas.getByText(/this is the description text/i);
      await expect(description).toBeInTheDocument();
    });
  },
};

/**
 * Children Rendering Test
 * Tests children content is rendered in card
 */
export const ChildrenRenderingTest: Story = {
  args: {
    question: 'Question',
    children: <div data-testid="test-children">Test Children Content</div>,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests children prop content is rendered inside card.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify children content is rendered', async () => {
      const children = canvas.getByTestId('test-children');
      await expect(children).toBeInTheDocument();
      await expect(children.textContent).toBe('Test Children Content');
    });
  },
};
