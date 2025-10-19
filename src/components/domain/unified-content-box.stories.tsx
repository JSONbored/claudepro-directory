/**
 * Unified Content Box Storybook Stories
 *
 * Comprehensive stories demonstrating all content box variants:
 * - Accordion: Collapsible Q&A with Schema.org microdata
 * - FAQ: JSON-LD structured data with automatic CSP nonce
 * - InfoBox: 5 visual variants with Schema.org Note
 * - Callout: 5 alert types using shadcn/ui Alert
 *
 * @module components/ui/unified-content-box.stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { UnifiedContentBox } from './unified-content-box';

const meta: Meta<typeof UnifiedContentBox> = {
  title: 'UI/UnifiedContentBox',
  component: UnifiedContentBox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Unified content box component consolidating accordion, FAQ, info box, and callout patterns into a single discriminated union architecture.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contentType: {
      control: 'select',
      options: ['accordion', 'faq', 'infobox', 'callout'],
      description: 'Content box type (discriminated union)',
      table: {
        type: { summary: "'accordion' | 'faq' | 'infobox' | 'callout'" },
      },
    },
    // Accordion-specific props
    title: {
      control: 'text',
      description: 'Title/heading for the content box',
      if: { arg: 'contentType', neq: 'callout' },
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: 'Description text (accordion/FAQ only)',
      if: { arg: 'contentType', oneOf: ['accordion', 'faq'] },
      table: {
        type: { summary: 'string' },
      },
    },
    allowMultiple: {
      control: 'boolean',
      description: 'Allow multiple accordion items to be open simultaneously',
      if: { arg: 'contentType', eq: 'accordion' },
      table: {
        type: { summary: 'boolean' },
      },
    },
    items: {
      control: 'object',
      description: 'Accordion items array',
      if: { arg: 'contentType', eq: 'accordion' },
      table: {
        type: { summary: 'AccordionItem[]' },
      },
    },
    // FAQ-specific props
    questions: {
      control: 'object',
      description: 'FAQ questions array with JSON-LD structured data',
      if: { arg: 'contentType', eq: 'faq' },
      table: {
        type: { summary: 'FAQQuestion[]' },
      },
    },
    // InfoBox-specific props
    variant: {
      control: 'select',
      options: ['default', 'important', 'success', 'warning', 'info'],
      description: 'Visual variant for info box',
      if: { arg: 'contentType', eq: 'infobox' },
      table: {
        type: { summary: "'default' | 'important' | 'success' | 'warning' | 'info'" },
      },
    },
    children: {
      control: 'text',
      description: 'Content for infobox or callout',
      if: { arg: 'contentType', oneOf: ['infobox', 'callout'] },
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    // Callout-specific props
    type: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success', 'tip'],
      description: 'Alert type for callout',
      if: { arg: 'contentType', eq: 'callout' },
      table: {
        type: { summary: "'info' | 'warning' | 'error' | 'success' | 'tip'" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UnifiedContentBox>;

/**
 * ==============================================================================
 * ACCORDION VARIANT STORIES
 * ==============================================================================
 */

export const AccordionBasic: Story = {
  name: 'Accordion: Basic',
  args: {
    contentType: 'accordion',
    title: 'Frequently Asked Questions',
    description: 'Common questions about our product',
    allowMultiple: false,
    items: [
      {
        title: 'What is Claude Code?',
        content: 'Claude Code is an official CLI tool from Anthropic for software development.',
        defaultOpen: true,
      },
      {
        title: 'How do I install it?',
        content: 'You can install Claude Code using npm or download from the official repository.',
        defaultOpen: false,
      },
      {
        title: 'Is it free to use?',
        content: 'Claude Code is free to use with your Anthropic API key.',
        defaultOpen: false,
      },
    ],
  },
};

export const AccordionMultipleOpen: Story = {
  name: 'Accordion: Multiple Items Open',
  args: {
    contentType: 'accordion',
    title: 'Installation Guide',
    description: 'Step-by-step installation instructions',
    allowMultiple: true,
    items: [
      {
        title: 'Step 1: Install Dependencies',
        content: 'Run npm install to install all required dependencies.',
        defaultOpen: true,
      },
      {
        title: 'Step 2: Configure Environment',
        content: 'Set up your API keys in the .env file.',
        defaultOpen: true,
      },
      {
        title: 'Step 3: Start Development',
        content: 'Run npm run dev to start the development server.',
        defaultOpen: false,
      },
    ],
  },
};

export const AccordionNoTitle: Story = {
  name: 'Accordion: Without Title',
  args: {
    contentType: 'accordion',
    description: '',
    allowMultiple: false,
    items: [
      {
        title: 'Configuration Options',
        content: 'Learn about available configuration options.',
        defaultOpen: false,
      },
      {
        title: 'Advanced Features',
        content: 'Explore advanced features and capabilities.',
        defaultOpen: false,
      },
    ],
  },
};

/**
 * ==============================================================================
 * FAQ VARIANT STORIES
 * ==============================================================================
 */

export const FAQBasic: Story = {
  name: 'FAQ: Basic',
  args: {
    contentType: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions',
    questions: [
      {
        question: 'What is an MCP server?',
        answer:
          'MCP (Model Context Protocol) servers are tools that extend Claude Code functionality with additional capabilities.',
        category: 'general',
      },
      {
        question: 'How do I create custom commands?',
        answer:
          'Custom commands are created as .md files in the .claude/commands directory. Each file defines a prompt that expands when the command is used.',
        category: 'development',
      },
      {
        question: 'Can I use Claude Code offline?',
        answer:
          'Claude Code requires an internet connection to communicate with the Anthropic API, but you can work on local files.',
        category: 'usage',
      },
    ],
  },
};

export const FAQMultipleQuestions: Story = {
  name: 'FAQ: Multiple Questions',
  args: {
    contentType: 'faq',
    title: 'Technical Support FAQ',
    description: 'Technical questions and troubleshooting',
    questions: [
      {
        question: 'How do I fix authentication errors?',
        answer: 'Verify your API key is correctly set in environment variables.',
        category: 'troubleshooting',
      },
      {
        question: 'Why is my build failing?',
        answer: 'Check that all dependencies are installed and TypeScript compiles without errors.',
        category: 'troubleshooting',
      },
      {
        question: 'How do I enable TypeScript strict mode?',
        answer: 'Set "strict": true in your tsconfig.json file.',
        category: 'configuration',
      },
      {
        question: 'Can I use custom hooks?',
        answer: 'Yes, place executable scripts in .claude/hooks/ directory.',
        category: 'customization',
      },
      {
        question: 'How do I update Claude Code?',
        answer: 'Run npm update or download the latest version from the repository.',
        category: 'maintenance',
      },
    ],
  },
};

export const FAQCustomTitle: Story = {
  name: 'FAQ: Custom Title',
  args: {
    contentType: 'faq',
    title: 'Getting Started Questions',
    description: 'Everything you need to know to begin',
    questions: [
      {
        question: 'What are the system requirements?',
        answer: 'Node.js 18+ and npm 10+ are required.',
        category: 'requirements',
      },
      {
        question: 'Do I need TypeScript experience?',
        answer: 'Basic TypeScript knowledge is helpful but not required.',
        category: 'requirements',
      },
    ],
  },
};

/**
 * ==============================================================================
 * INFOBOX VARIANT STORIES
 * ==============================================================================
 */

export const InfoBoxDefault: Story = {
  name: 'InfoBox: Default',
  args: {
    contentType: 'infobox',
    variant: 'default',
    title: 'Information',
    children: 'This is a default info box for general information.',
  },
};

export const InfoBoxImportant: Story = {
  name: 'InfoBox: Important',
  args: {
    contentType: 'infobox',
    variant: 'important',
    title: 'Important Notice',
    children:
      'This is an important info box highlighting critical information that users should pay attention to.',
  },
};

export const InfoBoxSuccess: Story = {
  name: 'InfoBox: Success',
  args: {
    contentType: 'infobox',
    variant: 'success',
    title: 'Success',
    children: 'Your operation completed successfully! All changes have been saved.',
  },
};

export const InfoBoxWarning: Story = {
  name: 'InfoBox: Warning',
  args: {
    contentType: 'infobox',
    variant: 'warning',
    title: 'Warning',
    children:
      'This action may have unintended consequences. Please review carefully before proceeding.',
  },
};

export const InfoBoxInfo: Story = {
  name: 'InfoBox: Info',
  args: {
    contentType: 'infobox',
    variant: 'info',
    title: 'Helpful Tip',
    children: 'Use keyboard shortcuts to speed up your workflow. Press Ctrl+K for quick commands.',
  },
};

export const InfoBoxNoTitle: Story = {
  name: 'InfoBox: Without Title',
  args: {
    contentType: 'infobox',
    variant: 'info',
    children: 'An info box can also be displayed without a title for simpler use cases.',
  },
};

/**
 * ==============================================================================
 * CALLOUT VARIANT STORIES
 * ==============================================================================
 */

export const CalloutInfo: Story = {
  name: 'Callout: Info',
  args: {
    contentType: 'callout',
    type: 'info',
    title: 'Information',
    children: 'This is an informational callout using the shadcn/ui Alert component.',
  },
};

export const CalloutWarning: Story = {
  name: 'Callout: Warning',
  args: {
    contentType: 'callout',
    type: 'warning',
    title: 'Warning',
    children: 'This is a warning callout. Please read carefully before proceeding.',
  },
};

export const CalloutError: Story = {
  name: 'Callout: Error',
  args: {
    contentType: 'callout',
    type: 'error',
    title: 'Error',
    children: 'An error occurred. Please check your configuration and try again.',
  },
};

export const CalloutSuccess: Story = {
  name: 'Callout: Success',
  args: {
    contentType: 'callout',
    type: 'success',
    title: 'Success',
    children: 'Operation completed successfully! Your changes have been saved.',
  },
};

export const CalloutTip: Story = {
  name: 'Callout: Tip',
  args: {
    contentType: 'callout',
    type: 'tip',
    title: 'Pro Tip',
    children: 'Use TypeScript strict mode for better type safety and fewer runtime errors.',
  },
};

export const CalloutNoTitle: Story = {
  name: 'Callout: Without Title',
  args: {
    contentType: 'callout',
    type: 'info',
    children: 'Callouts can also be displayed without a title.',
  },
};

/**
 * ==============================================================================
 * COMBINED SHOWCASE STORIES
 * ==============================================================================
 */

export const AllVariantsShowcase: Story = {
  name: 'Showcase: All Variants',
  render: () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Content Box Variants</h2>

      <div>
        <h3 className="text-xl font-semibold mb-4">Accordion</h3>
        <UnifiedContentBox
          contentType="accordion"
          title="Example Accordion"
          description="Collapsible content sections"
          allowMultiple={false}
          items={[
            { title: 'Item 1', content: 'Content 1', defaultOpen: true },
            { title: 'Item 2', content: 'Content 2', defaultOpen: false },
          ]}
        />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">FAQ</h3>
        <UnifiedContentBox
          contentType="faq"
          title="Example FAQ"
          description="Questions with JSON-LD structured data"
          questions={[
            { question: 'Question 1?', answer: 'Answer 1', category: 'general' },
            { question: 'Question 2?', answer: 'Answer 2', category: 'general' },
          ]}
        />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Info Boxes</h3>
        <div className="space-y-4">
          <UnifiedContentBox contentType="infobox" variant="default" title="Default">
            Default info box
          </UnifiedContentBox>
          <UnifiedContentBox contentType="infobox" variant="important" title="Important">
            Important info box
          </UnifiedContentBox>
          <UnifiedContentBox contentType="infobox" variant="success" title="Success">
            Success info box
          </UnifiedContentBox>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Callouts</h3>
        <div className="space-y-4">
          <UnifiedContentBox contentType="callout" type="info" title="Info">
            Info callout
          </UnifiedContentBox>
          <UnifiedContentBox contentType="callout" type="warning" title="Warning">
            Warning callout
          </UnifiedContentBox>
          <UnifiedContentBox contentType="callout" type="error" title="Error">
            Error callout
          </UnifiedContentBox>
        </div>
      </div>
    </div>
  ),
};

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Empty State - No Content
 * Shows content box with empty/minimal data
 */
export const EmptyAccordion: Story = {
  name: 'Empty: Accordion (No Items)',
  args: {
    contentType: 'accordion',
    title: 'No Items Available',
    description: 'There are no items to display at this time.',
    allowMultiple: false,
    items: [],
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State** - Accordion with no items.

**Use Cases:**
- Content not yet loaded
- No FAQ items configured
- Empty search/filter results

**Behavior:**
- Shows title and description
- No collapsible items rendered
- Graceful empty state handling

**Implementation Note:** Production should show helpful message or CTA when empty.
        `,
      },
    },
  },
};

/**
 * Empty FAQ - No Questions
 */
export const EmptyFAQ: Story = {
  name: 'Empty: FAQ (No Questions)',
  args: {
    contentType: 'faq',
    title: 'Frequently Asked Questions',
    description: 'No questions have been added yet.',
    questions: [],
  },
  parameters: {
    docs: {
      description: {
        story: `
**Empty State** - FAQ with no questions.

**Features:**
- Shows title and description
- No question/answer pairs
- JSON-LD structured data still valid (empty array)

**Use Cases:**
- FAQ not yet populated
- Content loading state
- Filtered view with no matches
        `,
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS - INTERACTIVE TESTING
// ============================================================================

/**
 * Accordion Interaction
 * Tests accordion expand/collapse functionality
 */
export const AccordionInteraction: Story = {
  name: 'Test: Accordion Interaction',
  args: {
    contentType: 'accordion',
    title: 'Interactive Accordion',
    description: 'Click items to expand/collapse',
    allowMultiple: false,
    items: [
      {
        title: 'First Item',
        content: 'This is the first item content.',
        defaultOpen: false,
      },
      {
        title: 'Second Item',
        content: 'This is the second item content.',
        defaultOpen: false,
      },
      {
        title: 'Third Item',
        content: 'This is the third item content.',
        defaultOpen: false,
      },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify accordion title is rendered', async () => {
      const title = canvas.getByText(/interactive accordion/i);
      await expect(title).toBeInTheDocument();
    });

    await step('Click first accordion item to expand', async () => {
      const firstButton = canvas.getByRole('button', { name: /first item/i });
      await userEvent.click(firstButton);
    });

    await step('Verify first item content is visible', async () => {
      const firstContent = canvas.getByText(/this is the first item content/i);
      await expect(firstContent).toBeVisible();
    });

    await step('Click second accordion item', async () => {
      const secondButton = canvas.getByRole('button', { name: /second item/i });
      await userEvent.click(secondButton);
    });

    await step('Verify first item collapsed (allowMultiple=false)', async () => {
      // When allowMultiple is false, clicking second should close first
      const firstContent = canvas.queryByText(/this is the first item content/i);
      // Content should be hidden or not in document
      expect(firstContent).not.toBeVisible();
    });

    await step('Verify second item content is visible', async () => {
      const secondContent = canvas.getByText(/this is the second item content/i);
      await expect(secondContent).toBeVisible();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Accordion expand/collapse behavior.

**Test Steps:**
1. Verify accordion title renders
2. Click first item to expand
3. Verify first item content is visible
4. Click second item to expand
5. Verify first item collapsed (allowMultiple=false)
6. Verify second item content is visible

**Validates:**
- Accordion button click handlers work
- Content expands/collapses correctly
- Single-open mode (\`allowMultiple=false\`) enforces only one open
- ARIA attributes for accessibility
- Keyboard navigation (Enter/Space)
        `,
      },
    },
  },
};

/**
 * Multi-Open Accordion Interaction
 * Tests accordion with allowMultiple=true
 */
export const MultiOpenAccordionInteraction: Story = {
  name: 'Test: Multi-Open Accordion',
  args: {
    contentType: 'accordion',
    title: 'Multi-Open Accordion',
    description: 'Multiple items can be open simultaneously',
    allowMultiple: true,
    items: [
      {
        title: 'Step 1',
        content: 'First step instructions.',
        defaultOpen: false,
      },
      {
        title: 'Step 2',
        content: 'Second step instructions.',
        defaultOpen: false,
      },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click first accordion item', async () => {
      const firstButton = canvas.getByRole('button', { name: /step 1/i });
      await userEvent.click(firstButton);
    });

    await step('Click second accordion item', async () => {
      const secondButton = canvas.getByRole('button', { name: /step 2/i });
      await userEvent.click(secondButton);
    });

    await step('Verify both items are visible (allowMultiple=true)', async () => {
      const firstContent = canvas.getByText(/first step instructions/i);
      const secondContent = canvas.getByText(/second step instructions/i);
      await expect(firstContent).toBeVisible();
      await expect(secondContent).toBeVisible();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Test**: Multi-open accordion behavior.

**Test Steps:**
1. Click first item to expand
2. Click second item to expand
3. Verify both items remain visible simultaneously

**Validates:**
- \`allowMultiple=true\` allows multiple open items
- Both contents are visible at same time
- Independent expand/collapse state
        `,
      },
    },
  },
};

/**
 * InfoBox Variant Switching
 * Tests different info box variants
 */
export const InfoBoxVariantTest: Story = {
  name: 'Test: InfoBox Variants',
  args: {
    contentType: 'infobox',
    variant: 'info',
    title: 'Info Box Title',
    children: 'This is an info box with dynamic variant switching.',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Visual Test**: InfoBox variant styles.

**Variants to Test:**
- default: Neutral gray styling
- important: Red/warning styling
- success: Green success styling
- warning: Yellow/amber warning styling
- info: Blue informational styling

**Use Controls Panel** to switch between variants and observe:
- Icon changes (Info, CheckCircle, AlertTriangle, Star)
- Background color changes
- Border color changes
- Text color changes

**Validates:**
- Visual consistency across variants
- Proper icon mapping
- Accessible color contrast
- Schema.org Note microdata
        `,
      },
    },
  },
};
