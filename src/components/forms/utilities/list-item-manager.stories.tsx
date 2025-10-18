import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ListItemManager } from './list-item-manager';

const meta: Meta<typeof ListItemManager> = {
  title: 'Forms/Utilities/ListItemManager',
  component: ListItemManager,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['badge', 'list', 'custom'],
      description: 'Rendering variant for list items',
    },
    label: {
      control: 'text',
      description: 'Field label text',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder',
    },
    description: {
      control: 'text',
      description: 'Helper text below input',
    },
    minItems: {
      control: 'number',
      description: 'Minimum number of items required',
    },
    maxItems: {
      control: 'number',
      description: 'Maximum number of items allowed',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length per item',
    },
    noDuplicates: {
      control: 'boolean',
      description: 'Prevent duplicate items',
    },
    showCounter: {
      control: 'boolean',
      description: 'Show item counter display',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListItemManager>;

// =============================================================================
// BADGE VARIANT STORIES
// =============================================================================

export const BadgeDefault: Story = {
  render: function BadgeDefaultStory() {
    const [items, setItems] = useState<string[]>(['React', 'TypeScript', 'Next.js']);
    return (
      <ListItemManager
        variant="badge"
        label="Skills"
        items={items}
        onChange={setItems}
        placeholder="Add a skill..."
        badgeStyle="secondary"
      />
    );
  },
};

export const BadgeInterests: Story = {
  render: function BadgeInterestsStory() {
    const [interests, setInterests] = useState<string[]>(['AI', 'Machine Learning']);
    return (
      <ListItemManager
        variant="badge"
        label="Interests & Skills"
        items={interests}
        onChange={setInterests}
        placeholder="Add an interest..."
        maxItems={10}
        maxLength={30}
        noDuplicates
        showCounter
        badgeStyle="secondary"
        description="Press Enter or click Add (max 30 characters per interest)"
      />
    );
  },
};

export const BadgeTags: Story = {
  render: function BadgeTagsStory() {
    const [tags, setTags] = useState<string[]>(['Python', 'Remote']);
    return (
      <ListItemManager
        variant="badge"
        label="Tags"
        items={tags}
        onChange={setTags}
        placeholder="e.g., AI, Python, Remote"
        minItems={1}
        maxItems={10}
        noDuplicates
        showCounter
        badgeStyle="outline"
        description="Keywords for search (minimum 1, maximum 10)"
      />
    );
  },
};

export const BadgeOutlineStyle: Story = {
  render: function BadgeOutlineStyleStory() {
    const [items, setItems] = useState<string[]>(['Tag 1', 'Tag 2']);
    return (
      <ListItemManager
        variant="badge"
        label="Outline Badges"
        items={items}
        onChange={setItems}
        placeholder="Add a tag..."
        badgeStyle="outline"
      />
    );
  },
};

export const BadgeDefaultStyle: Story = {
  render: function BadgeDefaultStyleStory() {
    const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);
    return (
      <ListItemManager
        variant="badge"
        label="Default Style Badges"
        items={items}
        onChange={setItems}
        placeholder="Add an item..."
        badgeStyle="default"
      />
    );
  },
};

// =============================================================================
// LIST VARIANT STORIES
// =============================================================================

export const ListDefault: Story = {
  render: function ListDefaultStory() {
    const [items, setItems] = useState<string[]>(['First item', 'Second item', 'Third item']);
    return (
      <ListItemManager
        variant="list"
        label="Items"
        items={items}
        onChange={setItems}
        placeholder="Add an item..."
      />
    );
  },
};

export const ListRequirements: Story = {
  render: function ListRequirementsStory() {
    const [requirements, setRequirements] = useState<string[]>([
      '5+ years of Python experience',
      'Experience with React and TypeScript',
    ]);
    return (
      <ListItemManager
        variant="list"
        label="Requirements"
        items={requirements}
        onChange={setRequirements}
        placeholder="e.g., 5+ years of Python experience"
        maxItems={20}
        description="Skills and qualifications needed"
      />
    );
  },
};

export const ListEmpty: Story = {
  render: function ListEmptyStory() {
    const [items, setItems] = useState<string[]>([]);
    return (
      <ListItemManager
        variant="list"
        label="Empty List"
        items={items}
        onChange={setItems}
        placeholder="Start adding items..."
      />
    );
  },
};

// =============================================================================
// VALIDATION STORIES
// =============================================================================

export const ValidationMinItems: Story = {
  render: function ValidationMinItemsStory() {
    const [items, setItems] = useState<string[]>([]);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This field requires at least 1 item. Try adding and removing items.
        </p>
        <ListItemManager
          variant="badge"
          label="Required Tags"
          items={items}
          onChange={setItems}
          placeholder="Add a required tag..."
          minItems={1}
          maxItems={5}
          noDuplicates
          badgeStyle="outline"
        />
      </div>
    );
  },
};

export const ValidationMaxItems: Story = {
  render: function ValidationMaxItemsStory() {
    const [items, setItems] = useState<string[]>([
      'Item 1',
      'Item 2',
      'Item 3',
      'Item 4',
      'Item 5',
    ]);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Maximum 5 items allowed. The input is disabled when limit is reached.
        </p>
        <ListItemManager
          variant="badge"
          label="Limited Items"
          items={items}
          onChange={setItems}
          placeholder="Add an item..."
          maxItems={5}
          showCounter
          badgeStyle="secondary"
        />
      </div>
    );
  },
};

export const ValidationNoDuplicates: Story = {
  render: function ValidationNoDuplicatesStory() {
    const [items, setItems] = useState<string[]>(['Existing Item']);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Try adding "Existing Item" again - it will show an error toast.
        </p>
        <ListItemManager
          variant="badge"
          label="Unique Items"
          items={items}
          onChange={setItems}
          placeholder="Add a unique item..."
          noDuplicates
          badgeStyle="secondary"
        />
      </div>
    );
  },
};

export const ValidationMaxLength: Story = {
  render: function ValidationMaxLengthStory() {
    const [items, setItems] = useState<string[]>(['Short item']);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Each item is limited to 20 characters. Try adding a longer item.
        </p>
        <ListItemManager
          variant="badge"
          label="Short Items"
          items={items}
          onChange={setItems}
          placeholder="Add a short item (max 20 chars)..."
          maxLength={20}
          badgeStyle="secondary"
        />
      </div>
    );
  },
};

export const ValidationCombined: Story = {
  render: function ValidationCombinedStory() {
    const [items, setItems] = useState<string[]>(['AI', 'ML']);
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Combined validation: min 1, max 10 items, max 30 chars per item, no duplicates
        </p>
        <ListItemManager
          variant="badge"
          label="Interests & Skills"
          items={items}
          onChange={setItems}
          placeholder="Add an interest..."
          minItems={1}
          maxItems={10}
          maxLength={30}
          noDuplicates
          showCounter
          badgeStyle="secondary"
        />
      </div>
    );
  },
};

// =============================================================================
// INTERACTIVE DEMOS
// =============================================================================

export const InteractiveProfileInterests: Story = {
  render: function InteractiveProfileInterestsStory() {
    const [interests, setInterests] = useState<string[]>(['React', 'TypeScript', 'Next.js']);
    const [hasChanges, setHasChanges] = useState(false);

    return (
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Profile Edit Form - Interests Section</h3>
          <p className="text-sm text-muted-foreground">
            This mimics the interests field from profile-edit-form.tsx
          </p>
        </div>

        <ListItemManager
          variant="badge"
          label="Interests & Skills"
          items={interests}
          onChange={setInterests}
          onFieldChange={() => setHasChanges(true)}
          placeholder="Add an interest..."
          maxItems={10}
          maxLength={30}
          noDuplicates
          showCounter
          badgeStyle="secondary"
          description="Press Enter or click Add"
        />

        {hasChanges && <p className="text-sm text-orange-600">Unsaved changes detected</p>}
      </div>
    );
  },
};

export const InteractiveJobTags: Story = {
  render: function InteractiveJobTagsStory() {
    const [tags, setTags] = useState<string[]>(['AI', 'Python']);
    const showError = tags.length === 0;

    return (
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Job Form - Tags Section</h3>
          <p className="text-sm text-muted-foreground">
            This mimics the tags field from job-form.tsx (minimum 1 required)
          </p>
        </div>

        <ListItemManager
          variant="badge"
          label="Tags"
          items={tags}
          onChange={setTags}
          placeholder="e.g., AI, Python, Remote"
          minItems={1}
          maxItems={10}
          noDuplicates
          showCounter
          badgeStyle="outline"
          description="Keywords for search (minimum 1, maximum 10)"
        />

        {showError && <p className="text-xs text-destructive">At least one tag is required</p>}
      </div>
    );
  },
};

export const InteractiveJobRequirements: Story = {
  render: function InteractiveJobRequirementsStory() {
    const [requirements, setRequirements] = useState<string[]>([
      '5+ years of Python experience',
      'Experience with React and TypeScript',
    ]);

    return (
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Job Form - Requirements Section</h3>
          <p className="text-sm text-muted-foreground">
            This mimics the requirements field from job-form.tsx
          </p>
        </div>

        <ListItemManager
          variant="list"
          label="Requirements"
          items={requirements}
          onChange={setRequirements}
          placeholder="e.g., 5+ years of Python experience"
          maxItems={20}
          description="Skills and qualifications needed"
        />
      </div>
    );
  },
};

export const InteractiveJobBenefits: Story = {
  render: function InteractiveJobBenefitsStory() {
    const [benefits, setBenefits] = useState<string[]>(['Health insurance', '401k', 'Remote work']);

    return (
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">Job Form - Benefits Section</h3>
          <p className="text-sm text-muted-foreground">
            This mimics the benefits field from job-form.tsx
          </p>
        </div>

        <ListItemManager
          variant="badge"
          label="Benefits"
          items={benefits}
          onChange={setBenefits}
          placeholder="e.g., Health insurance, 401k, Remote work"
          maxItems={20}
          badgeStyle="secondary"
          description="Perks and benefits offered"
        />
      </div>
    );
  },
};

// =============================================================================
// CUSTOM VARIANT STORY
// =============================================================================

export const CustomRenderItem: Story = {
  render: function CustomRenderItemStory() {
    const [items, setItems] = useState<string[]>(['Custom 1', 'Custom 2']);
    return (
      <ListItemManager
        variant="custom"
        label="Custom Rendered Items"
        items={items}
        onChange={setItems}
        placeholder="Add a custom item..."
        renderItem={(item, index, onRemove) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border-2 border-dashed rounded-lg bg-secondary/20"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
              <span className="font-medium">{item}</span>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="text-destructive hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        )}
      />
    );
  },
};

// =============================================================================
// STATE STORIES
// =============================================================================

export const StateDisabled: Story = {
  render: function StateDisabledStory() {
    const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);
    return (
      <ListItemManager
        variant="badge"
        label="Disabled State"
        items={items}
        onChange={setItems}
        placeholder="Cannot add items..."
        disabled
        badgeStyle="secondary"
      />
    );
  },
};

export const StateWithError: Story = {
  render: function StateWithErrorStory() {
    const [items, setItems] = useState<string[]>([]);
    return (
      <ListItemManager
        variant="badge"
        label="Field with Error"
        items={items}
        onChange={setItems}
        placeholder="Add an item..."
        errorMessage="This field is required"
        badgeStyle="secondary"
      />
    );
  },
};

/**
 * MobileSmall: Small Mobile Viewport (320px)
 * Tests component on smallest modern mobile devices
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
};

/**
 * MobileLarge: Large Mobile Viewport (414px)
 * Tests component on larger modern mobile devices
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
};

/**
 * Tablet: Tablet Viewport (834px)
 * Tests component on tablet devices
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: 'tablet' },
  },
};

/**
 * DarkTheme: Dark Mode Theme
 * Tests component appearance in dark mode
 */
export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
  },
};

/**
 * LightTheme: Light Mode Theme
 * Tests component appearance in light mode
 */
export const LightTheme: Story = {
  globals: {
    theme: 'light',
  },
};
