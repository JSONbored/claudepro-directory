import { describe, expect, it } from 'vitest';
import { GENERATED_CONFIG } from './app-config.ts';

describe('GENERATED_CONFIG', () => {
  it('should have valid ui_config structure', () => {
    expect(GENERATED_CONFIG.ui_config).toBeDefined();
    expect(GENERATED_CONFIG.ui_config.animation).toBeDefined();
    expect(GENERATED_CONFIG.ui_config.animation.easing).toBe('ease-in-out');
    expect(GENERATED_CONFIG.ui_config.animation.duration).toBe(300);
    expect(GENERATED_CONFIG.ui_config.pagination).toBeDefined();
    expect(GENERATED_CONFIG.ui_config.pagination.maxLimit).toBe(100);
    expect(GENERATED_CONFIG.ui_config.pagination.defaultLimit).toBe(20);
  });

  it('should have valid app_config structure', () => {
    expect(GENERATED_CONFIG.app_config).toBeDefined();
    expect(GENERATED_CONFIG.app_config.url).toBe('https://claudepro.directory');
    expect(GENERATED_CONFIG.app_config.name).toBe('Claude Pro Directory');
    expect(GENERATED_CONFIG.app_config.domain).toBe('claudepro.directory');
    expect(GENERATED_CONFIG.app_config.license).toBe('MIT');
    expect(GENERATED_CONFIG.app_config.version).toBe('1.0.0');
  });

  it('should have valid date_config structure', () => {
    expect(GENERATED_CONFIG.date_config).toBeDefined();
    expect(GENERATED_CONFIG.date_config.currentYear).toBe(2025);
    expect(GENERATED_CONFIG.date_config.currentDate).toBe('2025-10-01');
    expect(GENERATED_CONFIG.date_config.claudeModels).toBeDefined();
    expect(GENERATED_CONFIG.date_config.claudeModels.opus).toBe('Claude Opus 4.1');
    expect(GENERATED_CONFIG.date_config.claudeModels.sonnet).toBe('Claude Sonnet 4.5');
  });

  it('should have valid social_links structure', () => {
    expect(GENERATED_CONFIG.social_links).toBeDefined();
    expect(GENERATED_CONFIG.social_links.email).toMatch(/^[^@]+@claudepro\.directory$/);
    expect(GENERATED_CONFIG.social_links.github).toContain('github.com');
    expect(GENERATED_CONFIG.social_links.discord).toContain('discord.gg');
    expect(GENERATED_CONFIG.social_links.twitter).toContain('x.com');
  });

  it('should have valid cache settings', () => {
    expect(GENERATED_CONFIG['cache.max_ttl_ms']).toBe(3600000);
    expect(GENERATED_CONFIG['cache.default_ttl_ms']).toBe(900000);
    expect(GENERATED_CONFIG['cache.enable_tags']).toBe(true);
    expect(GENERATED_CONFIG['cache.bypass_on_auth']).toBe(false);
    expect(GENERATED_CONFIG['cache.aggressive_mode']).toBe(false);
  });

  it('should have valid rate limit settings', () => {
    expect(GENERATED_CONFIG['rate_limit.enabled']).toBe(true);
    expect(GENERATED_CONFIG['rate_limit.max_requests']).toBe(100);
    expect(GENERATED_CONFIG['rate_limit.window_ms']).toBe(60000);
  });

  it('should have valid security settings', () => {
    expect(GENERATED_CONFIG['security.enabled']).toBe(true);
    expect(GENERATED_CONFIG['security.cache_ttl_ms']).toBe(300000);
    expect(GENERATED_CONFIG['security.log_all_events']).toBe(false);
  });

  it('should have valid analytics settings', () => {
    expect(GENERATED_CONFIG['analytics.enable_debug']).toBe(false);
    expect(GENERATED_CONFIG['analytics.debug_enabled']).toBe(false);
    expect(GENERATED_CONFIG['analytics.pii_keywords']).toBeInstanceOf(Array);
    expect(GENERATED_CONFIG['analytics.pii_keywords']).toContain('email');
    expect(GENERATED_CONFIG['analytics.pii_keywords']).toContain('password');
  });

  it('should have valid UI behavior settings', () => {
    expect(GENERATED_CONFIG['exit_intent.enabled']).toBe(true);
    expect(GENERATED_CONFIG['exit_intent.sensitivity']).toBe(20);
    expect(GENERATED_CONFIG['infinite_scroll.enabled']).toBe(true);
    expect(GENERATED_CONFIG['network_status.enabled']).toBe(true);
  });

  it('should have numeric values for timing settings', () => {
    expect(typeof GENERATED_CONFIG['search.debounce_ms']).toBe('number');
    expect(typeof GENERATED_CONFIG['prefetch.hover_delay_ms']).toBe('number');
    expect(typeof GENERATED_CONFIG['window_size.debounce_ms']).toBe('number');
    expect(typeof GENERATED_CONFIG['window_size.throttle_ms']).toBe('number');
  });
});