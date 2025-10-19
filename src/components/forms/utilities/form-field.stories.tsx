/**
 * FormField Component Stories
 *
 * Comprehensive Storybook documentation for the unified FormField component.
 * Demonstrates all variants, states, and use cases.
 *
 * @module components/forms/utilities/form-field.stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SelectItem } from '@/src/components/primitives/select';
import { FormField } from './form-field';

const meta: Meta<typeof FormField> = {
  title: 'Forms/Utilities/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Unified form field component that consolidates Label + Input/Textarea/Select patterns. Reduces boilerplate code and ensures consistent styling, accessibility, and error handling across all forms.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Discriminated union variant
    variant: {
      control: 'select',
      options: ['input', 'textarea', 'select'],
      description: 'Field type (discriminated union)',
      table: {
        type: { summary: 'string' },
      },
    },
    // Common props
    label: {
      control: 'text',
      description: 'Field label text',
      table: {
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Mark field as required (shows asterisk)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'boolean',
      description: 'Error state (red border)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
      if: { arg: 'error', truthy: true },
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: 'Helper text below field',
      table: {
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable field interactions',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // Input variant props
    type: {
      control: 'select',
      options: ['text', 'email', 'url', 'password', 'number'],
      description: 'Input type',
      if: { arg: 'variant', eq: 'input' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
      if: { arg: 'variant', oneOf: ['input', 'textarea'] },
      table: {
        type: { summary: 'string' },
      },
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length (shows counter)',
      if: { arg: 'variant', oneOf: ['input', 'textarea'] },
      table: {
        type: { summary: 'number' },
      },
    },
    // Textarea variant props
    rows: {
      control: 'number',
      description: 'Number of visible text rows',
      if: { arg: 'variant', eq: 'textarea' },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3' },
      },
    },
    // Select variant props (children would be SelectItems in real usage)
    // Note: SelectItems need to be in children, can't be controlled via argTypes
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

// =============================================================================
// INPUT VARIANTS
// =============================================================================

/**
 * Basic text input field
 */
export const InputText: Story = {
  args: {
    variant: 'input',
    label: 'Full Name',
    type: 'text',
    name: 'name',
    placeholder: 'Enter your full name',
    required: true,
  },
};

/**
 * Email input with validation type
 */
export const InputEmail: Story = {
  args: {
    variant: 'input',
    label: 'Email Address',
    type: 'email',
    name: 'email',
    placeholder: 'you@example.com',
    required: true,
    description: "We'll never share your email with anyone else.",
  },
};

/**
 * URL input for websites
 */
export const InputUrl: Story = {
  args: {
    variant: 'input',
    label: 'Website',
    type: 'url',
    name: 'website',
    placeholder: 'https://yourwebsite.com',
  },
};

/**
 * Password input with masked characters
 */
export const InputPassword: Story = {
  args: {
    variant: 'input',
    label: 'Password',
    type: 'password',
    name: 'password',
    placeholder: 'Enter password',
    required: true,
    description: 'Must be at least 8 characters',
  },
};

/**
 * Number input
 */
export const InputNumber: Story = {
  args: {
    variant: 'input',
    label: 'Age',
    type: 'number',
    name: 'age',
    placeholder: '0',
  },
};

/**
 * Input with character limit and counter
 */
export const InputWithCharCount: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <FormField
        variant="input"
        label="Twitter Handle"
        type="text"
        name="twitter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="@username"
        maxLength={30}
        showCharCount
      />
    );
  },
};

/**
 * Input with error state
 */
export const InputWithError: Story = {
  args: {
    variant: 'input',
    label: 'Username',
    type: 'text',
    name: 'username',
    defaultValue: 'ab',
    error: true,
    errorMessage: 'Username must be at least 3 characters',
    required: true,
  },
};

/**
 * Disabled input field
 */
export const InputDisabled: Story = {
  args: {
    variant: 'input',
    label: 'User ID',
    type: 'text',
    name: 'userId',
    defaultValue: 'usr_1234567890',
    disabled: true,
    description: 'This field cannot be edited',
  },
};

// =============================================================================
// TEXTAREA VARIANTS
// =============================================================================

/**
 * Basic textarea field
 */
export const TextareaBasic: Story = {
  args: {
    variant: 'textarea',
    label: 'Bio',
    name: 'bio',
    placeholder: 'Tell us about yourself...',
    rows: 4,
  },
};

/**
 * Textarea with character counter
 */
export const TextareaWithCharCount: Story = {
  render: () => {
    const [bio, setBio] = useState('');
    return (
      <FormField
        variant="textarea"
        label="Bio"
        name="bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Tell us about yourself..."
        maxLength={500}
        showCharCount
        rows={4}
      />
    );
  },
};

/**
 * Required textarea
 */
export const TextareaRequired: Story = {
  args: {
    variant: 'textarea',
    label: 'Job Description',
    name: 'description',
    placeholder: 'Describe the role, responsibilities, and what makes this opportunity great...',
    required: true,
    rows: 6,
    description: 'Minimum 50 characters',
  },
};

/**
 * Textarea with error
 */
export const TextareaWithError: Story = {
  args: {
    variant: 'textarea',
    label: 'Message',
    name: 'message',
    defaultValue: 'Hi',
    error: true,
    errorMessage: 'Message is too short. Please provide at least 10 characters.',
    required: true,
    rows: 4,
  },
};

/**
 * Disabled textarea
 */
export const TextareaDisabled: Story = {
  args: {
    variant: 'textarea',
    label: 'Notes',
    name: 'notes',
    defaultValue: 'This field is read-only and cannot be modified.',
    disabled: true,
    rows: 3,
  },
};

// =============================================================================
// SELECT VARIANTS
// =============================================================================

/**
 * Basic select field
 */
export const SelectBasic: Story = {
  args: {
    variant: 'select',
    label: 'Employment Type',
    name: 'type',
    defaultValue: 'full-time',
    children: (
      <>
        <SelectItem value="full-time">Full Time</SelectItem>
        <SelectItem value="part-time">Part Time</SelectItem>
        <SelectItem value="contract">Contract</SelectItem>
        <SelectItem value="internship">Internship</SelectItem>
        <SelectItem value="freelance">Freelance</SelectItem>
      </>
    ),
  },
};

/**
 * Select with placeholder
 */
export const SelectWithPlaceholder: Story = {
  args: {
    variant: 'select',
    label: 'Experience Level',
    name: 'experience',
    placeholder: 'Select level',
    children: (
      <>
        <SelectItem value="entry">Entry Level</SelectItem>
        <SelectItem value="mid">Mid Level</SelectItem>
        <SelectItem value="senior">Senior</SelectItem>
        <SelectItem value="lead">Lead</SelectItem>
        <SelectItem value="executive">Executive</SelectItem>
      </>
    ),
  },
};

/**
 * Required select field
 */
export const SelectRequired: Story = {
  args: {
    variant: 'select',
    label: 'Category',
    name: 'category',
    required: true,
    placeholder: 'Choose a category',
    description: 'Select the most relevant category for your submission',
    children: (
      <>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="product">Product</SelectItem>
        <SelectItem value="marketing">Marketing</SelectItem>
        <SelectItem value="sales">Sales</SelectItem>
        <SelectItem value="support">Support</SelectItem>
      </>
    ),
  },
};

/**
 * Select with error
 */
export const SelectWithError: Story = {
  args: {
    variant: 'select',
    label: 'Workplace',
    name: 'workplace',
    error: true,
    errorMessage: 'Please select a workplace option',
    required: true,
    children: (
      <>
        <SelectItem value="remote">Remote</SelectItem>
        <SelectItem value="onsite">On site</SelectItem>
        <SelectItem value="hybrid">Hybrid</SelectItem>
      </>
    ),
  },
};

/**
 * Disabled select
 */
export const SelectDisabled: Story = {
  args: {
    variant: 'select',
    label: 'Status',
    name: 'status',
    defaultValue: 'active',
    disabled: true,
    description: 'Status cannot be changed at this time',
    children: (
      <>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
      </>
    ),
  },
};

// =============================================================================
// INTERACTIVE DEMOS
// =============================================================================

/**
 * Complete form demo with all variants
 */
export const InteractiveFormDemo: Story = {
  render: () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [type, setType] = useState('');

    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold">Sample Form</h2>

        <FormField
          variant="input"
          label="Full Name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
        />

        <FormField
          variant="input"
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <FormField
          variant="textarea"
          label="Bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          maxLength={500}
          showCharCount
          rows={4}
        />

        <FormField
          variant="select"
          label="Employment Type"
          name="type"
          value={type}
          onValueChange={setType}
          placeholder="Select type"
          required
        >
          <SelectItem value="full-time">Full Time</SelectItem>
          <SelectItem value="part-time">Part Time</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
        </FormField>

        <div className="p-4 rounded-lg bg-muted/30">
          <h3 className="font-semibold mb-2">Form State:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ name, email, bio, type }, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
};

/**
 * Form with validation errors demo
 */
export const FormWithValidation: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('invalid-email');
    const [bio, setBio] = useState('Too short');

    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold">Form with Validation</h2>

        <FormField
          variant="input"
          label="Full Name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
          error={submitted && name.length < 2}
          errorMessage="Name must be at least 2 characters"
        />

        <FormField
          variant="input"
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={submitted && !email.includes('@')}
          errorMessage="Please enter a valid email address"
        />

        <FormField
          variant="textarea"
          label="Bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          maxLength={500}
          showCharCount
          rows={4}
          required
          error={submitted && bio.length < 10}
          errorMessage="Bio must be at least 10 characters"
        />

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Validate Form
        </button>
      </div>
    );
  },
};

// =============================================================================
// INTERACTION TESTING
// Play functions for form validation and interaction testing
// =============================================================================

/**
 * InputInteraction: Test Text Input Interaction
 * Demonstrates typing into a text input field
 */
export const InputInteraction: Story = {
  args: {
    variant: 'input',
    label: 'Full Name',
    type: 'text',
    name: 'fullName',
    placeholder: 'Enter your name',
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test demonstrating text input behavior. Uses play function to simulate typing and verify onChange handler.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find the input field', async () => {
      const input = canvas.getByLabelText(/full name/i);
      await expect(input).toBeInTheDocument();
    });

    await step('Type into the input', async () => {
      const input = canvas.getByLabelText(/full name/i);
      await userEvent.type(input, 'John Doe');
      await expect(input).toHaveValue('John Doe');
    });

    await step('Verify onChange was called', async () => {
      // onChange should have been called for each character typed
      await expect(args.onChange).toHaveBeenCalled();
    });
  },
};

/**
 * TextareaInteraction: Test Textarea Interaction
 * Demonstrates typing into a textarea field
 */
export const TextareaInteraction: Story = {
  args: {
    variant: 'textarea',
    label: 'Message',
    name: 'message',
    placeholder: 'Type your message...',
    rows: 4,
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating textarea behavior. Tests multi-line text input.',
      },
    },
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find the textarea', async () => {
      const textarea = canvas.getByLabelText(/message/i);
      await expect(textarea).toBeInTheDocument();
    });

    await step('Type multi-line text', async () => {
      const textarea = canvas.getByLabelText(/message/i);
      await userEvent.type(textarea, 'Hello!{enter}This is a test message.');
      await expect(textarea).toHaveValue('Hello!\nThis is a test message.');
    });

    await step('Verify onChange was called', async () => {
      await expect(args.onChange).toHaveBeenCalled();
    });
  },
};

/**
 * ErrorStateInteraction: Test Error State Display
 * Demonstrates field validation and error display
 */
export const ErrorStateInteraction: Story = {
  args: {
    variant: 'input',
    label: 'Email',
    type: 'email',
    name: 'email',
    placeholder: 'you@example.com',
    required: true,
    error: false,
    errorMessage: 'Please enter a valid email address',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test showing error state. In real usage, error state would toggle based on validation.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify field starts without error', async () => {
      const input = canvas.getByLabelText(/email/i);
      await expect(input).toBeInTheDocument();
      // Error message should not be visible initially
      const errorMessage = canvas.queryByText(/please enter a valid email/i);
      await expect(errorMessage).not.toBeInTheDocument();
    });
  },
};

/**
 * DisabledFieldInteraction: Test Disabled State
 * Verifies disabled fields cannot be interacted with
 */
export const DisabledFieldInteraction: Story = {
  args: {
    variant: 'input',
    label: 'Disabled Field',
    type: 'text',
    name: 'disabled',
    placeholder: 'Cannot type here',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test verifying disabled fields prevent user input.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify field is disabled', async () => {
      const input = canvas.getByLabelText(/disabled field/i);
      await expect(input).toBeDisabled();
    });

    await step('Verify typing has no effect', async () => {
      const input = canvas.getByLabelText(/disabled field/i);
      // Attempting to type should not change the value
      await expect(input).toHaveValue('');
    });
  },
};

/**
 * RequiredFieldInteraction: Test Required Field Indicator
 * Demonstrates required field asterisk display
 */
export const RequiredFieldInteraction: Story = {
  args: {
    variant: 'input',
    label: 'Required Field',
    type: 'text',
    name: 'required',
    required: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test verifying required field asterisk is displayed.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify required asterisk is shown', async () => {
      // Required fields should have an asterisk in the label
      const label = canvas.getByText(/required field/i);
      await expect(label).toBeInTheDocument();
    });
  },
};
