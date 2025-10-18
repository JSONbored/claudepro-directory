import type { Meta, StoryObj } from '@storybook/react';
import { Checklist } from './checklist';

/**
 * Checklist Component Stories
 *
 * Interactive task list component for prerequisites, security checks, and testing steps.
 * Used across MDX content to provide structured, trackable task lists.
 *
 * Features:
 * - 3 types: prerequisites (BookOpen), security (AlertTriangle), testing (CheckCircle)
 * - 4 priority levels: critical (red), high (red), medium (yellow), low (green)
 * - Interactive checkbox state with progress bar
 * - Schema.org structured data for SEO
 * - Pre-completed items support
 * - Responsive design with hover effects
 *
 * Component: src/components/content/checklist.tsx (134 LOC)
 * Usage: 3 MDX files across codebase
 */
const meta = {
  title: 'Content/Checklist',
  component: Checklist,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive checklist component with progress tracking, priority levels, and type indicators.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Prerequisites Type (Default)
 *
 * Default checklist type for setup tasks and dependencies.
 * Uses BookOpen icon and neutral styling.
 *
 * Usage in MDX:
 * ```mdx
 * <Checklist
 *   type="prerequisites"
 *   title="Setup Requirements"
 *   description="Complete these before starting"
 *   items={[
 *     { task: "Install dependencies", description: "Run npm install" },
 *     { task: "Configure environment", description: "Set up .env file" }
 *   ]}
 * />
 * ```
 */
export const Prerequisites: Story = {
  args: {
    type: 'prerequisites',
    title: 'Setup Requirements',
    description: 'Complete these tasks before starting development',
    items: [
      {
        task: 'Install Node.js 18+',
        description: 'Download from nodejs.org or use nvm',
      },
      {
        task: 'Install dependencies',
        description: 'Run npm install in project root',
      },
      {
        task: 'Configure environment variables',
        description: 'Copy .env.example to .env and fill in values',
      },
      {
        task: 'Set up database',
        description: 'Run migrations and seed data',
      },
    ],
  },
};

/**
 * Security Type
 *
 * Security checklist with AlertTriangle icon for security-critical tasks.
 * Ideal for pre-deployment security audits and compliance checks.
 *
 * Usage in MDX:
 * ```mdx
 * <Checklist
 *   type="security"
 *   title="Security Audit"
 *   items={[
 *     { task: "Audit dependencies", priority: "critical" },
 *     { task: "Review CORS config", priority: "high" }
 *   ]}
 * />
 * ```
 */
export const Security: Story = {
  args: {
    type: 'security',
    title: 'Pre-Deployment Security Checklist',
    description: 'Critical security checks before production release',
    items: [
      {
        task: 'Audit npm dependencies for vulnerabilities',
        description: 'Run npm audit and resolve critical/high severity issues',
        priority: 'critical',
      },
      {
        task: 'Enable HTTPS and HSTS',
        description: 'Ensure all traffic is encrypted',
        priority: 'critical',
      },
      {
        task: 'Review CORS configuration',
        description: 'Verify allowed origins match production domains',
        priority: 'high',
      },
      {
        task: 'Validate input sanitization',
        description: 'Check all user inputs are properly validated',
        priority: 'high',
      },
      {
        task: 'Review authentication flow',
        description: 'Test login, logout, password reset',
        priority: 'medium',
      },
      {
        task: 'Check rate limiting',
        description: 'Ensure API endpoints have rate limits',
        priority: 'medium',
      },
    ],
  },
};

/**
 * Testing Type
 *
 * Testing checklist with CheckCircle icon for QA tasks.
 * Perfect for test coverage checklists and QA workflows.
 *
 * Usage in MDX:
 * ```mdx
 * <Checklist
 *   type="testing"
 *   title="Test Coverage"
 *   items={[
 *     { task: "Unit tests", description: "Cover core logic" },
 *     { task: "E2E tests", description: "Critical user flows" }
 *   ]}
 * />
 * ```
 */
export const Testing: Story = {
  args: {
    type: 'testing',
    title: 'Testing Checklist',
    description: 'Ensure comprehensive test coverage before release',
    items: [
      {
        task: 'Unit tests for business logic',
        description: 'Cover all critical functions and utilities',
      },
      {
        task: 'Component tests',
        description: 'Test UI components in isolation',
      },
      {
        task: 'Integration tests',
        description: 'Test API endpoints and database queries',
      },
      {
        task: 'E2E tests for critical flows',
        description: 'Login, signup, checkout, etc.',
      },
      {
        task: 'Accessibility testing',
        description: 'Run axe-core and manual keyboard navigation',
      },
    ],
  },
};

/**
 * All Priority Levels
 *
 * Demonstrates all 4 priority levels with color coding:
 * - Critical: Red badge with background (most urgent)
 * - High: Red text (important)
 * - Medium: Yellow text (moderate)
 * - Low: Green text (nice to have)
 *
 * Priority levels help teams focus on the most important tasks first.
 */
export const PriorityLevels: Story = {
  args: {
    type: 'prerequisites',
    title: 'Task Priority Demonstration',
    description: 'Shows all four priority levels with color-coded indicators',
    items: [
      {
        task: 'Critical Priority Task',
        description: 'Red badge with background - most urgent, blocks release',
        priority: 'critical',
      },
      {
        task: 'High Priority Task',
        description: 'Red text - important but not blocking',
        priority: 'high',
      },
      {
        task: 'Medium Priority Task',
        description: 'Yellow text - should be done soon',
        priority: 'medium',
      },
      {
        task: 'Low Priority Task',
        description: 'Green text - nice to have, not urgent',
        priority: 'low',
      },
      {
        task: 'Task without priority',
        description: 'No priority indicator - standard task',
      },
    ],
  },
};

/**
 * Interactive State Demo
 *
 * Demonstrates interactive checkbox toggling and progress bar updates.
 * Click checkboxes to see:
 * - Progress percentage updates in badge
 * - Progress bar width animation
 * - Task text strikethrough when completed
 * - Checkbox fill animation
 *
 * Perfect for testing interactive behavior in Storybook.
 */
export const InteractiveState: Story = {
  args: {
    type: 'testing',
    title: 'Interactive Progress Tracking',
    description: 'Click checkboxes to see progress bar update in real-time',
    items: [
      {
        task: 'Task 1: Not started',
        description: 'Click the checkbox to mark as complete',
      },
      {
        task: 'Task 2: Not started',
        description: 'Progress bar updates automatically',
      },
      {
        task: 'Task 3: Not started',
        description: 'Completed tasks show strikethrough',
      },
      {
        task: 'Task 4: Not started',
        description: 'Progress percentage updates in header badge',
      },
    ],
  },
};

/**
 * Pre-Completed Items
 *
 * Shows checklist with some tasks already completed on initial render.
 * Useful for showing progress in multi-step guides or tracking completed work.
 *
 * Initial state: 50% complete (2 out of 4 tasks done)
 *
 * Usage in MDX:
 * ```mdx
 * <Checklist
 *   items={[
 *     { task: "Setup repo", completed: true },
 *     { task: "Install deps", completed: true },
 *     { task: "Configure env", completed: false },
 *     { task: "Run tests", completed: false }
 *   ]}
 * />
 * ```
 */
export const PreCompletedItems: Story = {
  args: {
    type: 'prerequisites',
    title: 'Migration Progress',
    description: 'Some tasks already completed, others in progress',
    items: [
      {
        task: 'Clone repository',
        description: 'Repository cloned to local machine',
        completed: true,
      },
      {
        task: 'Install dependencies',
        description: 'All npm packages installed',
        completed: true,
      },
      {
        task: 'Configure database',
        description: 'Set up PostgreSQL connection',
        completed: false,
      },
      {
        task: 'Run migrations',
        description: 'Apply database schema changes',
        completed: false,
      },
      {
        task: 'Seed test data',
        description: 'Populate database with sample data',
        completed: false,
      },
    ],
  },
};

/**
 * Long Descriptions and Edge Cases
 *
 * Tests component behavior with:
 * - Very long task names
 * - Very long descriptions
 * - Multiple paragraphs of content
 * - Special characters and formatting
 * - Mixed priority levels
 *
 * Validates component handles edge cases gracefully without breaking layout.
 */
export const EdgeCases: Story = {
  args: {
    type: 'security',
    title: 'Edge Case Testing: Long Content and Special Characters',
    description:
      'This checklist demonstrates how the component handles extremely long text, special characters, and various formatting scenarios. It ensures the layout remains stable and readable even with unusual content.',
    items: [
      {
        task: 'Very long task name that might wrap to multiple lines: Configure OAuth 2.0 authentication with PKCE flow for enhanced security in single-page applications',
        description:
          'This is an extremely long description that tests how the component handles text wrapping and layout stability. It includes multiple sentences to simulate real-world documentation scenarios where detailed explanations are necessary for complex technical tasks.',
        priority: 'critical',
      },
      {
        task: 'Task with special characters: <script>, "quotes", & ampersands',
        description: 'Tests HTML entity handling and XSS prevention: <>&"\'',
      },
      {
        task: 'Short task',
        description:
          'Another very long description to test vertical spacing and readability when multiple items have extensive documentation. This helps ensure the component maintains good UX even with verbose content.',
        priority: 'high',
      },
      {
        task: 'Task without description',
        priority: 'medium',
      },
      {
        task: 'Minimum viable task',
      },
      {
        task: 'Task with emoji support 🚀 ✅ 🔐',
        description: 'Emojis and Unicode characters: ⚡ 💡 🎯 → ← ✓ ✗',
        priority: 'low',
      },
    ],
  },
};

/**
 * Minimal Example
 *
 * Simplest possible checklist with just required props.
 * Shows default behavior when optional props are omitted.
 *
 * - No title: Uses auto-generated "Prerequisites Checklist"
 * - No description
 * - No priorities
 * - No pre-completed items
 *
 * Perfect starting point for new checklist implementations.
 */
export const Minimal: Story = {
  args: {
    type: 'prerequisites',
    items: [{ task: 'Task 1' }, { task: 'Task 2' }, { task: 'Task 3' }],
  },
};

/**
 * Single Item
 *
 * Edge case: Checklist with only one item.
 * Tests:
 * - Progress bar shows 0% or 100% (no intermediate states)
 * - Layout doesn't break with single item
 * - Spacing and padding remain consistent
 */
export const SingleItem: Story = {
  args: {
    type: 'testing',
    title: 'Quick Check',
    description: 'Single critical validation',
    items: [
      {
        task: 'Verify production build succeeds',
        description: 'Run npm run build and ensure no errors',
        priority: 'critical',
      },
    ],
  },
};

/**
 * All Items Completed
 *
 * Checklist with 100% completion on initial render.
 * Shows completed state styling:
 * - Progress badge shows "100% Complete"
 * - Progress bar fully filled
 * - All tasks have strikethrough
 * - All checkboxes checked
 *
 * Useful for showing "already done" sections in documentation.
 */
export const AllCompleted: Story = {
  args: {
    type: 'prerequisites',
    title: 'Setup Complete',
    description: 'All prerequisite tasks have been completed',
    items: [
      { task: 'Install Node.js', completed: true },
      { task: 'Install dependencies', completed: true },
      { task: 'Configure environment', completed: true },
      { task: 'Run initial build', completed: true },
    ],
  },
};
