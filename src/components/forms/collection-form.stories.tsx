'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { CollectionForm } from './collection-form';

/**
 * CollectionForm Component Stories
 *
 * Form for creating and editing user collections with bookmarks.
 * Manages collection metadata and bookmark associations.
 *
 * Features:
 * - Create and edit modes
 * - Auto-slug generation from name
 * - Public/private toggle
 * - Bookmark selection (create mode)
 * - Character count indicators
 * - Form validation
 * - useTransition for pending state
 * - Server actions integration
 * - Toast notifications
 * - Router navigation
 *
 * Component: src/components/forms/collection-form.tsx (266 LOC)
 * Used in: Collection creation/editing pages
 * Dependencies: FormField, Checkbox, Label, Button, UnifiedBadge
 *
 * Props:
 * ```ts
 * interface CollectionFormProps {
 *   bookmarks: Bookmark[];
 *   mode: 'create' | 'edit';
 *   collection?: CollectionData;
 * }
 * ```
 *
 * Form Fields:
 * 1. **Collection Name** (required):
 *    - Input field
 *    - Max 100 characters
 *    - Character count shown
 *    - Auto-generates slug on change
 *
 * 2. **Slug**:
 *    - Input field
 *    - Max 100 characters
 *    - Auto-generated from name (create mode)
 *    - Lowercase enforced
 *    - URL-safe formatting
 *
 * 3. **Description** (optional):
 *    - Textarea field
 *    - Max 500 characters
 *    - Character count shown
 *    - 3 rows
 *
 * 4. **Public Collection**:
 *    - Checkbox toggle
 *    - Default: false (private)
 *    - Label: "Make this collection visible on your public profile"
 *
 * 5. **Add Bookmarks** (create mode only):
 *    - Checkbox list
 *    - Max-height scroll area (256px)
 *    - Shows content type badge + slug
 *    - Selected count displayed
 *
 * Auto-Slug Logic:
 * ```ts
 * const generatedSlug = value
 *   .toLowerCase()
 *   .replace(/[^a-z0-9]+/g, '-')
 *   .replace(/^-+|-+$/g, '');
 * ```
 *
 * Validation:
 * - Name required (min 2 characters)
 * - Trim whitespace before submission
 * - Toast on validation error
 *
 * Submit Flow:
 * - Create mode: createCollection() action → navigate to collection page
 * - Edit mode: updateCollection() action → navigate to updated collection page
 * - Success toast → router.push() → router.refresh()
 * - Error toast on failure
 *
 * IMPORTANT: This component integrates with server actions.
 * In Storybook, server actions are mocked.
 * For full testing, use in production with real database.
 */
const meta = {
  title: 'Forms/CollectionForm',
  component: CollectionForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form for creating/editing collections. Auto-slug generation, bookmark selection, public/private toggle. Integrates with server actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Form mode: create new or edit existing collection',
    },
    bookmarks: {
      control: 'object',
      description: 'Array of user bookmarks to select from',
    },
    collection: {
      control: 'object',
      description: 'Existing collection data (edit mode only)',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-w-[600px] max-w-[800px] p-8 bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollectionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Create Mode with Bookmarks
 *
 * Shows collection creation form with bookmark selection.
 * User can select bookmarks to add to new collection.
 */
export const Default: Story = {
  args: {
    mode: 'create',
    bookmarks: [
      {
        id: '1',
        content_type: 'agents',
        content_slug: 'code-reviewer',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        content_type: 'commands',
        content_slug: 'generate-tests',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        content_type: 'hooks',
        content_slug: 'pre-commit',
        created_at: new Date().toISOString(),
      },
    ],
  },
};

/**
 * Create Mode - Empty Bookmarks
 *
 * Shows create form when user has no bookmarks yet.
 * Displays helpful message about adding bookmarks later.
 */
export const CreateModeEmptyBookmarks: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create mode with no bookmarks. Shows dashed border message: "Create the collection first and add bookmarks later."',
      },
    },
  },
};

/**
 * Edit Mode
 *
 * Shows form in edit mode with existing collection data.
 * Pre-fills fields with collection values.
 * Bookmark selection hidden in edit mode.
 */
export const EditMode: Story = {
  args: {
    mode: 'edit',
    bookmarks: [],
    collection: {
      id: 'coll-123',
      name: 'My Favorite Tools',
      slug: 'my-favorite-tools',
      description: 'A curated collection of my most-used development tools',
      is_public: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode pre-fills form with existing collection data. Bookmark selection not shown.',
      },
    },
  },
};

/**
 * Auto-Slug Generation
 *
 * Demonstrates auto-slug generation from collection name.
 * Converts to lowercase, replaces special chars with hyphens.
 *
 * Examples:
 * - "My Collection" → "my-collection"
 * - "React & TypeScript" → "react-typescript"
 * - "  Spaces  " → "spaces"
 */
export const AutoSlugGeneration: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Type in Collection Name to see auto-slug generation. Converts to URL-safe format automatically.',
      },
    },
  },
};

/**
 * Public Collection Toggle
 *
 * Shows public/private toggle checkbox.
 * Default: private (unchecked)
 * Checked: collection visible on public profile
 */
export const PublicCollectionToggle: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Public Collection checkbox. When checked, collection appears on public profile. Default: private.',
      },
    },
  },
};

/**
 * Character Count Indicators
 *
 * Shows character count for name and description fields.
 * - Name: X/100 characters
 * - Description: X/500 characters
 */
export const CharacterCountIndicators: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Character counters shown below name (100 max) and description (500 max) fields.',
      },
    },
  },
};

/**
 * Bookmark Selection
 *
 * Shows bookmark selection UI in create mode.
 * Checkboxes with content type badges and slugs.
 * Scrollable list (max-height 256px).
 */
export const BookmarkSelection: Story = {
  args: {
    mode: 'create',
    bookmarks: Array.from({ length: 10 }, (_, i) => ({
      id: `bookmark-${i + 1}`,
      content_type: ['agents', 'commands', 'hooks', 'mcp'][i % 4] as string,
      content_slug: `example-${i + 1}`,
      created_at: new Date().toISOString(),
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bookmark selection with 10 items. Scrollable list with content type badges. Select multiple.',
      },
    },
  },
};

/**
 * Selected Bookmarks Counter
 *
 * Shows counter below bookmark list.
 * "X bookmark(s) selected"
 * Only appears when bookmarks are selected.
 */
export const SelectedBookmarksCounter: Story = {
  args: {
    mode: 'create',
    bookmarks: [
      {
        id: '1',
        content_type: 'agents',
        content_slug: 'code-reviewer',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        content_type: 'commands',
        content_slug: 'generate-tests',
        created_at: new Date().toISOString(),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Select bookmarks to see counter: "X bookmark(s) selected". Singular/plural handled.',
      },
    },
  },
};

/**
 * Form Validation - Name Required
 *
 * Shows validation when name is empty.
 * Toast: "Collection name is required"
 */
export const ValidationNameRequired: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Submit empty form to see validation toast: "Collection name is required".',
      },
    },
  },
};

/**
 * Form Validation - Name Min Length
 *
 * Shows validation when name is too short.
 * Toast: "Collection name must be at least 2 characters"
 */
export const ValidationNameMinLength: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enter 1 character and submit to see: "Collection name must be at least 2 characters".',
      },
    },
  },
};

/**
 * Pending State - Create
 *
 * Shows form in pending state during collection creation.
 * Button text: "Creating..."
 * All fields disabled
 */
export const PendingStateCreate: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fill form and submit to see pending state. Button shows "Creating...", fields disabled.',
      },
    },
  },
};

/**
 * Pending State - Edit
 *
 * Shows form in pending state during collection update.
 * Button text: "Saving..."
 * All fields disabled
 */
export const PendingStateEdit: Story = {
  args: {
    mode: 'edit',
    bookmarks: [],
    collection: {
      id: 'coll-123',
      name: 'My Collection',
      slug: 'my-collection',
      is_public: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Submit form in edit mode to see "Saving..." button and disabled fields.',
      },
    },
  },
};

/**
 * Submit Buttons
 *
 * Shows submit and cancel buttons.
 * - Submit: "Create Collection" (create) or "Save Changes" (edit)
 * - Cancel: "Cancel" (outline variant, calls router.back())
 */
export const SubmitButtons: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Submit button text changes based on mode. Cancel button navigates back.',
      },
    },
  },
};

/**
 * Slug Manual Override
 *
 * Shows that slug can be manually edited.
 * Auto-generation only in create mode when slug is empty.
 */
export const SlugManualOverride: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Manually edit slug field. Auto-generation stops when slug is manually set. Lowercase enforced.',
      },
    },
  },
};

/**
 * Responsive Layout
 *
 * Form adapts to mobile screens.
 * Submit button: flex-1 on mobile, flex-initial on desktop.
 */
export const ResponsiveLayout: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Submit button full-width on mobile, auto-width on desktop (flex-1 sm:flex-initial).',
      },
    },
  },
};

/**
 * Bookmark Badge Styling
 *
 * Shows UnifiedBadge component for content types.
 * - Variant: base
 * - Style: outline
 * - Capitalized text
 * - Text size: xs
 */
export const BookmarkBadgeStyling: Story = {
  args: {
    mode: 'create',
    bookmarks: [
      {
        id: '1',
        content_type: 'agents',
        content_slug: 'code-reviewer',
        created_at: new Date().toISOString(),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Content type badges use UnifiedBadge with outline style. Capitalized (e.g., "Agents").',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Collection Name Field Test
 * Tests name input field is present and required
 */
export const CollectionNameFieldTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Collection Name field is present and required.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Collection Name field exists', async () => {
      const nameInput = canvas.getByLabelText(/Collection Name/i);
      await expect(nameInput).toBeInTheDocument();
    });

    await step('Verify Collection Name field is required', async () => {
      const nameInput = canvas.getByLabelText(/Collection Name/i);
      await expect(nameInput).toBeRequired();
    });
  },
};

/**
 * Slug Field Test
 * Tests slug input field is present
 */
export const SlugFieldTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Slug field is present with description.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Slug field exists', async () => {
      const slugInput = canvas.getByLabelText(/Slug/i);
      await expect(slugInput).toBeInTheDocument();
    });

    await step('Verify Slug field description is shown', async () => {
      const description = canvas.getByText(/Used in URL/i);
      await expect(description).toBeInTheDocument();
    });
  },
};

/**
 * Description Field Test
 * Tests description textarea is present
 */
export const DescriptionFieldTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Description textarea is present.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Description field exists', async () => {
      const descriptionTextarea = canvas.getByLabelText(/Description/i);
      await expect(descriptionTextarea).toBeInTheDocument();
    });

    await step('Verify Description field is textarea', async () => {
      const descriptionTextarea = canvas.getByLabelText(/Description/i);
      await expect(descriptionTextarea.tagName).toBe('TEXTAREA');
    });
  },
};

/**
 * Public Checkbox Test
 * Tests public collection checkbox is present
 */
export const PublicCheckboxTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Public Collection checkbox is present.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Public Collection checkbox exists', async () => {
      const checkbox = canvas.getByRole('checkbox', { name: /Public Collection/i });
      await expect(checkbox).toBeInTheDocument();
    });
  },
};

/**
 * Submit Button Test
 * Tests submit button is present with correct text
 */
export const SubmitButtonTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests submit button shows "Create Collection" in create mode.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify submit button exists', async () => {
      const submitButton = canvas.getByRole('button', { name: /Create Collection/i });
      await expect(submitButton).toBeInTheDocument();
    });

    await step('Verify submit button type is submit', async () => {
      const submitButton = canvas.getByRole('button', { name: /Create Collection/i });
      await expect(submitButton.getAttribute('type')).toBe('submit');
    });
  },
};

/**
 * Cancel Button Test
 * Tests cancel button is present
 */
export const CancelButtonTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests cancel button is present.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify cancel button exists', async () => {
      const cancelButton = canvas.getByRole('button', { name: /Cancel/i });
      await expect(cancelButton).toBeInTheDocument();
    });

    await step('Verify cancel button type is button', async () => {
      const cancelButton = canvas.getByRole('button', { name: /Cancel/i });
      await expect(cancelButton.getAttribute('type')).toBe('button');
    });
  },
};

/**
 * Edit Mode Button Text Test
 * Tests submit button shows "Save Changes" in edit mode
 */
export const EditModeButtonTextTest: Story = {
  args: {
    mode: 'edit',
    bookmarks: [],
    collection: {
      id: 'coll-123',
      name: 'Test Collection',
      slug: 'test-collection',
      is_public: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests submit button shows "Save Changes" in edit mode.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify submit button shows "Save Changes"', async () => {
      const submitButton = canvas.getByRole('button', { name: /Save Changes/i });
      await expect(submitButton).toBeInTheDocument();
    });
  },
};

/**
 * Bookmarks Section Test
 * Tests bookmark selection section appears in create mode
 */
export const BookmarksSectionTest: Story = {
  args: {
    mode: 'create',
    bookmarks: [
      {
        id: '1',
        content_type: 'agents',
        content_slug: 'test-agent',
        created_at: new Date().toISOString(),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests bookmark selection section appears when bookmarks exist in create mode.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Add Bookmarks" heading exists', async () => {
      const heading = canvas.getByText(/Add Bookmarks \(Optional\)/i);
      await expect(heading).toBeInTheDocument();
    });
  },
};
