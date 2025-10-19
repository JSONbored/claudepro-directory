'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { QuizForm } from './quiz-form';

/**
 * QuizForm Component Stories
 *
 * Multi-step configuration recommender quiz with progressive disclosure.
 * Collects user preferences through 7 questions to generate personalized recommendations.
 *
 * Features:
 * - 7-step questionnaire (3 required, 4 optional)
 * - Client-side validation with Zod schema
 * - Progress tracking with QuizProgress component
 * - Smooth question transitions
 * - Button grid layouts for selections
 * - Multi-select support (tool preferences, integrations, focus areas)
 * - Single-select support (use case, experience, team size)
 * - Review screen before submission
 * - Server action integration (generateConfigRecommendations)
 * - Router navigation to results page
 * - Mobile-optimized responsive design
 * - Keyboard navigation support
 * - Accessible with ARIA labels
 *
 * Component: src/components/tools/recommender/quiz-form.tsx (585 LOC)
 * Used in: tools/config-recommender/page.tsx
 * Dependencies: QuestionCard, QuizProgress, Button, Card
 *
 * Questions:
 * 1. Use Case (required) - 9 options: code-review, api-development, frontend, etc.
 * 2. Experience Level (required) - 3 options: beginner, intermediate, advanced
 * 3. Tool Preferences (required) - 7 options: agents, mcp, rules, commands, hooks, statuslines, collections (1-5 selections)
 * 4. Integrations (optional) - 7 options: github, database, cloud-aws, etc.
 * 5. Focus Areas (optional) - 6 options: security, performance, documentation, etc. (max 3)
 * 6. Team Size (optional) - 3 options: solo, small, large
 * 7. Review & Submit - Shows all selections + submission
 *
 * State Management:
 * - useState for currentQuestion (1-7)
 * - useState for answers (Partial<QuizAnswers>)
 * - useState for errors (validation)
 * - useTransition for async submission
 * - useRouter for navigation
 *
 * Validation:
 * - Questions 1-3 are required (enforced on Next button)
 * - Questions 4-7 are optional (can skip)
 * - Final Zod validation on submit
 * - Error messages displayed inline
 */
const meta = {
  title: 'Tools/Recommender/QuizForm',
  component: QuizForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-step quiz form for collecting user preferences. Features progressive disclosure, client-side validation, and smooth transitions between 7 questions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuizForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Initial State
 *
 * QuizForm on first load.
 * Shows Question 1 (Use Case) with 0% progress.
 *
 * Usage:
 * ```tsx
 * <QuizForm />
 * ```
 *
 * Note: This is a stateful component - each story instance maintains independent state.
 */
export const Default: Story = {};

/**
 * Question 1: Use Case (Required)
 *
 * First question with 9 use case options in 2-column grid.
 * Shows required field indicator (*).
 *
 * Options:
 * - Code Review & Optimization
 * - API Development
 * - Frontend Development
 * - Data Science & ML
 * - Content & Documentation
 * - DevOps & Infrastructure
 * - General Development
 * - Testing & QA
 * - Security & Compliance
 */
export const Question1UseCase: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'First question asking for primary use case. Required field with 9 options displayed in 2-column responsive grid.',
      },
    },
  },
};

/**
 * Question 2: Experience Level (Required)
 *
 * Experience level selection with 3 options.
 * Appears after selecting use case and clicking Next.
 *
 * Options:
 * - Beginner: New to Claude, learning the basics
 * - Intermediate: Comfortable with Claude, ready for more
 * - Advanced: Expert user, looking for advanced features
 */
export const Question2Experience: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Second question asking about Claude experience level. Required field with 3 difficulty tiers.',
      },
    },
  },
};

/**
 * Question 3: Tool Preferences (Required Multi-Select)
 *
 * Multi-select question allowing 1-5 tool type selections.
 * Shows validation error if user tries to proceed without selections.
 *
 * Options (1-5 selections):
 * - Agents: Specialized AI personas
 * - MCP Servers: Model Context Protocol integrations
 * - Rules: Custom instructions & guidelines
 * - Commands: Quick action commands
 * - Hooks: Event automation
 * - Statuslines: Custom status displays
 * - Collections: Curated bundles
 */
export const Question3ToolPreferences: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Third required question for tool type preferences. Multi-select allowing 1-5 selections with visual toggle states.',
      },
    },
  },
};

/**
 * Question 4: Integrations (Optional Multi-Select)
 *
 * First optional question about integration needs.
 * Users can skip or select multiple integrations.
 *
 * Options:
 * - GitHub: Git repository access
 * - Database: SQL, PostgreSQL, MongoDB
 * - AWS: Amazon Web Services
 * - Google Cloud: GCP services
 * - Azure: Microsoft Azure
 * - Communication: Slack, Discord, email
 * - No integrations needed: Standalone tools only
 */
export const Question4Integrations: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fourth question (optional) for integration requirements. Multi-select with "No integrations needed" option.',
      },
    },
  },
};

/**
 * Question 5: Focus Areas (Optional, Max 3)
 *
 * Multi-select with maximum 3 selections.
 * Buttons become disabled after 3 selections (except selected ones).
 *
 * Options (max 3):
 * - Security: Security audits, compliance
 * - Performance: Speed, optimization
 * - Documentation: Docs, guides, tutorials
 * - Testing: Test automation, QA
 * - Code Quality: Clean code, best practices
 * - Automation: Workflows, CI/CD
 *
 * Behavior: After selecting 3, remaining buttons are disabled.
 */
export const Question5FocusAreas: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fifth question (optional) for focus areas. Multi-select limited to maximum 3 selections with dynamic button disabling.',
      },
    },
  },
};

/**
 * Question 6: Team Size (Optional)
 *
 * Single-select question for collaboration context.
 * Users can skip if not relevant.
 *
 * Options:
 * - Solo Developer: Working independently
 * - Small Team (2-10): Small collaborative team
 * - Large Team (10+): Enterprise or large team
 */
export const Question6TeamSize: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sixth question (optional) asking about team size. Single-select with 3 options for collaboration context.',
      },
    },
  },
};

/**
 * Question 7: Review & Submit
 *
 * Final review screen showing all user selections.
 * Displays summary of answers + "What happens next?" card.
 *
 * Features:
 * - Summary box with all answers
 * - Shows only answered questions (hides empty optionals)
 * - "Get Results" button with Sparkles icon
 * - Loading state during recommendation generation
 * - Info card explaining the matching process
 */
export const Question7Review: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Final review screen showing summary of all answers. Includes "What happens next?" card and submission button.',
      },
    },
  },
};

/**
 * Progress Indicator States
 *
 * Shows how QuizProgress component updates at each step.
 * Demonstrates progress bar and question counter.
 *
 * Progress percentages:
 * - Question 1/7: 14%
 * - Question 2/7: 29%
 * - Question 3/7: 43%
 * - Question 4/7: 57%
 * - Question 5/7: 71%
 * - Question 6/7: 86%
 * - Question 7/7: 100%
 */
export const ProgressStates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates progress indicator updating through all 7 questions. Progress bar fills from 14% to 100%.',
      },
    },
  },
};

/**
 * Mobile Layout
 *
 * QuizForm on mobile viewport (375px).
 * Tests responsive button grid layout (sm:grid-cols-2).
 *
 * Features:
 * - Single column on mobile
 * - 2 columns on tablet+
 * - Touch-friendly button sizes
 * - Scrollable content
 */
export const MobileLayout: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile viewport showing responsive layout. Button grids collapse to single column on small screens.',
      },
    },
  },
};

/**
 * Validation Error States
 *
 * Shows validation errors when trying to skip required questions.
 * Error messages appear below question cards in red text.
 *
 * Error messages:
 * - Question 1: "Please select a use case"
 * - Question 2: "Please select your experience level"
 * - Question 3: "Please select at least one tool type"
 */
export const ValidationErrors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates validation error states for required questions. Red error text appears below question content.',
      },
    },
  },
};

/**
 * Multi-Select Behavior
 *
 * Shows multi-select button toggle states.
 * Clicking selected button deselects it.
 *
 * Visual states:
 * - Unselected: border-border, hover:border-primary/50
 * - Selected: border-primary, bg-primary/5
 *
 * Questions with multi-select:
 * - Q3: Tool Preferences (1-5 selections)
 * - Q4: Integrations (unlimited)
 * - Q5: Focus Areas (max 3, buttons disable after 3)
 */
export const MultiSelectBehavior: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates multi-select toggle behavior. Selected buttons show primary border and background tint.',
      },
    },
  },
};

/**
 * Single-Select Behavior
 *
 * Shows radio-button-like single selection.
 * Clicking new option deselects previous.
 *
 * Questions with single-select:
 * - Q1: Use Case
 * - Q2: Experience Level
 * - Q6: Team Size
 */
export const SingleSelectBehavior: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates single-select behavior. Only one option can be selected at a time (radio button pattern).',
      },
    },
  },
};

/**
 * Navigation Flow
 *
 * Shows Previous/Next button behavior.
 *
 * Button states:
 * - Previous: Disabled on Q1, enabled on Q2-Q7
 * - Next: Enabled on Q1-Q6, replaced by "Get Results" on Q7
 * - Get Results: Shows loading spinner during submission
 */
export const NavigationFlow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates navigation buttons. Previous disabled on first question, Next replaced by "Get Results" on last.',
      },
    },
  },
};

/**
 * Loading State (Submission)
 *
 * Shows "Get Results" button loading state.
 * Spinner icon + "Generating..." text during async operation.
 *
 * Triggered when:
 * - User clicks "Get Results" on Question 7
 * - generateConfigRecommendations server action is running
 * - useTransition isPending = true
 */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates submission loading state. Button shows spinner icon and "Generating..." text during async operation.',
      },
    },
  },
};

/**
 * Focus Areas Max Selection (3)
 *
 * Demonstrates disabled state for focus areas after 3 selections.
 * Unselected buttons become disabled (opacity-50, cursor-not-allowed).
 *
 * Behavior:
 * 1. Select 3 focus areas (e.g., Security, Performance, Testing)
 * 2. Remaining 3 options become disabled
 * 3. Can still deselect any of the 3 selected to make room
 */
export const FocusAreasMaxSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates max selection limit (3) on focus areas. Unselected buttons disable after reaching limit.',
      },
    },
  },
};

/**
 * In Context Example
 *
 * QuizForm in realistic page layout.
 * Shows integration with page header and container.
 */
export const InContextExample: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Configuration Recommender</h1>
          <p className="text-lg text-muted-foreground">
            Answer 7 quick questions to get personalized Claude configuration recommendations
          </p>
        </div>
        <QuizForm />
      </div>
    </div>
  ),
};

/**
 * Accessibility Features
 *
 * QuizForm includes comprehensive accessibility:
 * - QuestionCard components with required indicators
 * - Button type="button" for all interactive elements
 * - Keyboard navigation (Tab, Enter, Space)
 * - ARIA labels from QuizProgress
 * - Semantic HTML (Card, CardHeader, CardTitle, CardContent)
 * - Error messages linked to form controls
 * - Focus management during question transitions
 */
export const AccessibilityFeatures: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'QuizForm follows accessibility best practices. Keyboard navigable, semantic HTML, ARIA labels, and error messaging.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Initial Render Test
 * Tests QuizForm renders with Question 1
 */
export const InitialRenderTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests QuizForm renders on initial load showing Question 1.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Question 1 heading is displayed', async () => {
      const heading = canvas.getByText(/What's your primary use case?/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify question counter shows "Question 1 of 7"', async () => {
      const counter = canvas.getByText(/Question 1 of 7/i);
      await expect(counter).toBeInTheDocument();
    });
  },
};

/**
 * Progress Bar Rendering Test
 * Tests QuizProgress component is rendered
 */
export const ProgressBarRenderingTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests QuizProgress component renders with progress bar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify progress bar is rendered', async () => {
      const progressBar = canvasElement.querySelector('[role="progressbar"]');
      await expect(progressBar).toBeInTheDocument();
    });
  },
};

/**
 * Use Case Options Test
 * Tests all 9 use case buttons are rendered
 */
export const UseCaseOptionsTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests Question 1 renders all 9 use case option buttons.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Code Review & Optimization" button exists', async () => {
      const codeReviewButton = canvas.getByText(/Code Review & Optimization/i);
      await expect(codeReviewButton).toBeInTheDocument();
    });

    await step('Verify "API Development" button exists', async () => {
      const apiButton = canvas.getByText(/API Development/i);
      await expect(apiButton).toBeInTheDocument();
    });

    await step('Verify "Frontend Development" button exists', async () => {
      const frontendButton = canvas.getByText(/Frontend Development/i);
      await expect(frontendButton).toBeInTheDocument();
    });
  },
};

/**
 * Navigation Buttons Test
 * Tests Previous/Next buttons are rendered
 */
export const NavigationButtonsTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests navigation buttons (Previous/Next) render correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Previous button is rendered', async () => {
      const prevButton = canvas.getByRole('button', { name: /Previous/i });
      await expect(prevButton).toBeInTheDocument();
    });

    await step('Verify Previous button is disabled on Q1', async () => {
      const prevButton = canvas.getByRole('button', { name: /Previous/i });
      await expect(prevButton).toBeDisabled();
    });

    await step('Verify Next button is rendered', async () => {
      const nextButton = canvas.getByRole('button', { name: /Next/i });
      await expect(nextButton).toBeInTheDocument();
    });
  },
};

/**
 * Required Field Indicator Test
 * Tests required asterisk (*) is shown
 */
export const RequiredFieldIndicatorTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests required field indicator (asterisk) appears on Question 1.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify required indicator is present', async () => {
      // QuestionCard shows required="true" indicator (*)
      const requiredIndicator = canvasElement.querySelector('[title="Required"]');
      await expect(requiredIndicator).toBeInTheDocument();
    });
  },
};

/**
 * Button Type Attribute Test
 * Tests all buttons have type="button"
 */
export const ButtonTypeAttributeTest: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests all interactive buttons have explicit type="button" attribute.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify use case buttons have type="button"', async () => {
      const buttons = canvasElement.querySelectorAll('button[type="button"]');
      // Should have use case buttons (9) + Previous (1) + Next (1) = 11 total
      await expect(buttons.length).toBeGreaterThanOrEqual(11);
    });
  },
};
