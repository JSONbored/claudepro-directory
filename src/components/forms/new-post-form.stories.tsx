'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { NewPostForm } from './new-post-form';

/**
 * NewPostForm Component Stories
 *
 * Simple form for creating new posts/discussions.
 * Handles title, URL, and content fields with validation.
 *
 * Features:
 * - Title field (required, max 300 chars)
 * - URL field (optional, type="url" validation)
 * - Content field (optional, textarea, max 5000 chars)
 * - Submit button with loading state
 * - Cancel button linking to board
 * - useTransition for pending state
 * - Toast notifications on error
 * - Card layout with header/content
 * - Accessible form fields via FormField component
 *
 * Component: src/components/forms/new-post-form.tsx (83 LOC)
 * Used in: Post creation pages
 * Dependencies: FormField, Button, Card primitives
 *
 * Props:
 * ```ts
 * interface NewPostFormProps {
 *   onSubmit: (formData: FormData) => Promise<void>;
 * }
 * ```
 *
 * Form Fields:
 * 1. **Title** (required):
 *    - Input field
 *    - Max 300 characters
 *    - Placeholder: "What's this about?"
 *
 * 2. **URL** (optional):
 *    - Input field with type="url"
 *    - Placeholder: "https://example.com/article"
 *    - Description: "Share a link to an article, project, or resource"
 *
 * 3. **Content** (optional):
 *    - Textarea field
 *    - 8 rows
 *    - Max 5000 characters
 *    - Placeholder: "Share your thoughts, ask a question, or provide context..."
 *
 * Submit Flow:
 * 1. User fills form and clicks "Create Post"
 * 2. handleSubmit prevents default, starts transition
 * 3. FormData created from form
 * 4. onSubmit prop called with FormData
 * 5. If error: toasts.error.fromError() shown
 * 6. Button shows "Creating..." while pending
 *
 * States:
 * - Normal: "Create Post" button enabled
 * - Pending: "Creating..." button disabled, cancel disabled
 *
 * Cancel Flow:
 * - Cancel button links to ROUTES.BOARD
 * - Disabled during pending state
 * - Uses asChild pattern with <a> tag
 *
 * IMPORTANT: This is a controlled form component.
 * onSubmit must be provided and handle form submission.
 * Component does NOT manage form data state internally.
 *
 * @see Research Report: "Form Transition Patterns with React 19"
 */
const meta = {
  title: 'Forms/NewPostForm',
  component: NewPostForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Simple post creation form. Three fields: title (required), URL (optional), content (optional). Uses useTransition for pending state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: {
      action: 'submitted',
      description: 'Async function called with FormData on submit',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-w-[600px] max-w-[800px] p-8 bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NewPostForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Empty Form
 *
 * Shows NewPostForm in default empty state.
 * All fields empty, ready for user input.
 *
 * Usage:
 * ```tsx
 * <NewPostForm onSubmit={async (formData) => {
 *   const title = formData.get('title');
 *   const url = formData.get('url');
 *   const content = formData.get('content');
 *   await createPost({ title, url, content });
 * }} />
 * ```
 */
export const Default: Story = {
  args: {
    onSubmit: async (_formData) => {
      // Intentional no-op for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

/**
 * With Success Submission
 *
 * Demonstrates successful form submission.
 * onSubmit resolves after 1 second delay.
 */
export const SuccessSubmission: Story = {
  args: {
    onSubmit: async (_formData) => {
      // Intentional no-op for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Successful submission. Fill form and submit to see "Creating..." state.',
      },
    },
  },
};

/**
 * With Error Handling
 *
 * Demonstrates error handling with toast notification.
 * onSubmit throws error after delay.
 */
export const WithErrorHandling: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Failed to create post: Network error');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error handling demonstration. Submit form to see error toast (toasts.error.fromError).',
      },
    },
  },
};

/**
 * Title Field Required
 *
 * Shows that title field is required.
 * Browser validation prevents submission without title.
 */
export const TitleRequired: Story = {
  args: {
    onSubmit: async (_formData) => {
      // No-op for Storybook
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Title field is required. Try submitting empty form to see browser validation message.',
      },
    },
  },
};

/**
 * URL Field Optional
 *
 * Shows that URL field is optional.
 * Form can be submitted with just title.
 */
export const URLOptional: Story = {
  args: {
    onSubmit: async (_formData) => {
      // No-op for Storybook
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'URL field is optional. Form valid with just title field filled.',
      },
    },
  },
};

/**
 * Content Field Optional
 *
 * Shows that content field is optional.
 * User can submit with just title and URL.
 */
export const ContentOptional: Story = {
  args: {
    onSubmit: async (_formData) => {
      // No-op for Storybook
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Content field is optional. Valid submission with title + URL only.',
      },
    },
  },
};

/**
 * URL Validation
 *
 * Shows URL field type="url" validation.
 * Browser validates URL format.
 */
export const URLValidation: Story = {
  args: {
    onSubmit: async (_formData) => {
      // No-op for Storybook
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'URL field has type="url" validation. Try entering invalid URL (e.g., "not-a-url") to see browser validation.',
      },
    },
  },
};

/**
 * Title Max Length
 *
 * Shows title field has maxLength={300}.
 * Browser enforces character limit.
 */
export const TitleMaxLength: Story = {
  args: {
    onSubmit: async (formData) => {
      const _title = formData.get('title') as string;
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Title field has maxLength={300}. Browser prevents typing beyond limit.',
      },
    },
  },
};

/**
 * Content Max Length
 *
 * Shows content field has maxLength={5000}.
 * Browser enforces character limit.
 */
export const ContentMaxLength: Story = {
  args: {
    onSubmit: async (formData) => {
      const _content = formData.get('content') as string;
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Content field has maxLength={5000}. Browser prevents typing beyond limit.',
      },
    },
  },
};

/**
 * Pending State
 *
 * Shows form in pending state during submission.
 * Submit button shows "Creating..." and is disabled.
 * Cancel button also disabled.
 */
export const PendingState: Story = {
  args: {
    onSubmit: async () => {
      // Long delay to see pending state
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pending state during submission. Fill form and submit to see "Creating..." button and disabled state.',
      },
    },
  },
};

/**
 * Cancel Button
 *
 * Shows cancel button linking to board.
 * Uses ROUTES.BOARD constant.
 * Disabled during pending state.
 */
export const CancelButton: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Cancel button links to board page. Disabled during form submission.',
      },
    },
  },
};

/**
 * Card Layout
 *
 * Shows form using Card component layout.
 * - CardHeader with title and description
 * - CardContent with form fields
 */
export const CardLayout: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form uses Card layout. CardHeader shows "Post Details" title and description about URL/content options.',
      },
    },
  },
};

/**
 * FormField Component Integration
 *
 * Shows integration with FormField utility component.
 * Each field uses FormField with variant, label, name, etc.
 *
 * FormField variants:
 * - input (title, URL)
 * - textarea (content)
 */
export const FormFieldIntegration: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses FormField component for all fields. Provides consistent styling, labels, descriptions, validation.',
      },
    },
  },
};

/**
 * Accessibility
 *
 * Form is fully accessible:
 * - Labels associated with inputs
 * - Required fields marked
 * - Descriptive placeholders
 * - Button states communicated
 * - Keyboard navigation
 */
export const Accessibility: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully accessible form. Labels, required attributes, placeholders, keyboard navigation all present.',
      },
    },
  },
};

/**
 * useTransition Hook
 *
 * Demonstrates React 19 useTransition hook usage.
 * Provides isPending state for UI feedback.
 *
 * Code:
 * ```ts
 * const [isPending, startTransition] = useTransition();
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   startTransition(async () => {
 *     await onSubmit(new FormData(e.currentTarget));
 *   });
 * };
 * ```
 */
export const UseTransitionHook: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Uses React 19 useTransition hook. isPending controls button text and disabled state.',
      },
    },
  },
};

/**
 * Toast Error Notifications
 *
 * Shows toast notification on submission error.
 * Uses toasts.error.fromError() utility.
 */
export const ToastErrorNotifications: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      throw new Error('Database connection failed');
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error toast shown on submission failure. Uses toasts.error.fromError(error, "Failed to create post").',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Card Header Test
 * Tests card header contains title and description
 */
export const CardHeaderTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests CardHeader renders with correct title and description.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify card title is present', async () => {
      const title = canvas.getByText('Post Details');
      await expect(title).toBeInTheDocument();
    });

    await step('Verify card description is present', async () => {
      const description = canvas.getByText(/Include either a URL, text content, or both/i);
      await expect(description).toBeInTheDocument();
    });
  },
};

/**
 * Title Field Test
 * Tests title input field is present and required
 */
export const TitleFieldTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests title field is present, required, and has correct attributes.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify title field exists', async () => {
      const titleInput = canvas.getByLabelText(/Title/i);
      await expect(titleInput).toBeInTheDocument();
    });

    await step('Verify title field is required', async () => {
      const titleInput = canvas.getByLabelText(/Title/i);
      await expect(titleInput).toBeRequired();
    });

    await step('Verify title field has placeholder', async () => {
      const titleInput = canvas.getByPlaceholderText(/What's this about/i);
      await expect(titleInput).toBeInTheDocument();
    });
  },
};

/**
 * URL Field Test
 * Tests URL input field is present and optional
 */
export const URLFieldTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests URL field is present, optional, and has type="url".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify URL field exists', async () => {
      const urlInput = canvas.getByLabelText(/URL \(optional\)/i);
      await expect(urlInput).toBeInTheDocument();
    });

    await step('Verify URL field is not required', async () => {
      const urlInput = canvas.getByLabelText(/URL \(optional\)/i);
      await expect(urlInput).not.toBeRequired();
    });

    await step('Verify URL field has correct type', async () => {
      const urlInput = canvas.getByLabelText(/URL \(optional\)/i);
      await expect(urlInput.getAttribute('type')).toBe('url');
    });
  },
};

/**
 * Content Field Test
 * Tests content textarea field is present and optional
 */
export const ContentFieldTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests content textarea is present, optional, and has correct attributes.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify content field exists', async () => {
      const contentTextarea = canvas.getByLabelText(/Content \(optional\)/i);
      await expect(contentTextarea).toBeInTheDocument();
    });

    await step('Verify content field is not required', async () => {
      const contentTextarea = canvas.getByLabelText(/Content \(optional\)/i);
      await expect(contentTextarea).not.toBeRequired();
    });

    await step('Verify content field is textarea', async () => {
      const contentTextarea = canvas.getByLabelText(/Content \(optional\)/i);
      await expect(contentTextarea.tagName).toBe('TEXTAREA');
    });
  },
};

/**
 * Submit Button Test
 * Tests submit button is present and enabled
 */
export const SubmitButtonTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests submit button is present with correct text.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify submit button exists', async () => {
      const submitButton = canvas.getByRole('button', { name: /Create Post/i });
      await expect(submitButton).toBeInTheDocument();
    });

    await step('Verify submit button type is submit', async () => {
      const submitButton = canvas.getByRole('button', { name: /Create Post/i });
      await expect(submitButton.getAttribute('type')).toBe('submit');
    });
  },
};

/**
 * Cancel Button Test
 * Tests cancel button is present and links to board
 */
export const CancelButtonTest: Story = {
  args: {
    onSubmit: async () => {
      // Intentional no-op for play function test
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests cancel button is present and links to board route.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify cancel button exists', async () => {
      const cancelButton = canvas.getByRole('link', { name: /Cancel/i });
      await expect(cancelButton).toBeInTheDocument();
    });

    await step('Verify cancel button links to board', async () => {
      const cancelButton = canvas.getByRole('link', { name: /Cancel/i });
      await expect(cancelButton.getAttribute('href')).toBe('/board');
    });
  },
};
