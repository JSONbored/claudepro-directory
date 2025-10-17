'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { PostCopyEmailModal } from './post-copy-email-modal';

const meta = {
  title: 'Shared/PostCopyEmailModal',
  component: PostCopyEmailModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal that appears after users copy content, prompting for email subscription. Features analytics tracking, localStorage persistence, and conversion attribution. Integrates with newsletter system and tracks copy context.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether modal is open',
    },
    onOpenChange: {
      control: false,
      description: 'Callback when modal open state changes',
    },
    copyType: {
      control: 'select',
      options: ['llmstxt', 'markdown', 'code', 'link'],
      description: 'Type of content that was copied',
    },
    category: {
      control: 'select',
      options: ['agents', 'mcp', 'commands', 'rules', 'hooks', 'guides'],
      description: 'Content category',
    },
    slug: {
      control: 'text',
      description: 'Content slug identifier',
    },
    referrer: {
      control: 'text',
      description: 'Optional referrer URL',
    },
  },
} satisfies Meta<typeof PostCopyEmailModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive demo with trigger button
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Post-Copy Email Capture</h2>
          <p className="text-muted-foreground">
            Click the button to simulate a copy action and see the modal.
          </p>
          <Button onClick={() => setIsOpen(true)}>Trigger Modal</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="markdown"
          category="agents"
          slug="example-agent"
        />
      </div>
    );
  },
};

/**
 * After markdown copy
 */
export const AfterMarkdownCopy: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Markdown Copy</h2>
          <p className="text-muted-foreground">
            Modal triggered after downloading markdown content.
          </p>
          <Button onClick={() => setIsOpen(true)}>Download Markdown</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="markdown"
          category="agents"
          slug="code-review-assistant"
          referrer="/agents"
        />
      </div>
    );
  },
};

/**
 * After code copy
 */
export const AfterCodeCopy: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Code Copy</h2>
          <p className="text-muted-foreground">Modal triggered after copying code snippet.</p>
          <div className="p-4 bg-muted rounded-md font-mono text-sm">
            <code>const example = "code";</code>
          </div>
          <Button onClick={() => setIsOpen(true)}>Copy Code</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="code"
          category="guides"
          slug="api-integration"
        />
      </div>
    );
  },
};

/**
 * After link copy
 */
export const AfterLinkCopy: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Link Copy</h2>
          <p className="text-muted-foreground">Modal triggered after copying page link.</p>
          <Button onClick={() => setIsOpen(true)}>Copy Link</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="link"
          category="mcp"
          slug="github-server"
          referrer="/mcp"
        />
      </div>
    );
  },
};

/**
 * After llmstxt copy
 */
export const AfterLlmsTxtCopy: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">llms.txt Copy</h2>
          <p className="text-muted-foreground">Modal triggered after copying llms.txt content.</p>
          <Button onClick={() => setIsOpen(true)}>Copy llms.txt</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="llmstxt"
          category="commands"
          slug="test-generator"
        />
      </div>
    );
  },
};

/**
 * MCP category context
 */
export const McpContext: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">MCP Server Page</h2>
          <p className="text-muted-foreground">Modal with MCP category context.</p>
          <Button onClick={() => setIsOpen(true)}>Copy Configuration</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="markdown"
          category="mcp"
          slug="filesystem-server"
          referrer="/mcp/filesystem-server"
        />
      </div>
    );
  },
};

/**
 * Commands category context
 */
export const CommandsContext: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Command Page</h2>
          <p className="text-muted-foreground">Modal with commands category context.</p>
          <Button onClick={() => setIsOpen(true)}>Copy Command</Button>
        </div>
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="code"
          category="commands"
          slug="run-tests"
        />
      </div>
    );
  },
};

/**
 * Without category/slug
 */
export const WithoutContext: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Generic Copy</h2>
          <p className="text-muted-foreground">Modal without specific content context.</p>
          <Button onClick={() => setIsOpen(true)}>Copy Content</Button>
        </div>
        <PostCopyEmailModal open={isOpen} onOpenChange={setIsOpen} copyType="code" />
      </div>
    );
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="p-4">
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={setIsOpen}
          copyType="markdown"
          category="agents"
          slug="example"
        />
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * User flow simulation
 */
export const UserFlow: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-2xl font-bold mb-4">User Journey</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">User views content</p>
                  <p className="text-sm text-muted-foreground">Reading an agent configuration</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">User copies content</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setStep(2);
                      setTimeout(() => {
                        setStep(3);
                        setIsOpen(true);
                      }, 500);
                    }}
                    disabled={step >= 2}
                  >
                    Copy Configuration
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Email modal appears</p>
                  <p className="text-sm text-muted-foreground">
                    Opportunity to subscribe for more content
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setTimeout(() => setStep(1), 1000);
            }
          }}
          copyType="markdown"
          category="agents"
          slug="example-agent"
        />
      </div>
    );
  },
};

/**
 * All copy types showcase
 */
export const AllCopyTypes: Story = {
  render: () => {
    const [openType, setOpenType] = useState<'markdown' | 'code' | 'link' | 'llmstxt' | null>(null);

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">All Copy Types</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => setOpenType('markdown')} variant="outline">
            Markdown Copy
          </Button>
          <Button onClick={() => setOpenType('code')} variant="outline">
            Code Copy
          </Button>
          <Button onClick={() => setOpenType('link')} variant="outline">
            Link Copy
          </Button>
          <Button onClick={() => setOpenType('llmstxt')} variant="outline">
            llms.txt Copy
          </Button>
        </div>

        {openType && (
          <PostCopyEmailModal
            open={true}
            onOpenChange={() => setOpenType(null)}
            copyType={openType}
            category="agents"
            slug="example"
          />
        )}
      </div>
    );
  },
};
