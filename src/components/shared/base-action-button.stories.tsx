import type { Meta, StoryObj } from '@storybook/react';
import { Copy, Download, Loader2, Share2 } from 'lucide-react';
import {
  BaseActionButton,
  BaseActionButtonCustom,
  BaseActionButtonIcon,
} from './base-action-button';

const meta = {
  title: 'Shared/BaseActionButton',
  component: BaseActionButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Unified action button component with loading, success, and error states. Provides consistent UX for copy, download, and custom actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    loadingLabel: {
      control: 'text',
      description: 'Label shown during loading state',
    },
    successLabel: {
      control: 'text',
      description: 'Label shown after successful action',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size variant',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Button style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether button is disabled',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show icon',
    },
  },
} satisfies Meta<typeof BaseActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default copy button with success animation
 */
export const CopyButton: Story = {
  args: {
    label: 'Copy to Clipboard',
    loadingLabel: 'Copying...',
    successLabel: 'Copied!',
    icon: Copy,
    ariaLabel: 'Copy content to clipboard',
    ariaLabelSuccess: 'Content copied to clipboard',
    componentName: 'CopyButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setSuccess(true);
      showSuccess('Copied!', 'Content ready to paste');
    },
  },
};

/**
 * Download button with longer success duration
 */
export const DownloadButton: Story = {
  args: {
    label: 'Download',
    loadingLabel: 'Downloading...',
    successLabel: 'Downloaded!',
    icon: Download,
    size: 'default',
    variant: 'default',
    ariaLabel: 'Download file',
    ariaLabelSuccess: 'File downloaded',
    componentName: 'DownloadButton',
    successDuration: 3000,
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoading(false);
      setSuccess(true);
      showSuccess('Downloaded!', 'File saved to downloads folder');
    },
  },
};

/**
 * Button with error handling
 */
export const ButtonWithError: Story = {
  args: {
    label: 'Share',
    loadingLabel: 'Sharing...',
    successLabel: 'Shared!',
    icon: Share2,
    variant: 'secondary',
    ariaLabel: 'Share content',
    ariaLabelSuccess: 'Content shared',
    componentName: 'ShareButton',
    onClick: async ({ setLoading, showError, logError }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);

      const error = new Error('Network error: Unable to share');
      logError('Share failed', error);
      showError('Failed to share', 'Please check your network connection');
    },
  },
};

/**
 * Small outline button variant
 */
export const SmallOutline: Story = {
  args: {
    label: 'Copy Code',
    loadingLabel: 'Copying...',
    successLabel: 'Copied!',
    icon: Copy,
    size: 'sm',
    variant: 'outline',
    ariaLabel: 'Copy code snippet',
    ariaLabelSuccess: 'Code snippet copied',
    componentName: 'CopyCodeButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);
      setSuccess(true);
      showSuccess('Copied!');
    },
  },
};

/**
 * Large primary button
 */
export const LargePrimary: Story = {
  args: {
    label: 'Download Now',
    loadingLabel: 'Preparing...',
    successLabel: 'Ready!',
    icon: Download,
    size: 'lg',
    variant: 'default',
    ariaLabel: 'Download file now',
    ariaLabelSuccess: 'File ready for download',
    componentName: 'DownloadNowButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLoading(false);
      setSuccess(true);
      showSuccess('Ready!', 'Your download will begin shortly');
    },
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    label: 'Copy',
    icon: Copy,
    disabled: true,
    ariaLabel: 'Copy content (disabled)',
    ariaLabelSuccess: 'Content copied',
    componentName: 'DisabledButton',
    onClick: async () => {
      // Should not execute
    },
  },
};

/**
 * Button without icon
 */
export const NoIcon: Story = {
  args: {
    label: 'Submit',
    loadingLabel: 'Submitting...',
    successLabel: 'Submitted!',
    icon: Copy, // Required but hidden
    showIcon: false,
    variant: 'default',
    ariaLabel: 'Submit form',
    ariaLabelSuccess: 'Form submitted',
    componentName: 'SubmitButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setSuccess(true);
      showSuccess('Submitted!', 'Your form has been processed');
    },
  },
};

/**
 * Ghost variant button
 */
export const Ghost: Story = {
  args: {
    label: 'Share',
    loadingLabel: 'Sharing...',
    successLabel: 'Shared!',
    icon: Share2,
    variant: 'ghost',
    ariaLabel: 'Share content',
    ariaLabelSuccess: 'Content shared',
    componentName: 'GhostShareButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setSuccess(true);
      showSuccess('Shared!');
    },
  },
};

/**
 * Icon-only button variant
 */
export const IconOnly: StoryObj<typeof BaseActionButtonIcon> = {
  render: (args) => <BaseActionButtonIcon {...args} />,
  args: {
    icon: Copy,
    variant: 'ghost',
    title: 'Copy to clipboard',
    ariaLabel: 'Copy content',
    ariaLabelSuccess: 'Content copied',
    componentName: 'CopyIconButton',
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);
      setSuccess(true);
      showSuccess('Copied!');
    },
  },
};

/**
 * Custom render prop variant
 */
export const CustomContent: StoryObj<typeof BaseActionButtonCustom> = {
  render: (args) => <BaseActionButtonCustom {...args} />,
  args: {
    icon: Share2,
    variant: 'outline',
    ariaLabel: 'Custom share button',
    ariaLabelSuccess: 'Content shared',
    componentName: 'CustomShareButton',
    children: ({ isLoading, isSuccess, icon: Icon }) => (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="font-semibold">{isSuccess ? '✓ Shared!' : 'Share Now'}</span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
    ),
    onClick: async ({ setLoading, setSuccess, showSuccess }) => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setLoading(false);
      setSuccess(true);
      showSuccess('Content shared!', 'Your content is now public');
    },
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <BaseActionButton
          label="Default"
          icon={Copy}
          variant="default"
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          componentName="DefaultButton"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <BaseActionButton
          label="Secondary"
          icon={Copy}
          variant="secondary"
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          componentName="SecondaryButton"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <BaseActionButton
          label="Outline"
          icon={Copy}
          variant="outline"
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          componentName="OutlineButton"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
        <BaseActionButton
          label="Ghost"
          icon={Copy}
          variant="ghost"
          ariaLabel="Copy"
          ariaLabelSuccess="Copied"
          componentName="GhostButton"
          onClick={async ({ setLoading, setSuccess }) => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoading(false);
            setSuccess(true);
          }}
        />
      </div>
    </div>
  ),
};
