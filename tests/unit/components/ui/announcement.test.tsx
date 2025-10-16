/**
 * Announcement Component Tests
 *
 * Tests the compound Announcement components (Announcement, AnnouncementTag, AnnouncementTitle)
 * that are used to create attention-grabbing site-wide notifications.
 *
 * **Why Test This:**
 * - User-facing notification components
 * - Compound component architecture must work correctly
 * - Variant styling must apply properly
 * - Accessibility attributes must be present
 * - Themed styling must work
 *
 * **Test Coverage:**
 * - Rendering with different variants
 * - Themed styling
 * - Compound component composition
 * - Accessibility
 * - Custom className merging
 *
 * @see src/components/ui/announcement.tsx
 */

import { describe, expect, it } from 'vitest';
import { Announcement, AnnouncementTag, AnnouncementTitle } from '@/src/components/ui/announcement';
import { render, screen } from '@/tests/utils/test-utils';

describe('Announcement Component', () => {
  describe('Basic Rendering', () => {
    it('renders as output element by default', () => {
      render(<Announcement>Test announcement</Announcement>);
      const element = screen.getByText('Test announcement');
      expect(element.tagName).toBe('OUTPUT');
    });

    it('renders children correctly', () => {
      render(<Announcement>Test Content</Announcement>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('forwards className prop', () => {
      render(<Announcement className="custom-class">Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('custom-class');
    });

    it('merges custom className with base classes', () => {
      render(<Announcement className="custom-class">Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveClass('inline-flex');
    });
  });

  describe('Variant Prop', () => {
    it('renders default variant', () => {
      render(<Announcement variant="default">Default</Announcement>);
      const element = screen.getByText('Default');
      expect(element).toHaveClass('bg-accent');
      expect(element).toHaveClass('text-accent-foreground');
    });

    it('renders outline variant', () => {
      render(<Announcement variant="outline">Outline</Announcement>);
      const element = screen.getByText('Outline');
      expect(element).toHaveClass('border');
    });

    it('renders secondary variant', () => {
      render(<Announcement variant="secondary">Secondary</Announcement>);
      const element = screen.getByText('Secondary');
      expect(element).toHaveClass('bg-secondary');
      expect(element).toHaveClass('text-secondary-foreground');
    });

    it('renders destructive variant', () => {
      render(<Announcement variant="destructive">Destructive</Announcement>);
      const element = screen.getByText('Destructive');
      expect(element).toHaveClass('bg-destructive');
      expect(element).toHaveClass('text-destructive-foreground');
    });

    it('defaults to outline variant when not specified', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('border');
    });
  });

  describe('Themed Prop', () => {
    it('applies themed styles when themed is true', () => {
      render(<Announcement themed={true}>Themed</Announcement>);
      const element = screen.getByText('Themed');
      expect(element).toHaveClass('shadow-sm');
      expect(element).toHaveClass('hover:shadow-md');
    });

    it('does not apply themed styles when themed is false', () => {
      render(<Announcement themed={false}>Not Themed</Announcement>);
      const element = screen.getByText('Not Themed');
      // Should not have shadow classes
      const classNames = element.className;
      expect(classNames.includes('shadow-sm')).toBe(false);
    });

    it('defaults to not themed when prop is omitted', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      const classNames = element.className;
      expect(classNames.includes('shadow-sm')).toBe(false);
    });

    it('applies scale hover effects when themed', () => {
      render(<Announcement themed={true}>Themed</Announcement>);
      const element = screen.getByText('Themed');
      expect(element).toHaveClass('hover:scale-[1.02]');
      expect(element).toHaveClass('active:scale-[0.98]');
    });
  });

  describe('Base Classes', () => {
    it('includes layout classes', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('inline-flex');
      expect(element).toHaveClass('items-center');
      expect(element).toHaveClass('gap-2');
    });

    it('includes sizing classes', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('px-3');
      expect(element).toHaveClass('py-1.5');
    });

    it('includes typography classes', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('text-sm');
    });

    it('includes transition classes', () => {
      render(<Announcement>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveClass('transition-all');
      expect(element).toHaveClass('duration-200');
    });
  });

  describe('HTML Attributes', () => {
    it('forwards data attributes', () => {
      render(<Announcement data-testid="custom-announcement">Content</Announcement>);
      const element = screen.getByTestId('custom-announcement');
      expect(element).toBeInTheDocument();
    });

    it('forwards id attribute', () => {
      // Generate unique ID for testing (in real apps, use useId())
      const uniqueId = `announcement-${Math.random().toString(36).substring(7)}`;
      render(<Announcement id={uniqueId}>Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveAttribute('id', uniqueId);
    });

    it('forwards aria attributes', () => {
      render(<Announcement aria-label="Announcement">Content</Announcement>);
      const element = screen.getByText('Content');
      expect(element).toHaveAttribute('aria-label', 'Announcement');
    });
  });

  describe('Compound Component Usage', () => {
    it('renders with AnnouncementTag child', () => {
      render(
        <Announcement>
          <AnnouncementTag>New</AnnouncementTag>
          Content
        </Announcement>
      );
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with AnnouncementTitle child', () => {
      render(
        <Announcement>
          <AnnouncementTitle>Title Text</AnnouncementTitle>
        </Announcement>
      );
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('renders full compound structure', () => {
      render(
        <Announcement variant="default" themed>
          <AnnouncementTag>New</AnnouncementTag>
          <AnnouncementTitle>Introducing Feature X</AnnouncementTitle>
        </Announcement>
      );
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Introducing Feature X')).toBeInTheDocument();
    });
  });
});

describe('AnnouncementTag Component', () => {
  describe('Basic Rendering', () => {
    it('renders as span element', () => {
      render(<AnnouncementTag>New</AnnouncementTag>);
      const element = screen.getByText('New');
      expect(element.tagName).toBe('SPAN');
    });

    it('renders children correctly', () => {
      render(<AnnouncementTag>Beta</AnnouncementTag>);
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('forwards className prop', () => {
      render(<AnnouncementTag className="custom-tag">Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('custom-tag');
    });
  });

  describe('Styling', () => {
    it('includes layout classes', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('inline-flex');
      expect(element).toHaveClass('items-center');
      expect(element).toHaveClass('justify-center');
    });

    it('includes sizing classes', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('px-1.5');
      expect(element).toHaveClass('py-0.5');
    });

    it('includes typography classes', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('text-[10px]');
      expect(element).toHaveClass('font-semibold');
      expect(element).toHaveClass('uppercase');
      expect(element).toHaveClass('tracking-wider');
    });

    it('includes border radius', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('rounded');
    });

    it('includes flex-shrink-0 for consistent sizing', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('flex-shrink-0');
    });

    it('includes background and text color classes', () => {
      render(<AnnouncementTag>Tag</AnnouncementTag>);
      const element = screen.getByText('Tag');
      expect(element).toHaveClass('bg-accent/20');
      expect(element).toHaveClass('text-accent-foreground');
    });
  });

  describe('Content', () => {
    it('renders uppercase text correctly', () => {
      render(<AnnouncementTag>new</AnnouncementTag>);
      const element = screen.getByText('new');
      // Check that uppercase class is applied (CSS handles the transformation)
      expect(element).toHaveClass('uppercase');
    });

    it('handles short text', () => {
      render(<AnnouncementTag>!</AnnouncementTag>);
      expect(screen.getByText('!')).toBeInTheDocument();
    });

    it('handles longer text', () => {
      render(<AnnouncementTag>Maintenance</AnnouncementTag>);
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });
  });
});

describe('AnnouncementTitle Component', () => {
  describe('Basic Rendering', () => {
    it('renders as span element', () => {
      render(<AnnouncementTitle>Title</AnnouncementTitle>);
      const element = screen.getByText('Title');
      expect(element.tagName).toBe('SPAN');
    });

    it('renders children correctly', () => {
      render(<AnnouncementTitle>Announcement Title</AnnouncementTitle>);
      expect(screen.getByText('Announcement Title')).toBeInTheDocument();
    });

    it('forwards className prop', () => {
      render(<AnnouncementTitle className="custom-title">Title</AnnouncementTitle>);
      const element = screen.getByText('Title');
      expect(element).toHaveClass('custom-title');
    });
  });

  describe('Styling', () => {
    it('includes typography classes', () => {
      render(<AnnouncementTitle>Title</AnnouncementTitle>);
      const element = screen.getByText('Title');
      expect(element).toHaveClass('text-sm');
      expect(element).toHaveClass('font-medium');
    });

    it('includes layout classes', () => {
      render(<AnnouncementTitle>Title</AnnouncementTitle>);
      const element = screen.getByText('Title');
      expect(element).toHaveClass('inline-flex');
      expect(element).toHaveClass('items-center');
      expect(element).toHaveClass('gap-1');
    });

    it('includes responsive truncate class', () => {
      render(<AnnouncementTitle>Title</AnnouncementTitle>);
      const element = screen.getByText('Title');
      expect(element).toHaveClass('truncate');
    });
  });

  describe('Content', () => {
    it('renders with icon children', () => {
      render(
        <AnnouncementTitle>
          Title text
          <svg data-testid="icon">
            <path d="M0 0" />
          </svg>
        </AnnouncementTitle>
      );
      expect(screen.getByText('Title text')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders as link wrapper', () => {
      render(
        <AnnouncementTitle>
          <a href="/test">Link Title</a>
        </AnnouncementTitle>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveTextContent('Link Title');
    });

    it('handles long text with truncate', () => {
      const longText = 'This is a very long announcement title that should be truncated';
      render(<AnnouncementTitle>{longText}</AnnouncementTitle>);
      const element = screen.getByText(longText);
      expect(element).toHaveClass('truncate');
    });
  });
});

describe('Compound Component Integration', () => {
  it('all components work together', () => {
    render(
      <Announcement variant="default" themed>
        <AnnouncementTag>New</AnnouncementTag>
        <AnnouncementTitle>
          Feature Launch
          <span>→</span>
        </AnnouncementTitle>
      </Announcement>
    );

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Feature Launch')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('maintains gap spacing between children', () => {
    render(
      <Announcement>
        <AnnouncementTag>Tag</AnnouncementTag>
        <AnnouncementTitle>Title</AnnouncementTitle>
      </Announcement>
    );

    const announcement = screen.getByText('Tag').parentElement;
    expect(announcement).toHaveClass('gap-2');
  });

  it('tag does not shrink when title is long', () => {
    render(
      <Announcement>
        <AnnouncementTag>New</AnnouncementTag>
        <AnnouncementTitle>
          This is a very long title that might cause layout issues
        </AnnouncementTitle>
      </Announcement>
    );

    const tag = screen.getByText('New');
    expect(tag).toHaveClass('flex-shrink-0');
  });
});

describe('Edge Cases', () => {
  it('renders with empty children', () => {
    render(<Announcement>{''}</Announcement>);
    const element = document.querySelector('output');
    expect(element).toBeInTheDocument();
  });

  it('renders with multiple text nodes', () => {
    render(
      <Announcement>
        Text 1<span>Text 2</span>Text 3
      </Announcement>
    );
    // Query the output element directly since text is split across nodes
    const element = document.querySelector('output');
    expect(element).toBeInTheDocument();
    expect(element?.textContent).toContain('Text 1');
    expect(screen.getByText('Text 2')).toBeInTheDocument();
    expect(element?.textContent).toContain('Text 3');
  });

  it('handles undefined variant gracefully', () => {
    render(<Announcement variant={undefined}>Content</Announcement>);
    const element = screen.getByText('Content');
    // Should fall back to default (outline)
    expect(element).toHaveClass('border');
  });

  it('handles undefined themed gracefully', () => {
    render(<Announcement themed={undefined}>Content</Announcement>);
    const element = screen.getByText('Content');
    expect(element).toBeInTheDocument();
  });
});
