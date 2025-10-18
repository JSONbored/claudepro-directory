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
// RESPONSIVE VARIANTS
// =============================================================================

/**
 * Mobile viewport demonstration
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  render: () => (
    <div className="space-y-4">
      <FormField
        variant="input"
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        required
      />
      <FormField
        variant="textarea"
        label="Message"
        name="message"
        placeholder="Your message..."
        rows={4}
      />
      <FormField variant="select" label="Priority" name="priority" placeholder="Select priority">
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
      </FormField>
    </div>
  ),
};

/**
 * Tablet viewport demonstration
 */
export const TabletViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        variant="input"
        label="First Name"
        type="text"
        name="firstName"
        placeholder="John"
      />
      <FormField variant="input" label="Last Name" type="text" name="lastName" placeholder="Doe" />
      <div className="col-span-2">
        <FormField
          variant="input"
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="col-span-2">
        <FormField
          variant="textarea"
          label="Bio"
          name="bio"
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>
    </div>
  ),
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
