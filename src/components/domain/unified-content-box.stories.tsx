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
          <UnifiedContentBox
            contentType="infobox"
            variant="default"
            title="Default"
            children="Default info box"
          />
          <UnifiedContentBox
            contentType="infobox"
            variant="important"
            title="Important"
            children="Important info box"
          />
          <UnifiedContentBox
            contentType="infobox"
            variant="success"
            title="Success"
            children="Success info box"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Callouts</h3>
        <div className="space-y-4">
          <UnifiedContentBox
            contentType="callout"
            type="info"
            title="Info"
            children="Info callout"
          />
          <UnifiedContentBox
            contentType="callout"
            type="warning"
            title="Warning"
            children="Warning callout"
          />
          <UnifiedContentBox
            contentType="callout"
            type="error"
            title="Error"
            children="Error callout"
          />
        </div>
      </div>
    </div>
  ),
};
