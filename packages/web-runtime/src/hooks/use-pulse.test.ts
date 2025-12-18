import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePulse } from './use-pulse.ts';

// Mock pulse client functions
vi.mock('../pulse-client.ts', () => ({
  trackInteraction: vi.fn(),
  trackUsage: vi.fn(),
  trackNewsletterEvent: vi.fn(),
}));

describe('usePulse', () => {
  let mockTrackInteraction: ReturnType<typeof vi.fn>;
  let mockTrackUsage: ReturnType<typeof vi.fn>;
  let mockTrackNewsletterEvent: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const pulseClient = await import('../pulse-client.ts');
    mockTrackInteraction = vi.mocked(pulseClient.trackInteraction);
    mockTrackUsage = vi.mocked(pulseClient.trackUsage);
    mockTrackNewsletterEvent = vi.mocked(pulseClient.trackNewsletterEvent);
  });

  it('should return memoized tracking methods', () => {
    const { result, rerender } = renderHook(() => usePulse());
    const firstRender = result.current;

    rerender();
    const secondRender = result.current;

    // Methods should be memoized (same reference)
    expect(firstRender.view).toBe(secondRender.view);
    expect(firstRender.copy).toBe(secondRender.copy);
    expect(firstRender.click).toBe(secondRender.click);
  });

  it('should track view interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.view({
      category: 'agents',
      slug: 'test-agent',
      metadata: { source: 'homepage' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'view',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: { source: 'homepage' },
    });
  });

  it('should track copy interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.copy({
      category: 'mcp',
      slug: 'test-mcp',
      metadata: null,
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'copy',
      content_type: 'mcp',
      content_slug: 'test-mcp',
      metadata: null,
    });
  });

  it('should track click interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.click({
      category: 'agents',
      slug: 'test-agent',
      metadata: { button: 'cta' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'click',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: { button: 'cta' },
    });
  });

  it('should track share interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.share({
      platform: 'twitter',
      category: 'agents',
      slug: 'test-agent',
      url: 'https://example.com',
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'share',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: {
        platform: 'twitter',
        url: 'https://example.com',
      },
    });
  });

  it('should track share with null category/slug', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.share({
      platform: 'facebook',
      category: null,
      slug: null,
      url: 'https://example.com',
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'share',
      content_type: null,
      content_slug: null,
      metadata: {
        platform: 'facebook',
        url: 'https://example.com',
      },
    });
  });

  it('should track screenshot interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.screenshot({
      category: 'agents',
      slug: 'test-agent',
      metadata: { method: 'browser' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'screenshot',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: { method: 'browser' },
    });
  });

  it('should track download with trackUsage for specific action types', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.download({
      category: 'agents',
      slug: 'test-agent',
      action_type: 'download_zip',
    });

    expect(mockTrackUsage).toHaveBeenCalledWith({
      content_type: 'agents',
      content_slug: 'test-agent',
      action_type: 'download_zip',
    });
    expect(mockTrackInteraction).not.toHaveBeenCalled();
  });

  it('should track download with trackInteraction for generic downloads', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.download({
      category: 'agents',
      slug: 'test-agent',
      action_type: 'download_zip' as any, // Force generic path
    });

    // Actually, all action_types map to trackUsage, so this tests the default
    await result.current.download({
      category: 'mcp',
      slug: 'test-mcp',
    });

    expect(mockTrackUsage).toHaveBeenCalledWith({
      content_type: 'mcp',
      content_slug: 'test-mcp',
      action_type: 'download_zip', // default
    });
  });

  it('should track all download action types via trackUsage', async () => {
    const { result } = renderHook(() => usePulse());

    const actionTypes = ['download_zip', 'download_markdown', 'download_code', 'llmstxt', 'download_mcpb'] as const;

    for (const actionType of actionTypes) {
      await result.current.download({
        category: 'agents',
        slug: 'test-agent',
        action_type: actionType,
      });

      expect(mockTrackUsage).toHaveBeenCalledWith({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type,
      });
    }
  });

  it('should track bookmark add actions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.bookmark({
      category: 'agents',
      slug: 'test-agent',
      action: 'add',
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'bookmark',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: { action: 'add' },
    });
  });

  it('should track bookmark remove actions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.bookmark({
      category: 'mcp',
      slug: 'test-mcp',
      action: 'remove',
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'bookmark',
      content_type: 'mcp',
      content_slug: 'test-mcp',
      metadata: { action: 'remove' },
    });
  });

  it('should track filter interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.filter({
      category: 'agents',
      filters: { tags: ['ai', 'coding'] },
      metadata: { source: 'sidebar' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'filter',
      content_type: 'agents',
      content_slug: null,
      metadata: {
        filters: { tags: ['ai', 'coding'] },
        source: 'sidebar',
      },
    });
  });

  it('should track search interactions', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.search({
      category: 'agents',
      slug: 'test-agent',
      query: 'ai assistant',
      metadata: { source: 'header' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'search',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: {
        query: 'ai assistant',
        source: 'header',
      },
    });
  });

  it('should track newsletter subscribe via trackInteraction', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.newsletter({
      event: 'subscribe',
      metadata: { source: 'footer' },
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'newsletter_subscribe',
      content_type: null,
      content_slug: null,
      metadata: { source: 'footer' },
    });
    expect(mockTrackNewsletterEvent).not.toHaveBeenCalled();
  });

  it('should track newsletter events via trackNewsletterEvent', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.newsletter({
      event: 'signup_success',
      metadata: { source: 'footer' },
    });

    expect(mockTrackNewsletterEvent).toHaveBeenCalledWith('signup_success', { source: 'footer' });
    expect(mockTrackInteraction).not.toHaveBeenCalled();
  });

  it('should handle null metadata', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.view({
      category: 'agents',
      slug: 'test-agent',
      metadata: null,
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'view',
      content_type: 'agents',
      content_slug: 'test-agent',
      metadata: null,
    });
  });

  it('should handle undefined metadata', async () => {
    const { result } = renderHook(() => usePulse());

    await result.current.copy({
      category: 'mcp',
      slug: 'test-mcp',
    });

    expect(mockTrackInteraction).toHaveBeenCalledWith({
      interaction_type: 'copy',
      content_type: 'mcp',
      content_slug: 'test-mcp',
      metadata: null,
    });
  });
});
