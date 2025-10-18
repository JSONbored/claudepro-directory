import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleField } from './toggle-field';

/**
 * ToggleField consolidates the common Label + Switch + description pattern
 * used across forms and settings pages.
 *
 * **Consolidation Impact:**
 * - Reduces 14 lines → 4 lines per usage (71% reduction)
 * - Type-safe with comprehensive props
 * - Consistent spacing and accessibility
 * - Used in: profile-edit-form, settings pages, preference panels
 */
const meta = {
  title: 'Forms/Utilities/ToggleField',
  component: ToggleField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A unified toggle field component that combines a Label, Switch, and optional description text. Consolidates a repetitive 14-line pattern into a single reusable component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the toggle field',
    },
    description: {
      control: 'text',
      description: 'Optional helper text shown below the label',
    },
    checked: {
      control: 'boolean',
      description: 'Current checked state of the switch',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    onCheckedChange: {
      action: 'checked changed',
      description: 'Callback fired when switch state changes',
    },
  },
} satisfies Meta<typeof ToggleField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default toggle field with label and description
 */
export const Default: Story = {
  render: function DefaultRender(args) {
    const [checked, setChecked] = useState(false);
    return <ToggleField {...args} checked={checked} onCheckedChange={setChecked} />;
  },
  args: {
    label: 'Public profile',
    description: 'Allow others to view your profile',
  },
};

/**
 * Toggle field without description text
 */
export const NoDescription: Story = {
  render: function NoDescriptionRender(args) {
    const [checked, setChecked] = useState(true);
    return <ToggleField {...args} checked={checked} onCheckedChange={setChecked} />;
  },
  args: {
    label: 'Enable notifications',
  },
};

/**
 * Disabled toggle field
 */
export const Disabled: Story = {
  render: function DisabledRender(args) {
    const [checked, setChecked] = useState(false);
    return <ToggleField {...args} checked={checked} onCheckedChange={setChecked} />;
  },
  args: {
    label: 'Premium feature',
    description: 'Upgrade to access this feature',
    disabled: true,
  },
};

/**
 * Multiple toggle fields in a group (common settings pattern)
 */
export const SettingsGroup: Story = {
  render: function SettingsGroupRender() {
    const [isPublic, setIsPublic] = useState(true);
    const [followEmail, setFollowEmail] = useState(false);
    const [marketingEmail, setMarketingEmail] = useState(false);

    return (
      <div className="space-y-4 max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Privacy & Notifications</h3>

        <ToggleField
          label="Public profile"
          description="Allow others to view your profile"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />

        <ToggleField
          label="Email on new followers"
          description="Send me an email when someone follows me"
          checked={followEmail}
          onCheckedChange={setFollowEmail}
        />

        <ToggleField
          label="Marketing emails"
          description="Receive product updates and announcements"
          checked={marketingEmail}
          onCheckedChange={setMarketingEmail}
        />
      </div>
    );
  },
};

/**
 * Toggle fields with custom styling
 */
export const CustomStyling: Story = {
  render: function CustomStylingRender() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="space-y-4 max-w-2xl">
        {/* With border */}
        <ToggleField
          label="Dark mode"
          description="Use dark theme throughout the application"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="p-4 border rounded-lg"
        />

        {/* With background */}
        <ToggleField
          label="Auto-save"
          description="Automatically save changes as you type"
          checked={enabled}
          onCheckedChange={setEnabled}
          className="p-4 bg-accent rounded-lg"
        />

        {/* With custom label styling */}
        <ToggleField
          label="Critical feature"
          description="This is an important setting"
          checked={enabled}
          onCheckedChange={setEnabled}
          labelClassName="text-red-500"
        />
      </div>
    );
  },
};

/**
 * Real-world example: Profile settings form
 */
export const ProfileSettingsExample: Story = {
  render: function ProfileSettingsExampleRender() {
    const [isPublic, setIsPublic] = useState(true);
    const [followEmail, setFollowEmail] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    const handleToggle = (setter: (value: boolean) => void) => (checked: boolean) => {
      setter(checked);
      setHasChanges(true);
    };

    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        {/* Privacy & Notifications Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Privacy & Notifications</h3>

          <ToggleField
            label="Public profile"
            description="Allow others to view your profile"
            checked={isPublic}
            onCheckedChange={handleToggle(setIsPublic)}
          />

          <ToggleField
            label="Email on new followers"
            description="Send me an email when someone follows me"
            checked={followEmail}
            onCheckedChange={handleToggle(setFollowEmail)}
          />
        </div>

        {/* Save button */}
        {hasChanges && (
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => setHasChanges(false)}
            >
              Save Changes
            </button>
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-accent"
              onClick={() => {
                setIsPublic(true);
                setFollowEmail(true);
                setHasChanges(false);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  },
};

/**
 * Accessibility example with ARIA labels
 */
export const Accessibility: Story = {
  render: function AccessibilityRender() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground mb-4">
          All toggle fields have proper ARIA labels and keyboard navigation support
        </p>

        <ToggleField
          label="Enable feature"
          description="This toggle has custom ARIA label"
          checked={enabled}
          onCheckedChange={setEnabled}
          ariaLabel="Toggle feature activation"
        />

        <div className="mt-4 p-4 bg-accent rounded-lg">
          <p className="text-sm font-medium">Keyboard navigation:</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Tab: Focus the switch</li>
            <li>• Space/Enter: Toggle the switch</li>
          </ul>
        </div>
      </div>
    );
  },
};
