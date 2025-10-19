'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { DiagnosticFlow } from './diagnostic-flow';

/**
 * DiagnosticFlow Component Stories
 *
 * Interactive troubleshooting flowchart with Yes/No decision tree navigation.
 * Guides users through diagnostic questions to solutions.
 *
 * Features:
 * - Yes/No button navigation through decision tree
 * - Diagnostic path tracking (shows user's answer history)
 * - Solution display with CheckCircle icon
 * - "Start Over" reset button
 * - Schema.org HowTo structured data
 * - Zod validation for steps array
 * - Fallback for missing/empty steps
 * - Muted card styling for questions/solutions
 *
 * Component: src/components/tools/troubleshooting/diagnostic-flow.tsx (119 LOC)
 * Used in: 1 MDX file for troubleshooting workflows
 * Dependencies: Card, Button, CheckCircle icon
 *
 * Data Structure:
 * - Steps array with question/yesPath/noPath/solution
 * - yesPath/noPath: question text to jump to (NOT index)
 * - solution: Terminal step text (ends flow)
 * - Path tracking: Shows "Question - YES/NO" history
 *
 * Navigation Flow:
 * 1. User sees first question
 * 2. Clicks Yes or No
 * 3. Path is recorded
 * 4. Next question loads based on yesPath/noPath match
 * 5. Repeat until solution step
 * 6. Show solution with "Start Over" button
 */
const meta = {
  title: 'Tools/Troubleshooting/DiagnosticFlow',
  component: DiagnosticFlow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive troubleshooting flowchart. Guides users through Yes/No questions to diagnostic solutions with path tracking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Diagnostic flow section title',
      table: {
        defaultValue: { summary: 'Diagnostic Flow' },
      },
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    steps: {
      control: 'object',
      description: 'Array of diagnostic steps with questions and paths',
    },
  },
} satisfies Meta<typeof DiagnosticFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Simple 3-Step Flow
 *
 * Basic troubleshooting flow with 3 steps:
 * 1. Is it plugged in? → Yes → Step 2, No → Solution A
 * 2. Is it powered on? → Yes → Solution B, No → Solution C
 *
 * Demonstrates:
 * - Branching logic
 * - Path tracking
 * - Solution states
 *
 * Usage:
 * ```tsx
 * <DiagnosticFlow
 *   title="Connection Troubleshooting"
 *   steps={[
 *     {
 *       question: "Is it plugged in?",
 *       yesPath: "Is it powered on?",
 *       noPath: undefined,
 *       solution: "Please plug in the device and try again."
 *     },
 *     {
 *       question: "Is it powered on?",
 *       solution: "Device is properly connected!"
 *     }
 *   ]}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    title: 'Connection Troubleshooting',
    description: 'Follow these steps to diagnose your connection issue',
    steps: [
      {
        question: 'Is the device plugged in?',
        yesPath: 'Is the power light on?',
        solution: 'Please plug in the device and try again.',
      },
      {
        question: 'Is the power light on?',
        yesPath: undefined,
        noPath: undefined,
        solution: 'Device is properly connected and powered!',
      },
    ],
  },
};

/**
 * Complex Flow: API Error Debugging
 *
 * Realistic troubleshooting flow with 5 steps.
 * Shows complex branching paths.
 *
 * Flow:
 * 1. Getting 404 error? → Yes → Check endpoint, No → Getting 500 error?
 * 2. Check endpoint → Solution A
 * 3. Getting 500 error? → Yes → Check logs, No → Timeout?
 * 4. Check logs → Solution B
 * 5. Timeout? → Solution C
 */
export const ComplexFlow: Story = {
  args: {
    title: 'API Error Diagnostic',
    description: 'Diagnose and resolve API connection errors',
    steps: [
      {
        question: 'Are you getting a 404 error?',
        yesPath: 'Have you verified the endpoint URL?',
        noPath: 'Are you getting a 500 error?',
      },
      {
        question: 'Have you verified the endpoint URL?',
        solution:
          'Double-check your API endpoint URL in the configuration. Common issue: missing /api prefix or incorrect version number.',
      },
      {
        question: 'Are you getting a 500 error?',
        yesPath: 'Have you checked the server logs?',
        noPath: 'Is the request timing out?',
      },
      {
        question: 'Have you checked the server logs?',
        solution:
          'Review server logs for stack traces. Common causes: database connection failures, missing environment variables, or unhandled exceptions.',
      },
      {
        question: 'Is the request timing out?',
        solution:
          'Increase timeout settings or optimize your database queries. Check network latency and server response times.',
      },
    ],
  },
};

/**
 * Short Flow: 2 Steps
 *
 * Minimal diagnostic flow with only 2 steps.
 * Tests edge case of very simple troubleshooting.
 */
export const ShortFlow: Story = {
  args: {
    title: 'Quick Check',
    description: 'Is your configuration correct?',
    steps: [
      {
        question: 'Did you save your changes?',
        yesPath: undefined,
        noPath: undefined,
        solution: 'Configuration is complete!',
      },
    ],
  },
};

/**
 * Authentication Flow
 *
 * Login troubleshooting diagnostic.
 * Shows real-world authentication debugging.
 */
export const AuthenticationFlow: Story = {
  args: {
    title: 'Login Issues',
    description: 'Troubleshoot authentication problems',
    steps: [
      {
        question: 'Are you seeing "Invalid credentials" error?',
        yesPath: 'Have you recently changed your password?',
        noPath: 'Are you being redirected to error page?',
      },
      {
        question: 'Have you recently changed your password?',
        solution:
          'Try resetting your password. Click "Forgot Password" and check your email for reset link.',
      },
      {
        question: 'Are you being redirected to error page?',
        yesPath: 'Is your account verified?',
        noPath: undefined,
        solution:
          'Clear your browser cache and cookies, then try logging in again. If issue persists, contact support.',
      },
      {
        question: 'Is your account verified?',
        solution:
          'Check your email for verification link. Click the link to activate your account before logging in.',
      },
    ],
  },
};

/**
 * Installation Troubleshooting
 *
 * Software installation diagnostic flow.
 * Shows environment setup debugging.
 */
export const InstallationFlow: Story = {
  args: {
    title: 'Installation Problems',
    description: 'Resolve package installation errors',
    steps: [
      {
        question: 'Are you getting permission errors?',
        yesPath: 'Are you using sudo?',
        noPath: 'Are you getting network errors?',
      },
      {
        question: 'Are you using sudo?',
        solution:
          'Avoid using sudo with npm. Fix permissions: sudo chown -R $USER /usr/local/lib/node_modules',
      },
      {
        question: 'Are you getting network errors?',
        yesPath: 'Is your proxy configured?',
        noPath: 'Are dependencies missing?',
      },
      {
        question: 'Is your proxy configured?',
        solution:
          'Configure npm proxy: npm config set proxy http://proxy.company.com:8080 && npm config set https-proxy http://proxy.company.com:8080',
      },
      {
        question: 'Are dependencies missing?',
        solution:
          'Delete node_modules and package-lock.json, then run: npm install --legacy-peer-deps',
      },
    ],
  },
};

/**
 * Performance Debugging
 *
 * Application performance diagnostic flow.
 * Shows optimization troubleshooting.
 */
export const PerformanceFlow: Story = {
  args: {
    title: 'Performance Issues',
    description: 'Diagnose slow application performance',
    steps: [
      {
        question: 'Is the entire app slow?',
        yesPath: 'Have you checked bundle size?',
        noPath: 'Is a specific page slow?',
      },
      {
        question: 'Have you checked bundle size?',
        solution:
          'Run: npm run build && npm run analyze. Look for large dependencies. Consider code splitting and lazy loading.',
      },
      {
        question: 'Is a specific page slow?',
        yesPath: 'Does it load lots of data?',
        noPath: undefined,
        solution:
          'Use React DevTools Profiler to identify slow components. Check for unnecessary re-renders and optimize with React.memo.',
      },
      {
        question: 'Does it load lots of data?',
        solution:
          'Implement pagination or infinite scroll. Add loading states. Consider server-side rendering or static generation.',
      },
    ],
  },
};

/**
 * Empty Steps (Fallback)
 *
 * Tests fallback behavior with no steps provided.
 * Shows "No diagnostic steps available" default message.
 */
export const EmptySteps: Story = {
  args: {
    title: 'Empty Diagnostic',
    description: 'No steps configured',
    steps: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests fallback behavior when steps array is empty. Shows default "No diagnostic steps available" message.',
      },
    },
  },
};

/**
 * No Description
 *
 * Diagnostic flow without description text.
 * Tests optional description field.
 */
export const NoDescription: Story = {
  args: {
    title: 'Quick Diagnostic',
    steps: [
      {
        question: 'Is everything working?',
        solution: 'Great! No issues detected.',
      },
    ],
  },
};

/**
 * Long Questions
 *
 * Tests layout with lengthy question text.
 * Ensures proper text wrapping.
 */
export const LongQuestions: Story = {
  args: {
    title: 'Detailed Troubleshooting',
    description: 'Step-by-step diagnostic with detailed questions',
    steps: [
      {
        question:
          'Are you experiencing intermittent connection failures when attempting to authenticate with the remote server during peak usage hours?',
        yesPath:
          'Have you verified that your network firewall rules allow outbound HTTPS traffic on port 443 to the authentication server domain?',
        noPath:
          'Is the application consistently failing to initialize the authentication module during the bootstrap phase?',
      },
      {
        question:
          'Have you verified that your network firewall rules allow outbound HTTPS traffic on port 443 to the authentication server domain?',
        solution:
          'Contact your network administrator to whitelist the authentication server domain and ensure port 443 is open for outbound traffic.',
      },
      {
        question:
          'Is the application consistently failing to initialize the authentication module during the bootstrap phase?',
        solution:
          'Check application logs for module initialization errors. Verify all authentication dependencies are installed and environment variables are correctly set.',
      },
    ],
  },
};

/**
 * Long Solutions
 *
 * Tests layout with lengthy solution text.
 * Ensures proper solution card formatting.
 */
export const LongSolutions: Story = {
  args: {
    title: 'Detailed Solutions',
    steps: [
      {
        question: 'Need comprehensive setup instructions?',
        solution:
          'Complete setup instructions:\n\n1. Install Node.js 18+ from nodejs.org\n2. Clone the repository: git clone https://github.com/example/repo.git\n3. Navigate to directory: cd repo\n4. Install dependencies: npm install\n5. Copy environment template: cp .env.example .env\n6. Configure environment variables in .env file\n7. Run database migrations: npm run db:migrate\n8. Seed initial data: npm run db:seed\n9. Start development server: npm run dev\n10. Open browser to http://localhost:3000\n\nIf you encounter any errors during installation, check the troubleshooting guide in docs/TROUBLESHOOTING.md.',
      },
    ],
  },
};

/**
 * Multiple Path Branches
 *
 * Flow with many decision points.
 * Tests path tracking with long history.
 */
export const MultipleBranches: Story = {
  args: {
    title: 'Complex Decision Tree',
    description: 'Navigate through multiple decision points',
    steps: [
      {
        question: 'Step 1: Primary check?',
        yesPath: 'Step 2A: First yes path?',
        noPath: 'Step 2B: First no path?',
      },
      {
        question: 'Step 2A: First yes path?',
        yesPath: 'Step 3A: Nested yes?',
        noPath: 'Step 3B: Nested no?',
      },
      {
        question: 'Step 2B: First no path?',
        solution: 'Solution B: Path B completed',
      },
      {
        question: 'Step 3A: Nested yes?',
        solution: 'Solution A1: Deep yes path completed',
      },
      {
        question: 'Step 3B: Nested no?',
        solution: 'Solution A2: Deep no path completed',
      },
    ],
  },
};

/**
 * In Context Example
 *
 * DiagnosticFlow in realistic troubleshooting page.
 * Shows integration with documentation layout.
 */
export const InContextExample: Story = {
  render: (args) => (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Troubleshooting Guide</h1>
        <p className="text-muted-foreground">
          Follow the diagnostic flow below to identify and resolve common issues
        </p>
      </div>
      <DiagnosticFlow {...args} />
      <div className="text-sm text-muted-foreground border-t pt-4">
        <p>
          Still having issues? Contact support at{' '}
          <a href="mailto:support@example.com" className="underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  ),
  args: {
    title: 'API Connection Issues',
    description: 'Diagnose and fix API connectivity problems',
    steps: [
      {
        question: 'Can you reach the API endpoint?',
        yesPath: 'Are you getting authentication errors?',
        noPath: undefined,
        solution:
          'Check your network connection and firewall settings. Verify the API base URL is correct.',
      },
      {
        question: 'Are you getting authentication errors?',
        solution:
          'Verify your API key is correct and has not expired. Check that you are including the Authorization header in your requests.',
      },
    ],
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Initial Render Test
 * Tests DiagnosticFlow renders with first question
 */
export const InitialRenderTest: Story = {
  args: {
    title: 'Test Flow',
    steps: [
      {
        question: 'Is this the first question?',
        solution: 'Test complete',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests DiagnosticFlow renders with title and first question.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify title is displayed', async () => {
      const title = canvas.getByText('Test Flow');
      await expect(title).toBeInTheDocument();
    });

    await step('Verify first question is displayed', async () => {
      const question = canvas.getByText('Is this the first question?');
      await expect(question).toBeInTheDocument();
    });
  },
};

/**
 * Yes/No Buttons Test
 * Tests navigation buttons are present
 */
export const YesNoButtonsTest: Story = {
  args: {
    title: 'Button Test',
    steps: [
      {
        question: 'Test question?',
        yesPath: 'Next step',
        noPath: 'Other step',
      },
      {
        question: 'Next step',
        solution: 'Done',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Yes and No buttons render correctly.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Yes button is present', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await expect(yesButton).toBeInTheDocument();
    });

    await step('Verify No button is present', async () => {
      const noButton = canvas.getByRole('button', { name: /no/i });
      await expect(noButton).toBeInTheDocument();
    });
  },
};

/**
 * Navigation Flow Test
 * Tests clicking Yes navigates to next question
 */
export const NavigationFlowTest: Story = {
  args: {
    title: 'Navigation Test',
    steps: [
      {
        question: 'First question?',
        yesPath: 'Second question?',
        noPath: undefined,
      },
      {
        question: 'Second question?',
        solution: 'Navigation successful!',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests clicking Yes button navigates to next question.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Yes button', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await userEvent.click(yesButton);
    });

    await step('Verify second question appears', async () => {
      const secondQuestion = canvas.getByText('Second question?');
      await expect(secondQuestion).toBeInTheDocument();
    });
  },
};

/**
 * Path Tracking Test
 * Tests diagnostic path history is displayed
 */
export const PathTrackingTest: Story = {
  args: {
    title: 'Path Test',
    steps: [
      {
        question: 'Start here?',
        yesPath: 'Continue?',
      },
      {
        question: 'Continue?',
        solution: 'Complete',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests diagnostic path tracking shows answer history.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Yes to create path entry', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await userEvent.click(yesButton);
    });

    await step('Verify path history is displayed', async () => {
      const pathHeading = canvas.getByText(/Diagnostic Path:/i);
      await expect(pathHeading).toBeInTheDocument();
    });

    await step('Verify path entry contains question and answer', async () => {
      const pathEntry = canvas.getByText(/Start here.*YES/i);
      await expect(pathEntry).toBeInTheDocument();
    });
  },
};

/**
 * Solution Display Test
 * Tests solution state with CheckCircle icon
 */
export const SolutionDisplayTest: Story = {
  args: {
    title: 'Solution Test',
    steps: [
      {
        question: 'Immediate solution?',
        solution: 'This is the solution text',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests solution display with CheckCircle icon and "Start Over" button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Yes to reach solution', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await userEvent.click(yesButton);
    });

    await step('Verify "Solution Found" text appears', async () => {
      const solutionHeading = canvas.getByText(/Solution Found:/i);
      await expect(solutionHeading).toBeInTheDocument();
    });

    await step('Verify solution text is displayed', async () => {
      const solutionText = canvas.getByText(/This is the solution text/i);
      await expect(solutionText).toBeInTheDocument();
    });

    await step('Verify "Start Over" button is present', async () => {
      const resetButton = canvas.getByRole('button', { name: /Start Over/i });
      await expect(resetButton).toBeInTheDocument();
    });
  },
};

/**
 * Reset Functionality Test
 * Tests "Start Over" button resets to first question
 */
export const ResetFunctionalityTest: Story = {
  args: {
    title: 'Reset Test',
    steps: [
      {
        question: 'First question?',
        solution: 'Solution reached',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests "Start Over" button resets flow to first question.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate to solution', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await userEvent.click(yesButton);
    });

    await step('Click Start Over button', async () => {
      const resetButton = canvas.getByRole('button', { name: /Start Over/i });
      await userEvent.click(resetButton);
    });

    await step('Verify first question is displayed again', async () => {
      const firstQuestion = canvas.getByText('First question?');
      await expect(firstQuestion).toBeInTheDocument();
    });

    await step('Verify Yes/No buttons are back', async () => {
      const yesButton = canvas.getByRole('button', { name: /yes/i });
      await expect(yesButton).toBeInTheDocument();
    });
  },
};
