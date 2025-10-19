'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { Template } from './template-selector';
import { TemplateSelector } from './template-selector';

/**
 * TemplateSelector Component Stories
 *
 * Config-driven dropdown for pre-filling forms with curated templates.
 * Templates defined in JSON files and validated with Zod schemas.
 *
 * Features:
 * - Config-driven template system
 * - Dropdown menu with template list
 * - Template selection callback
 * - FileText icon with ChevronDown
 * - Responsive width (280px mobile, 320px desktop)
 * - Multi-line items (name + description)
 * - Returns null if no templates for content type
 * - Keyboard accessible
 * - Type-safe with Zod validation
 *
 * Component: src/components/forms/template-selector.tsx (76 LOC)
 * Used in: Submit forms, content creation forms
 * Dependencies: DropdownMenu, Button, TEMPLATES config
 *
 * Props:
 * ```ts
 * interface TemplateSelectorProps {
 *   contentType: 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills';
 *   onSelect: (template: Template) => void;
 * }
 * ```
 *
 * Template Interface:
 * ```ts
 * interface Template {
 *   id: string;
 *   name: string;
 *   description: string;
 *   // ... other fields (title, content, tags, etc.)
 * }
 * ```
 *
 * Content Types (7):
 * - agents: AI agent configurations
 * - mcp: Model Context Protocol servers
 * - rules: Project rules and guidelines
 * - commands: Slash commands
 * - hooks: Git hooks and lifecycle scripts
 * - statuslines: Status line configurations
 * - skills: Reusable skill definitions
 *
 * Template Sources:
 * - Templates loaded from TEMPLATES config
 * - JSON files in src/lib/config/templates/*.json
 * - Validated with Zod schemas at runtime
 * - Type-safe TypeScript interfaces
 *
 * Behavior:
 * - If templates.length === 0 → returns null
 * - Otherwise → renders dropdown button
 * - User clicks button → dropdown opens
 * - User selects template → onSelect(template) called
 * - Parent component receives template data
 * - Parent pre-fills form with template values
 *
 * IMPORTANT: This is a config-driven component.
 * Templates are defined in JSON, not in this component.
 * To add templates, edit JSON files in src/lib/config/templates/
 *
 * @see Research Report: "Config-Driven Component Architecture"
 */
const meta = {
  title: 'Forms/TemplateSelector',
  component: TemplateSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Config-driven dropdown for template selection. Templates from JSON files, validated with Zod. Returns null if no templates available.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contentType: {
      control: 'select',
      options: ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills'],
      description: 'Type of content to show templates for',
    },
    onSelect: {
      action: 'selected',
      description: 'Callback when template is selected',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-w-[400px] p-8 bg-background border rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TemplateSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Agents Templates
 *
 * Shows template selector for agents content type.
 * Displays available agent configuration templates.
 *
 * Usage:
 * ```tsx
 * <TemplateSelector
 *   contentType="agents"
 *   onSelect={(template) => {
 *     // Pre-fill form with template data
 *     setFormValues(template);
 *   }}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * MCP Templates
 *
 * Shows template selector for MCP (Model Context Protocol) servers.
 * Displays available MCP server templates.
 */
export const MCPTemplates: Story = {
  args: {
    contentType: 'mcp',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Rules Templates
 *
 * Shows template selector for project rules.
 * Displays available rule configuration templates.
 */
export const RulesTemplates: Story = {
  args: {
    contentType: 'rules',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Commands Templates
 *
 * Shows template selector for slash commands.
 * Displays available command templates.
 */
export const CommandsTemplates: Story = {
  args: {
    contentType: 'commands',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Hooks Templates
 *
 * Shows template selector for hooks.
 * Displays available hook configuration templates.
 */
export const HooksTemplates: Story = {
  args: {
    contentType: 'hooks',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Statuslines Templates
 *
 * Shows template selector for statuslines.
 * Displays available statusline configuration templates.
 */
export const StatuslinesTemplates: Story = {
  args: {
    contentType: 'statuslines',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * Skills Templates
 *
 * Shows template selector for skills.
 * Displays available skill definition templates.
 */
export const SkillsTemplates: Story = {
  args: {
    contentType: 'skills',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
};

/**
 * No Templates Available
 *
 * Shows behavior when no templates exist for content type.
 * Component returns null (renders nothing).
 *
 * This can happen if:
 * - Content type has no templates defined
 * - Templates JSON file is empty
 * - TEMPLATES config not loaded
 */
export const NoTemplatesAvailable: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Component returns null when templates.length === 0. No UI rendered if no templates available.',
      },
    },
  },
};

/**
 * Button Appearance
 *
 * Shows "Use Template" button with FileText icon and ChevronDown.
 *
 * Visual:
 * - Outline variant button
 * - Full width (w-full)
 * - Space-between layout (justify-between)
 * - FileText icon (4x4) + "Use Template" text on left
 * - ChevronDown icon (4x4, opacity-50) on right
 */
export const ButtonAppearance: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Button styled with outline variant, FileText icon, and ChevronDown indicator.',
      },
    },
  },
};

/**
 * Dropdown Menu Items
 *
 * Shows template items in dropdown with name and description.
 *
 * Item structure:
 * - flex-col layout (vertical stacking)
 * - items-start alignment (left-aligned)
 * - py-3 padding (12px vertical)
 * - cursor-pointer on hover
 * - Name: font-medium
 * - Description: text-xs text-muted-foreground mt-0.5
 */
export const DropdownMenuItems: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dropdown items show template name (bold) and description (small, muted). Click to select.',
      },
    },
  },
};

/**
 * Responsive Width
 *
 * Shows responsive dropdown width.
 * - Mobile (< sm): 280px
 * - Desktop (>= sm): 320px
 */
export const ResponsiveWidth: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Dropdown width: 280px on mobile, 320px on desktop (w-[280px] sm:w-[320px]).',
      },
    },
  },
};

/**
 * Template Selection Flow
 *
 * Demonstrates full template selection flow:
 * 1. User clicks "Use Template" button
 * 2. Dropdown opens with template list
 * 3. User clicks template item
 * 4. onSelect callback fires with template data
 * 5. Parent component receives template
 * 6. Parent pre-fills form with template values
 */
export const TemplateSelectionFlow: Story = {
  args: {
    contentType: 'agents',
    onSelect: (template: Template) => {
      alert(`Selected template:\n\nName: ${template.name}\nDescription: ${template.description}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click "Use Template", select a template to see selection flow. Alert shows selected template data.',
      },
    },
  },
};

/**
 * Keyboard Navigation
 *
 * Component is fully keyboard accessible:
 * - Tab: Focus on "Use Template" button
 * - Enter/Space: Open dropdown
 * - Arrow keys: Navigate template items
 * - Enter: Select template
 * - Escape: Close dropdown
 */
export const KeyboardNavigation: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully keyboard accessible. Tab to focus, Enter to open, arrows to navigate, Enter to select.',
      },
    },
  },
};

/**
 * Integration with Form
 *
 * Shows TemplateSelector integrated in a form context.
 * User selects template to pre-fill form fields.
 */
export const IntegrationWithForm: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Quick Start</div>
        <p className="text-xs text-muted-foreground mb-3">
          Start with a template or create from scratch
        </p>
      </div>
      <TemplateSelector {...args} />
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Form fields would be pre-filled below when template is selected
        </p>
      </div>
    </div>
  ),
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'TemplateSelector in form context. Select template to pre-fill form fields below.',
      },
    },
  },
};

/**
 * Config-Driven Architecture
 *
 * Demonstrates config-driven template system.
 * Templates defined in JSON, not hardcoded.
 *
 * Template locations:
 * - src/lib/config/templates/agents.json
 * - src/lib/config/templates/mcp.json
 * - src/lib/config/templates/rules.json
 * - etc.
 *
 * Benefits:
 * - Non-developers can add templates
 * - Easy maintenance (edit JSON, not code)
 * - Type-safe with Zod validation
 * - Scalable (add templates without code changes)
 */
export const ConfigDrivenArchitecture: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Templates loaded from JSON files, validated with Zod. To add templates, edit JSON files in src/lib/config/templates/.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Button Render Test
 * Tests "Use Template" button renders
 */
export const ButtonRenderTest: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests "Use Template" button renders with correct text.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Use Template" button exists', async () => {
      const button = canvas.getByRole('button', { name: /Use Template/i });
      await expect(button).toBeInTheDocument();
    });

    await step('Verify button has outline variant', async () => {
      const button = canvas.getByRole('button', { name: /Use Template/i });
      await expect(button.className).toContain('outline');
    });
  },
};

/**
 * FileText Icon Test
 * Tests FileText icon is present in button
 */
export const FileTextIconTest: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests FileText icon appears in button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify FileText icon is present', async () => {
      const button = canvasElement.querySelector('button');
      const svg = button?.querySelector('svg');
      await expect(svg).toBeTruthy();
    });
  },
};

/**
 * ChevronDown Icon Test
 * Tests ChevronDown icon is present in button
 */
export const ChevronDownIconTest: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests ChevronDown icon appears in button.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify ChevronDown icon is present', async () => {
      const button = canvasElement.querySelector('button');
      const svgs = button?.querySelectorAll('svg');
      // Should have 2 SVGs (FileText + ChevronDown)
      await expect(svgs?.length).toBeGreaterThanOrEqual(2);
    });
  },
};

/**
 * Button Type Test
 * Tests button has type="button" to prevent form submission
 */
export const ButtonTypeTest: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests button has type="button" attribute.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify button type is "button"', async () => {
      const button = canvas.getByRole('button', { name: /Use Template/i });
      await expect(button.getAttribute('type')).toBe('button');
    });
  },
};

/**
 * Full Width Test
 * Tests button has w-full class
 */
export const FullWidthTest: Story = {
  args: {
    contentType: 'agents',
    onSelect: (_template: Template) => {
      // Intentional no-op for demonstration
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests button has w-full class for full width.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify button has w-full class', async () => {
      const button = canvas.getByRole('button', { name: /Use Template/i });
      await expect(button.className).toContain('w-full');
    });
  },
};
