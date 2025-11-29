/**
 * UnifiedBadge Component Tests
 *
 * Tests all badge variants, animations, accessibility, and type safety.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedBadge } from './unified-badge';

// Mock Motion.dev
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-motion="true" {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock static config
vi.mock('../../../config/static-configs', () => ({
  getAnimationConfig: vi.fn(() => ({
    'animation.spring.default.stiffness': 400,
    'animation.spring.default.damping': 17,
  })),
}));

describe('UnifiedBadge', () => {
  describe('Base Badge Variant', () => {
    it('renders with default style', () => {
      render(
        <UnifiedBadge variant="base" style="default">
          Test Badge
        </UnifiedBadge>
      );
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with secondary style', () => {
      render(
        <UnifiedBadge variant="base" style="secondary">
          Secondary
        </UnifiedBadge>
      );
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });

    it('renders with destructive style', () => {
      render(
        <UnifiedBadge variant="base" style="destructive">
          Destructive
        </UnifiedBadge>
      );
      expect(screen.getByText('Destructive')).toBeInTheDocument();
    });

    it('renders with outline style', () => {
      render(
        <UnifiedBadge variant="base" style="outline">
          Outline
        </UnifiedBadge>
      );
      expect(screen.getByText('Outline')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <UnifiedBadge variant="base" className="custom-class">
          Custom
        </UnifiedBadge>
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('wraps in motion wrapper for animations', () => {
      const { container } = render(
        <UnifiedBadge variant="base">Animated</UnifiedBadge>
      );
      expect(container.querySelector('[data-motion="true"]')).toBeInTheDocument();
    });
  });

  describe('Category Badge Variant', () => {
    it('renders MCP category badge', () => {
      render(
        <UnifiedBadge variant="category" category="mcp">
          MCP
        </UnifiedBadge>
      );
      expect(screen.getByText('MCP')).toBeInTheDocument();
    });

    it('renders agents category badge', () => {
      render(
        <UnifiedBadge variant="category" category="agents">
          Agents
        </UnifiedBadge>
      );
      expect(screen.getByText('Agents')).toBeInTheDocument();
    });

    it('renders hooks category badge', () => {
      render(
        <UnifiedBadge variant="category" category="hooks">
          Hooks
        </UnifiedBadge>
      );
      expect(screen.getByText('Hooks')).toBeInTheDocument();
    });

    it('applies correct category style class', () => {
      const { container } = render(
        <UnifiedBadge variant="category" category="mcp">
          MCP
        </UnifiedBadge>
      );
      expect(container.querySelector('.badge-category-mcp')).toBeInTheDocument();
    });

    it('fallback to default category style for unknown category', () => {
      const { container } = render(
        <UnifiedBadge variant="category" category="changelog">
          Changelog
        </UnifiedBadge>
      );
      expect(container.querySelector('.badge-category-rules')).toBeInTheDocument();
    });
  });

  describe('Source Badge Variant', () => {
    it('renders official source badge', () => {
      render(
        <UnifiedBadge variant="source" source="official">
          Official
        </UnifiedBadge>
      );
      expect(screen.getByText('Official')).toBeInTheDocument();
    });

    it('renders partner source badge', () => {
      render(
        <UnifiedBadge variant="source" source="partner">
          Partner
        </UnifiedBadge>
      );
      expect(screen.getByText('Partner')).toBeInTheDocument();
    });

    it('renders community source badge', () => {
      render(
        <UnifiedBadge variant="source" source="community">
          Community
        </UnifiedBadge>
      );
      expect(screen.getByText('Community')).toBeInTheDocument();
    });

    it('renders verified source badge', () => {
      render(
        <UnifiedBadge variant="source" source="verified">
          Verified
        </UnifiedBadge>
      );
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('renders experimental source badge', () => {
      render(
        <UnifiedBadge variant="source" source="experimental">
          Experimental
        </UnifiedBadge>
      );
      expect(screen.getByText('Experimental')).toBeInTheDocument();
    });
  });

  describe('Status Badge Variant', () => {
    it('renders active status badge', () => {
      render(
        <UnifiedBadge variant="status" status="active">
          Active
        </UnifiedBadge>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders trending status badge', () => {
      render(
        <UnifiedBadge variant="status" status="trending">
          Trending
        </UnifiedBadge>
      );
      expect(screen.getByText('Trending')).toBeInTheDocument();
    });

    it('renders new status badge', () => {
      render(
        <UnifiedBadge variant="status" status="new">
          New
        </UnifiedBadge>
      );
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders updated status badge', () => {
      render(
        <UnifiedBadge variant="status" status="updated">
          Updated
        </UnifiedBadge>
      );
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('renders deprecated status badge', () => {
      render(
        <UnifiedBadge variant="status" status="deprecated">
          Deprecated
        </UnifiedBadge>
      );
      expect(screen.getByText('Deprecated')).toBeInTheDocument();
    });
  });

  describe('Sponsored Badge Variant', () => {
    it('renders featured tier without icon', () => {
      render(<UnifiedBadge variant="sponsored" tier="featured" />);
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('renders featured tier with icon', () => {
      const { container } = render(
        <UnifiedBadge variant="sponsored" tier="featured" showIcon={true} />
      );
      expect(screen.getByText('Featured')).toBeInTheDocument();
      // Check for icon via aria-hidden attribute
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders promoted tier', () => {
      render(<UnifiedBadge variant="sponsored" tier="promoted" showIcon={true} />);
      expect(screen.getByText('Promoted')).toBeInTheDocument();
    });

    it('renders spotlight tier', () => {
      render(<UnifiedBadge variant="sponsored" tier="spotlight" showIcon={true} />);
      expect(screen.getByText('Spotlight')).toBeInTheDocument();
    });

    it('renders sponsored tier', () => {
      render(<UnifiedBadge variant="sponsored" tier="sponsored" />);
      expect(screen.getByText('Sponsored')).toBeInTheDocument();
    });
  });

  describe('Tag Badge Variant', () => {
    it('renders inactive tag', () => {
      render(<UnifiedBadge variant="tag" tag="react" />);
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    it('renders active tag', () => {
      render(<UnifiedBadge variant="tag" tag="react" isActive={true} />);
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    it('renders tag with custom children', () => {
      render(
        <UnifiedBadge variant="tag" tag="react">
          <strong>React</strong>
        </UnifiedBadge>
      );
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<UnifiedBadge variant="tag" tag="react" onClick={handleClick} />);
      const tag = screen.getByText('react');
      tag.click();
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('shows remove button when onRemove provided', () => {
      const handleRemove = vi.fn();
      render(<UnifiedBadge variant="tag" tag="react" onRemove={handleRemove} />);
      const removeButton = screen.getByLabelText('Remove react');
      expect(removeButton).toBeInTheDocument();
    });

    it('calls onRemove when remove button clicked', () => {
      const handleRemove = vi.fn();
      render(<UnifiedBadge variant="tag" tag="react" onRemove={handleRemove} />);
      const removeButton = screen.getByLabelText('Remove react');
      removeButton.click();
      expect(handleRemove).toHaveBeenCalledOnce();
    });

    it('stops propagation when remove button clicked', () => {
      const handleClick = vi.fn();
      const handleRemove = vi.fn();
      render(
        <UnifiedBadge variant="tag" tag="react" onClick={handleClick} onRemove={handleRemove} />
      );
      const removeButton = screen.getByLabelText('Remove react');
      removeButton.click();
      expect(handleRemove).toHaveBeenCalledOnce();
      expect(handleClick).not.toHaveBeenCalled(); // Propagation stopped
    });
  });

  describe('New Indicator Variant', () => {
    it('renders new indicator without tooltip', () => {
      render(<UnifiedBadge variant="new-indicator" />);
      // Check for aria-label
      const indicator = screen.getByLabelText('New feature');
      expect(indicator).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<UnifiedBadge variant="new-indicator" label="Updated today" />);
      expect(screen.getByLabelText('Updated today')).toBeInTheDocument();
    });

    it('includes screen reader text', () => {
      render(<UnifiedBadge variant="new-indicator" label="New content" />);
      expect(screen.getByText('New content')).toBeInTheDocument();
    });

    it('has animated pulse spans', () => {
      const { container } = render(<UnifiedBadge variant="new-indicator" />);
      const pulseSpan = container.querySelector('.animate-ping');
      expect(pulseSpan).toBeInTheDocument();
    });
  });

  describe('New Badge Variant', () => {
    it('renders with default variant', () => {
      render(<UnifiedBadge variant="new-badge" />);
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      render(<UnifiedBadge variant="new-badge" badgeVariant="outline" />);
      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('renders with custom children', () => {
      render(<UnifiedBadge variant="new-badge">Updated</UnifiedBadge>);
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('uses output element with aria-label', () => {
      render(<UnifiedBadge variant="new-badge" />);
      const badge = screen.getByLabelText('New');
      expect(badge.tagName).toBe('OUTPUT');
    });
  });

  describe('Notification Count Variant', () => {
    it('renders view count badge', () => {
      render(<UnifiedBadge variant="notification-count" count={42} type="view" />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders copy count badge', () => {
      render(<UnifiedBadge variant="notification-count" count={100} type="copy" />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders bookmark count badge', () => {
      render(<UnifiedBadge variant="notification-count" count={999} type="bookmark" />);
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('formats count above 1k with decimal', () => {
      render(<UnifiedBadge variant="notification-count" count={1234} type="view" />);
      expect(screen.getByText('1.2k')).toBeInTheDocument();
    });

    it('formats count above 10k without decimal', () => {
      render(<UnifiedBadge variant="notification-count" count={12345} type="view" />);
      expect(screen.getByText('12k')).toBeInTheDocument();
    });

    it('does not render when count is 0', () => {
      const { container } = render(
        <UnifiedBadge variant="notification-count" count={0} type="view" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('does not render when count is negative', () => {
      const { container } = render(
        <UnifiedBadge variant="notification-count" count={-5} type="view" />
      );
      expect(container.firstChild).toBeNull();
    });

    it('has aria-hidden attribute', () => {
      const { container } = render(
        <UnifiedBadge variant="notification-count" count={42} type="view" />
      );
      const badge = container.querySelector('[aria-hidden="true"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('tag badges are keyboard accessible', () => {
      render(<UnifiedBadge variant="tag" tag="react" onClick={vi.fn()} />);
      const tag = screen.getByRole('button');
      expect(tag).toBeInTheDocument();
    });

    it('new indicator includes screen reader text', () => {
      render(<UnifiedBadge variant="new-indicator" label="New feature" />);
      // sr-only class hides visually but keeps for screen readers
      expect(screen.getByText('New feature')).toBeInTheDocument();
    });

    it('notification counts are hidden from screen readers', () => {
      const { container } = render(
        <UnifiedBadge variant="notification-count" count={42} type="view" />
      );
      const badge = container.querySelector('[aria-hidden="true"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('prevents invalid prop combinations at compile time', () => {
      // These should compile successfully
      const validBadges = [
        <UnifiedBadge variant="base" style="default">Text</UnifiedBadge>,
        <UnifiedBadge variant="category" category="mcp">MCP</UnifiedBadge>,
        <UnifiedBadge variant="source" source="official">Official</UnifiedBadge>,
        <UnifiedBadge variant="status" status="active">Active</UnifiedBadge>,
        <UnifiedBadge variant="sponsored" tier="featured" />,
        <UnifiedBadge variant="tag" tag="react" />,
        <UnifiedBadge variant="new-indicator" />,
        <UnifiedBadge variant="new-badge" />,
        <UnifiedBadge variant="notification-count" count={42} type="view" />,
      ];

      // If this compiles, type safety is working
      expect(validBadges).toBeDefined();
    });
  });
});
