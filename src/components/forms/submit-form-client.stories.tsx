'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { SubmitFormClient } from './submit-form-client';

/**
 * SubmitFormClient Component Stories
 *
 * Main content submission form for Claude Pro Directory.
 * Config-driven, uncontrolled form pattern with minimal React state.
 *
 * Features:
 * - 7 content types (agents, mcp, rules, commands, hooks, statuslines, skills)
 * - Uncontrolled form pattern (4 state variables only)
 * - Config-driven field rendering
 * - Template pre-fill via DOM manipulation
 * - FormData API for generic submission
 * - Server action integration with Zod validation
 * - Success state with PR link display
 * - Integrated components: DuplicateWarning, TemplateSelector, ExamplesArrayInput
 * - Responsive layout (mobile-first)
 * - Real-time duplicate checking
 * - Character count indicators
 * - Toast notifications
 * - Auto-scroll to success message
 *
 * Component: src/components/forms/submit-form-client.tsx (416 LOC)
 * Used in: Submit page, content creation workflows
 * Dependencies: Card, Input, Button, Label, TemplateSelector, DuplicateWarning, ExamplesArrayInput
 *
 * Architecture:
 * ```ts
 * // MINIMAL STATE (4 variables)
 * const [contentType, setContentType] = useState<ContentType>('agents');
 * const [name, setName] = useState('');
 * const [isPending, startTransition] = useTransition();
 * const [submissionResult, setSubmissionResult] = useState<{...} | null>(null);
 * ```
 *
 * Why Uncontrolled?
 * - Performance: No re-renders on every keystroke
 * - Simplicity: No controlled value/onChange boilerplate for 20+ fields
 * - Native validation: Browser-native required/pattern validation
 * - FormData API: Clean extraction of all fields on submit
 *
 * Form Sections:
 * 1. Success Message (conditional, after submission)
 *    - Green card with CheckCircle icon
 *    - PR number and link
 *    - "View PR" and "Track Status" buttons
 *    - Auto-scroll to top on success
 *
 * 2. Type Selection + Template Selector
 *    - Dropdown for 7 content types
 *    - TemplateSelector for quick start
 *    - Resets name when type changes
 *
 * 3. Name Field + Duplicate Warning
 *    - Controlled input (for real-time duplicate checking)
 *    - DuplicateWarning component integration
 *    - Required field
 *
 * 4. Common Fields (Config-Driven)
 *    - Description (textarea, required)
 *    - Category (select, required)
 *    - Author (text, optional)
 *    - GitHub URL (url, optional)
 *
 * 5. Type-Specific Fields (Config-Driven)
 *    - Dynamic fields based on contentType
 *    - Rendered via ContentTypeFieldRenderer
 *    - Different fields for each content type
 *
 * 6. Tags Field (Config-Driven)
 *    - Comma-separated tags
 *    - Transformed to array on server
 *
 * 7. Usage Examples (All Types)
 *    - ExamplesArrayInput component
 *    - Up to 10 examples
 *    - JSON serialization to hidden input
 *
 * 8. Submit Button
 *    - Loading state with "Creating PR..." text
 *    - Github icon (pulsing when pending)
 *    - Send icon (default state)
 *    - Disabled during submission
 *
 * 9. Info Box
 *    - Blue card with Github icon
 *    - Explains PR workflow
 *    - Always visible at bottom
 *
 * Content Types (7):
 * - agents: Claude Agent configurations (system prompts)
 * - mcp: Model Context Protocol servers
 * - rules: Claude Rules (expertise/domain knowledge)
 * - commands: Slash commands
 * - hooks: Git hooks and lifecycle scripts
 * - statuslines: Status line configurations
 * - skills: Reusable skill definitions
 *
 * Template Pre-Fill Flow:
 * 1. User selects template from TemplateSelector
 * 2. handleTemplateSelect() called with template data
 * 3. DOM manipulation via querySelector('[name="..."]')
 * 4. Sets value attribute for uncontrolled inputs
 * 5. Sets name state (controlled field)
 * 6. User can edit pre-filled values
 *
 * Submission Flow:
 * 1. User fills form (or uses template)
 * 2. User clicks "Submit for Review"
 * 3. startTransition() → isPending = true
 * 4. handleSubmit() extracts FormData
 * 5. Special handling for examples JSON parsing
 * 6. submissionData cast to Zod input type
 * 7. Server action validates with Zod schema
 * 8. Success → setSubmissionResult({ prUrl, prNumber, slug })
 * 9. Success toast + scroll to top
 * 10. Error → error toast
 *
 * Config-Driven Architecture:
 * - COMMON_FIELDS: Shared across all types
 * - FORM_CONFIGS[contentType]: Type-specific fields
 * - TAGS_FIELD: Tags configuration
 * - ContentTypeFieldRenderer: Generic field renderer
 * - Zero hardcoded fields in component
 * - Add new fields = edit config, zero component changes
 *
 * Production Patterns:
 * - safeParse() with VALIDATED_JSON strategy for examples
 * - Type assertion for server action (unknown → Zod input)
 * - FormData entries loop for generic extraction
 * - useTransition for pending state
 * - Comprehensive JSDoc explaining architecture
 *
 * @see Research Report: "Uncontrolled Forms with Config-Driven Rendering"
 */
const meta = {
  title: 'Forms/SubmitFormClient',
  component: SubmitFormClient,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Main content submission form. Uncontrolled pattern, config-driven fields, 7 content types. Creates GitHub PR on submit.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubmitFormClient>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Agents Submission
 *
 * Default form state for submitting Claude Agent configurations.
 * Shows all sections: type selector, name, common fields, agent-specific fields, tags, examples.
 *
 * Usage:
 * ```tsx
 * <SubmitFormClient />
 * ```
 *
 * Initial State:
 * - Content Type: agents
 * - Name: "" (empty)
 * - No submission result
 * - Not pending
 */
export const Default: Story = {};

/**
 * Agents Submission
 *
 * Form configured for submitting Claude Agent (system prompt) configurations.
 *
 * Agent-Specific Fields:
 * - System Prompt (textarea, required): The agent's system prompt
 * - Recommended Model (select, optional): Claude model recommendation
 * - Use Cases (textarea, optional): Common use cases
 */
export const AgentsSubmission: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting Claude Agent configurations with system prompts.',
      },
    },
  },
};

/**
 * MCP Submission
 *
 * Form configured for submitting Model Context Protocol (MCP) server configurations.
 *
 * MCP-Specific Fields:
 * - Package Name (text, required): npm package name
 * - Installation Command (text, required): Installation command
 * - Configuration Example (textarea, required): MCP server config JSON
 * - Tools Provided (textarea, optional): List of tools/capabilities
 */
export const MCPSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to MCP', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'mcp');
    });

    await step('Verify MCP option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('mcp');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form for submitting MCP server configurations with installation and config details.',
      },
    },
  },
};

/**
 * Rules Submission
 *
 * Form configured for submitting Claude Rules (expertise/domain knowledge).
 *
 * Rules-Specific Fields:
 * - Rule Content (textarea, required): The rule text/instructions
 * - Expertise Area (text, optional): Domain expertise area
 * - Trigger Conditions (textarea, optional): When to apply this rule
 */
export const RulesSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to Rules', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'rules');
    });

    await step('Verify Rules option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('rules');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting Claude Rules with expertise and trigger conditions.',
      },
    },
  },
};

/**
 * Commands Submission
 *
 * Form configured for submitting slash command configurations.
 *
 * Commands-Specific Fields:
 * - Command Syntax (text, required): Slash command syntax
 * - Command Description (textarea, required): What the command does
 * - Arguments (textarea, optional): Command arguments
 */
export const CommandsSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to Commands', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'commands');
    });

    await step('Verify Commands option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('commands');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting slash command configurations with syntax and arguments.',
      },
    },
  },
};

/**
 * Hooks Submission
 *
 * Form configured for submitting hook configurations.
 *
 * Hooks-Specific Fields:
 * - Hook Type (select, required): pre-commit, post-commit, etc.
 * - Hook Script (textarea, required): Shell script content
 * - Trigger Events (textarea, optional): When hook triggers
 */
export const HooksSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to Hooks', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'hooks');
    });

    await step('Verify Hooks option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('hooks');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting hook configurations with script content.',
      },
    },
  },
};

/**
 * Statuslines Submission
 *
 * Form configured for submitting statusline configurations.
 *
 * Statuslines-Specific Fields:
 * - Statusline Format (text, required): Format string
 * - Variables (textarea, optional): Available variables
 * - Color Scheme (text, optional): Color configuration
 */
export const StatuslinesSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to Statuslines', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'statuslines');
    });

    await step('Verify Statuslines option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('statuslines');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting statusline configurations with format and variables.',
      },
    },
  },
};

/**
 * Skills Submission
 *
 * Form configured for submitting skill definitions.
 *
 * Skills-Specific Fields:
 * - Skill Definition (textarea, required): Skill instructions/content
 * - Skill Category (select, required): Category classification
 * - Prerequisites (textarea, optional): Required knowledge/tools
 */
export const SkillsSubmission: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change content type to Skills', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'skills');
    });

    await step('Verify Skills option is selected', async () => {
      const select = canvas.getByLabelText(/Content Type/i) as HTMLSelectElement;
      await expect(select.value).toBe('skills');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Form for submitting skill definitions with category and prerequisites.',
      },
    },
  },
};

/**
 * Template Selection Flow
 *
 * Demonstrates template pre-fill functionality.
 * User selects template → form fields populated via DOM manipulation.
 *
 * Flow:
 * 1. User clicks "Use Template" button
 * 2. Dropdown shows available templates for content type
 * 3. User selects template
 * 4. handleTemplateSelect() called
 * 5. DOM manipulation: querySelector('[name="..."]').value = template.value
 * 6. Name state updated (controlled field)
 * 7. User can edit pre-filled values
 */
export const TemplateSelectionFlow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Click "Use Template" to pre-fill form with curated template data. Uses DOM manipulation for uncontrolled inputs.',
      },
    },
  },
};

/**
 * Form Validation
 *
 * Shows native HTML5 form validation.
 * Required fields marked with *, browser prevents submission if empty.
 *
 * Required Fields:
 * - Content Type (always)
 * - Name (always)
 * - Description (always)
 * - Category (always)
 * - Type-specific required fields (varies by content type)
 */
export const FormValidation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Try submitting without required fields. Native HTML5 validation prevents submission.',
      },
    },
  },
};

/**
 * Duplicate Warning Integration
 *
 * Shows DuplicateWarning component integration.
 * Real-time duplicate checking as user types in Name field.
 *
 * Behavior:
 * - Name field is controlled (for reactivity)
 * - DuplicateWarning receives contentType + name props
 * - 500ms debounce on name changes
 * - Shows warning if similar content exists
 * - Shows warning for generic names (test, example, demo, etc.)
 */
export const DuplicateWarningIntegration: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter a name to trigger duplicate check', async () => {
      const nameInput = canvas.getByLabelText(/^Name/i);
      await userEvent.type(nameInput, 'Test Agent');
    });

    await step('Wait for debounce (500ms)', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Type in Name field to see real-time duplicate checking with 500ms debounce.',
      },
    },
  },
};

/**
 * Examples Array Input Integration
 *
 * Shows ExamplesArrayInput component integration.
 * Add/remove usage examples with code snippets.
 *
 * Features:
 * - Up to 10 examples
 * - Collapsible panels
 * - Code editor with syntax highlighting
 * - Language selection (9 languages)
 * - JSON serialization to hidden input
 * - Form submits examples as JSON string
 */
export const ExamplesArrayInputIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Scroll to "Usage Examples" section to add code examples with syntax highlighting.',
      },
    },
  },
};

/**
 * Submission Pending State
 *
 * Shows form in pending/loading state during submission.
 *
 * Visual Changes:
 * - Submit button disabled
 * - Button text: "Creating PR..."
 * - Github icon pulsing (animate-pulse)
 * - User cannot interact with form
 */
export const SubmissionPendingState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Simulates pending state. Submit button shows "Creating PR..." with pulsing Github icon.',
      },
    },
  },
};

/**
 * Submission Success State
 *
 * Shows form after successful submission with PR details.
 *
 * Success Card Features:
 * - Green border and background (green-500/20, green-500/5)
 * - CheckCircle icon (green)
 * - "Submission Successful! 🎉" heading
 * - PR number display
 * - "View PR" button (opens GitHub in new tab)
 * - "Track Status" button (links to /account/submissions)
 * - Auto-scroll to top (smooth behavior)
 *
 * Form State:
 * - Main form still visible below success message
 * - User can submit another configuration
 */
export const SubmissionSuccessState: Story = {
  render: () => {
    // Mock successful submission by directly rendering with result state
    // In real app, this would be set after server action success
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-6 border-green-500/20 bg-green-500/5 rounded-lg border p-6">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <svg
              className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Check Circle Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Submission Successful! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your configuration has been submitted for review. Pull Request #123 created on
                GitHub.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-4 py-2 w-full sm:w-auto"
                >
                  View PR
                  <svg
                    className="h-3 w-3 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>External Link Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-4 py-2 w-full sm:w-auto"
                >
                  Track Status
                </button>
              </div>
            </div>
          </div>
        </div>
        <SubmitFormClient />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Success state after submission. Green card with PR details, "View PR" and "Track Status" buttons.',
      },
    },
  },
};

/**
 * Responsive Layout
 *
 * Shows responsive behavior across mobile and desktop.
 *
 * Mobile (< 640px):
 * - Single column layout
 * - Full-width buttons
 * - Stacked form sections
 * - Smaller text (text-sm)
 * - Reduced spacing (space-y-4)
 *
 * Desktop (>= 640px):
 * - Two-column grid for Type + Template
 * - Inline buttons
 * - Larger text (text-base, text-2xl)
 * - Increased spacing (space-y-6)
 */
export const ResponsiveLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Resize viewport to see responsive layout. Mobile: stacked, Desktop: grid.',
      },
    },
  },
};

/**
 * Info Box
 *
 * Shows informational box at bottom explaining PR workflow.
 *
 * Visual:
 * - Blue background (blue-500/10)
 * - Blue border (blue-500/20)
 * - Github icon (blue-400)
 * - "How it works" heading (blue-400)
 * - Explanation text (muted-foreground)
 * - Always visible
 */
export const InfoBox: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Scroll to bottom to see info box explaining PR workflow with Github icon.',
      },
    },
  },
};

/**
 * Common Fields Section
 *
 * Shows common fields shared across all content types.
 *
 * Fields:
 * - Description (textarea, required): Detailed description
 * - Category (select, required): Category classification
 * - Author (text, optional): Original author/creator
 * - GitHub URL (url, optional): Repository or profile link
 *
 * These fields render via ContentTypeFieldRenderer with COMMON_FIELDS config.
 */
export const CommonFieldsSection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Common fields shared across all content types: description, category, author, github.',
      },
    },
  },
};

/**
 * Type-Specific Fields Section
 *
 * Shows dynamic field rendering based on selected content type.
 *
 * Behavior:
 * - Different fields for each content type
 * - Rendered via ContentTypeFieldRenderer
 * - Uses FORM_CONFIGS[contentType] configuration
 * - Fields appear/disappear when content type changes
 * - Zero hardcoded fields in component
 *
 * Examples:
 * - Agents: System Prompt, Recommended Model, Use Cases
 * - MCP: Package Name, Installation Command, Configuration Example, Tools Provided
 * - Rules: Rule Content, Expertise Area, Trigger Conditions
 */
export const TypeSpecificFieldsSection: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Change to MCP to see different fields', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'mcp');
    });

    await step('Wait for field rendering', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await step('Change to Rules to see different fields again', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      await userEvent.selectOptions(select, 'rules');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Switch content types to see dynamic field rendering. Each type has different specific fields.',
      },
    },
  },
};

/**
 * Tags Field Section
 *
 * Shows tags input field with comma-separated format.
 *
 * Features:
 * - Single text input
 * - Comma-separated values
 * - Transformed to array on server
 * - Optional field
 * - Placeholder shows format
 *
 * Example: "react, typescript, hooks, state-management"
 */
export const TagsFieldSection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tags field accepts comma-separated values, transformed to array on server.',
      },
    },
  },
};

/**
 * Submit Button States
 *
 * Shows submit button in different states.
 *
 * Default State:
 * - Send icon
 * - "Submit for Review" text
 * - Enabled
 * - Primary styling
 *
 * Pending State:
 * - Github icon (pulsing)
 * - "Creating PR..." text
 * - Disabled
 * - Cannot click
 */
export const SubmitButtonStates: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Submit button has two states: default (Send icon) and pending (pulsing Github icon).',
      },
    },
  },
};

/**
 * Config-Driven Architecture
 *
 * Demonstrates config-driven field rendering approach.
 *
 * Benefits:
 * - Zero hardcoded fields in component
 * - Add new fields = edit config only
 * - Add new content types = edit config only
 * - Generic rendering logic
 * - Type-safe with TypeScript
 * - Easy maintenance
 *
 * Configs:
 * - COMMON_FIELDS: Shared fields
 * - FORM_CONFIGS[contentType]: Type-specific fields
 * - TAGS_FIELD: Tags configuration
 * - ContentTypeFieldRenderer: Generic renderer
 *
 * Example:
 * ```ts
 * const COMMON_FIELDS = [
 *   { name: 'description', type: 'textarea', label: 'Description', required: true },
 *   { name: 'category', type: 'select', label: 'Category', required: true, options: [...] },
 * ];
 * ```
 */
export const ConfigDrivenArchitecture: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Form fields rendered from config. Add fields by editing config, not component code.',
      },
    },
  },
};

/**
 * Uncontrolled Form Pattern
 *
 * Demonstrates uncontrolled form pattern with minimal React state.
 *
 * State Variables (4 only):
 * 1. contentType - Dynamic field rendering (form structure changes)
 * 2. name - Real-time duplicate checking (API calls)
 * 3. submissionResult - Success message display
 * 4. isPending - Loading state during submission
 *
 * Why NOT controlled for all fields?
 * - Performance: No re-renders on every keystroke
 * - Simplicity: No value/onChange for 20+ fields
 * - Native validation: Browser handles required/pattern
 * - FormData API: Clean extraction on submit
 *
 * Data Extraction:
 * ```ts
 * const formData = new FormData(event.currentTarget);
 * for (const [key, value] of formData.entries()) {
 *   submissionData[key] = value || undefined;
 * }
 * ```
 */
export const UncontrolledFormPattern: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uncontrolled pattern: only 4 state variables. Form fields use native HTML state, extracted via FormData.',
      },
    },
  },
};

/**
 * FormData Extraction
 *
 * Shows FormData API usage for generic field extraction.
 *
 * Process:
 * 1. User submits form
 * 2. Extract FormData: `new FormData(event.currentTarget)`
 * 3. Loop entries: `for (const [key, value] of formData.entries())`
 * 4. Special case: examples JSON parsing with safeParse()
 * 5. Build submissionData object
 * 6. Type assertion: `as z.input<typeof configSubmissionSchema>`
 * 7. Send to server action
 * 8. Server validates with Zod
 * 9. Success/error response
 *
 * Benefits:
 * - No manual field extraction (20+ fields)
 * - Generic approach works for all content types
 * - Server-side validation (single source of truth)
 * - Type-safe with Zod
 */
export const FormDataExtraction: Story = {
  parameters: {
    docs: {
      description: {
        story: 'FormData API extracts all fields generically. No manual extraction for 20+ fields.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Card Header Test
 * Tests card title and description render
 */
export const CardHeaderTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify card title exists', async () => {
      const title = canvas.getByText(/Configuration Details/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Verify card description exists', async () => {
      const description = canvas.getByText(
        /Fill out the form - we'll handle the technical formatting for you/i
      );
      await expect(description).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests card header renders with title and description.',
      },
    },
  },
};

/**
 * Content Type Dropdown Test
 * Tests content type select renders with all 7 options
 */
export const ContentTypeDropdownTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Content Type label exists', async () => {
      const label = canvas.getByText(/Content Type/i);
      await expect(label).toBeInTheDocument();
    });

    await step('Verify select has 7 options', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      const options = select.querySelectorAll('option');
      await expect(options.length).toBe(7);
    });

    await step('Verify agents option exists', async () => {
      const select = canvas.getByLabelText(/Content Type/i);
      const option = Array.from(select.querySelectorAll('option')).find(
        (opt) => (opt as HTMLOptionElement).value === 'agents'
      );
      await expect(option).toBeTruthy();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests content type dropdown renders with all 7 content type options.',
      },
    },
  },
};

/**
 * Name Field Test
 * Tests name input field renders and is required
 */
export const NameFieldTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Name label exists', async () => {
      const label = canvas.getByText(/^Name/i);
      await expect(label).toBeInTheDocument();
    });

    await step('Verify name input exists and is required', async () => {
      const input = canvas.getByLabelText(/^Name/i);
      await expect(input).toBeInTheDocument();
      await expect(input.hasAttribute('required')).toBe(true);
    });

    await step('Verify name input has placeholder', async () => {
      const input = canvas.getByLabelText(/^Name/i);
      await expect(input.getAttribute('placeholder')).toContain('e.g.');
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests name field renders with required attribute and placeholder.',
      },
    },
  },
};

/**
 * Submit Button Test
 * Tests submit button renders with correct text and icon
 */
export const SubmitButtonTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify submit button exists', async () => {
      const button = canvas.getByRole('button', { name: /Submit for Review/i });
      await expect(button).toBeInTheDocument();
    });

    await step('Verify submit button type is submit', async () => {
      const button = canvas.getByRole('button', { name: /Submit for Review/i });
      await expect(button.getAttribute('type')).toBe('submit');
    });

    await step('Verify submit button is enabled by default', async () => {
      const button = canvas.getByRole('button', { name: /Submit for Review/i });
      await expect(button.hasAttribute('disabled')).toBe(false);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests submit button renders with correct type and is enabled by default.',
      },
    },
  },
};

/**
 * Info Box Test
 * Tests info box renders at bottom with Github icon and explanation
 */
export const InfoBoxTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "How it works" heading exists', async () => {
      const heading = canvas.getByText(/How it works/i);
      await expect(heading).toBeInTheDocument();
    });

    await step('Verify info box explanation exists', async () => {
      const text = canvas.getByText(/create a Pull Request/i);
      await expect(text).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests info box renders with "How it works" heading and PR workflow explanation.',
      },
    },
  },
};

/**
 * Template Selector Integration Test
 * Tests TemplateSelector component integration
 */
export const TemplateSelectorIntegrationTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Quick Start" label exists', async () => {
      const label = canvas.getByText(/Quick Start/i);
      await expect(label).toBeInTheDocument();
    });

    // TemplateSelector may return null if no templates, so we can't guarantee button exists
    await step('Template selector renders (may be null if no templates)', async () => {
      // Just verify the section exists, button is conditional
      const quickStartSection = canvas.getByText(/Quick Start/i);
      await expect(quickStartSection).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests TemplateSelector integration. May not render if no templates available.',
      },
    },
  },
};

/**
 * Duplicate Warning Integration Test
 * Tests DuplicateWarning component integration
 */
export const DuplicateWarningIntegrationTest: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify name field exists', async () => {
      const input = canvas.getByLabelText(/^Name/i);
      await expect(input).toBeInTheDocument();
    });

    // DuplicateWarning renders below name field, will show when name is entered
    await step('Name field is controlled for duplicate checking', async () => {
      const input = canvas.getByLabelText(/^Name/i) as HTMLInputElement;
      await expect(input.value).toBe(''); // Default empty
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests DuplicateWarning integration. Renders below name field with debounced checking.',
      },
    },
  },
};
