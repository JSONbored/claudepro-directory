import { describe, expect, it } from 'vitest';
import { CATEGORY_CONFIGS } from './category-config.ts';
import { Constants } from '@heyclaude/database-types';

describe('CATEGORY_CONFIGS', () => {
  const CATEGORIES = Constants.public.Enums.content_category;

  it('should have configs for all content categories', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_CONFIGS[category]).toBeDefined();
      expect(CATEGORY_CONFIGS[category].id).toBe(category);
    }
  });

  it('should have valid structure for each category', () => {
    for (const category of CATEGORIES) {
      const config = CATEGORY_CONFIGS[category];
      
      expect(config.title).toBeTruthy();
      expect(config.pluralTitle).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.icon).toBeDefined();
      expect(config.colorScheme).toBeTruthy();
      expect(typeof config.showOnHomepage).toBe('boolean');
      expect(config.keywords).toBeTruthy();
      expect(config.metaDescription).toBeTruthy();
      expect(config.typeName).toBeTruthy();
      expect(typeof config.generateFullContent).toBe('boolean');
      expect(Array.isArray(config.metadataFields)).toBe(true);
    }
  });

  it('should have valid buildConfig for each category', () => {
    for (const category of CATEGORIES) {
      const { buildConfig } = CATEGORY_CONFIGS[category];
      
      expect(buildConfig).toBeDefined();
      expect(typeof buildConfig.batchSize).toBe('number');
      expect(buildConfig.batchSize).toBeGreaterThan(0);
      expect(typeof buildConfig.enableCache).toBe('boolean');
      expect(typeof buildConfig.cacheTTL).toBe('number');
      expect(buildConfig.cacheTTL).toBeGreaterThan(0);
    }
  });

  it('should have valid apiConfig for each category', () => {
    for (const category of CATEGORIES) {
      const { apiConfig } = CATEGORY_CONFIGS[category];
      
      expect(apiConfig).toBeDefined();
      expect(typeof apiConfig.generateStaticAPI).toBe('boolean');
      expect(typeof apiConfig.includeTrending).toBe('boolean');
      expect(typeof apiConfig.maxItemsPerResponse).toBe('number');
      expect(apiConfig.maxItemsPerResponse).toBeGreaterThan(0);
    }
  });

  it('should have valid listPage config for each category', () => {
    for (const category of CATEGORIES) {
      const { listPage } = CATEGORY_CONFIGS[category];
      
      expect(listPage).toBeDefined();
      expect(listPage.searchPlaceholder).toBeTruthy();
      expect(Array.isArray(listPage.badges)).toBe(true);
      
      if (listPage.badges.length > 0) {
        expect(typeof listPage.badges[0].text).toBe('function');
      }
    }
  });

  it('should have valid detailPage config for each category', () => {
    for (const category of CATEGORIES) {
      const { detailPage } = CATEGORY_CONFIGS[category];
      
      expect(detailPage).toBeDefined();
      expect(typeof detailPage.displayConfig).toBe('boolean');
      expect(detailPage.configFormat).toBeTruthy();
    }
  });

  it('should have valid sections config for each category', () => {
    for (const category of CATEGORIES) {
      const { sections } = CATEGORY_CONFIGS[category];
      
      expect(sections).toBeDefined();
      expect(typeof sections.features).toBe('boolean');
      expect(typeof sections.installation).toBe('boolean');
      expect(typeof sections.use_cases).toBe('boolean');
      expect(typeof sections.configuration).toBe('boolean');
      expect(typeof sections.security).toBe('boolean');
      expect(typeof sections.troubleshooting).toBe('boolean');
      expect(typeof sections.examples).toBe('boolean');
      expect(typeof sections.requirements).toBe('boolean');
    }
  });

  it('should have valid metadata config for each category', () => {
    for (const category of CATEGORIES) {
      const { metadata } = CATEGORY_CONFIGS[category];
      
      expect(metadata).toBeDefined();
      expect(typeof metadata.showGitHubLink).toBe('boolean');
    }
  });

  it('should have valid primaryAction for each category', () => {
    for (const category of CATEGORIES) {
      const { primaryAction } = CATEGORY_CONFIGS[category];
      
      expect(primaryAction).toBeDefined();
      expect(primaryAction.label).toBeTruthy();
      expect(primaryAction.type).toBeTruthy();
    }
  });

  it('should have matching urlSlug and contentLoader', () => {
    for (const category of CATEGORIES) {
      const config = CATEGORY_CONFIGS[category];
      
      expect(config.urlSlug).toBe(category);
      expect(config.contentLoader).toBe(category);
    }
  });

  it('should have unique color schemes', () => {
    const colorSchemes = new Set(
      Object.values(CATEGORY_CONFIGS).map(c => c.colorScheme)
    );
    
    // Should have variety in color schemes (not all the same)
    expect(colorSchemes.size).toBeGreaterThan(1);
  });

  it('should use valid Lucide icon names', () => {
    for (const category of CATEGORIES) {
      const config = CATEGORY_CONFIGS[category];
      
      // Icon should be a function (Lucide components are functions)
      expect(typeof config.icon).toBe('function');
    }
  });

  it('should have reasonable cache TTL values', () => {
    for (const category of CATEGORIES) {
      const { buildConfig } = CATEGORY_CONFIGS[category];
      
      // Cache TTL should be between 1 minute and 1 hour
      expect(buildConfig.cacheTTL).toBeGreaterThanOrEqual(60_000);
      expect(buildConfig.cacheTTL).toBeLessThanOrEqual(3_600_000);
    }
  });

  it('should have reasonable batch sizes', () => {
    for (const category of CATEGORIES) {
      const { buildConfig } = CATEGORY_CONFIGS[category];
      
      // Batch size should be reasonable (1-100)
      expect(buildConfig.batchSize).toBeGreaterThanOrEqual(1);
      expect(buildConfig.batchSize).toBeLessThanOrEqual(100);
    }
  });

  it('should have standard metadata fields', () => {
    const requiredFields = ['title', 'description', 'category', 'slug'];
    
    for (const category of CATEGORIES) {
      const { metadataFields } = CATEGORY_CONFIGS[category];
      
      for (const field of requiredFields) {
        expect(metadataFields).toContain(field);
      }
    }
  });

  it('badge text function should format count correctly', () => {
    for (const category of CATEGORIES) {
      const { listPage } = CATEGORY_CONFIGS[category];
      
      if (listPage.badges.length > 0) {
        const badge = listPage.badges[0];
        const result = badge.text(42);
        
        expect(result).toContain('42');
        expect(typeof result).toBe('string');
      }
    }
  });

  it('should have valid config format enums', () => {
    const validFormats = Constants.public.Enums.config_format;
    
    for (const category of CATEGORIES) {
      const { detailPage } = CATEGORY_CONFIGS[category];
      
      expect(validFormats).toContain(detailPage.configFormat);
    }
  });

  it('should have valid action type enums', () => {
    const validActionTypes = Constants.public.Enums.primary_action_type;
    
    for (const category of CATEGORIES) {
      const { primaryAction } = CATEGORY_CONFIGS[category];
      
      expect(validActionTypes).toContain(primaryAction.type);
    }
  });
});