/**
 * Agent Schema Validation Tests
 *
 * Validates all agent JSON files against the agentContentSchema to ensure:
 * - All required fields are present and correctly typed
 * - Field constraints are met (string lengths, enums, patterns)
 * - Optional fields are validated when present
 * - Real production data passes validation
 *
 * **Why This Test Matters:**
 * - Catches schema violations before they reach production
 * - Ensures content consistency across all agent configs
 * - Validates data integrity for database insertions
 * - Prevents runtime errors from malformed data
 *
 * **Test Strategy:**
 * 1. Load all agent JSON files from content/agents/
 * 2. Validate each file against agentContentSchema
 * 3. Report specific validation errors for failed files
 * 4. Verify field-level constraints (e.g., slug format, tag requirements)
 *
 * @see src/lib/schemas/content/agent.schema.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { agentContentSchema } from '@/src/lib/schemas/content/agent.schema';

// Path to content directory (relative to project root)
const CONTENT_DIR = join(process.cwd(), 'content/agents');

/**
 * Load all agent JSON files from content/agents/
 * Returns array of { filename, data, raw } objects
 */
function loadAgentFiles() {
  try {
    const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));

    return files.map((filename) => {
      const filePath = join(CONTENT_DIR, filename);
      const raw = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return { filename, data, raw };
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Useful test debugging output for file loading errors
    console.error('Failed to load agent files:', error);
    return [];
  }
}

describe('Agent Schema Validation', () => {
  const agentFiles = loadAgentFiles();

  it('should find agent JSON files in content directory', () => {
    expect(agentFiles.length).toBeGreaterThan(0);
    // biome-ignore lint/suspicious/noConsole: Useful test output
    console.log(`Found ${agentFiles.length} agent files to validate`);
  });

  describe('Individual Agent File Validation', () => {
    // Test each agent file individually
    agentFiles.forEach(({ filename, data }) => {
      it(`${filename} should pass schema validation`, () => {
        const result = agentContentSchema.safeParse(data);

        if (!result.success) {
          // biome-ignore lint/suspicious/noConsole: Useful test debugging output
          console.error(`\n❌ Validation failed for ${filename}:`);
          // biome-ignore lint/suspicious/noConsole: Useful test debugging output
          console.error(JSON.stringify(result.error.format(), null, 2));
        }

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Required Fields Validation', () => {
    agentFiles.forEach(({ filename, data }) => {
      describe(`${filename} - Required Fields`, () => {
        it('should have required base fields', () => {
          expect(data).toHaveProperty('slug');
          expect(data).toHaveProperty('description');
          expect(data).toHaveProperty('author');
          expect(data).toHaveProperty('dateAdded');
          expect(data).toHaveProperty('tags');
          expect(data).toHaveProperty('category');
        });

        it('should have category = "agents"', () => {
          expect(data.category).toBe('agents');
        });

        it('should have non-empty slug', () => {
          expect(data.slug).toBeTruthy();
          expect(typeof data.slug).toBe('string');
          expect(data.slug.length).toBeGreaterThan(0);
        });

        it('should have valid slug format (lowercase, hyphenated)', () => {
          expect(data.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        });

        it('should have non-empty description', () => {
          expect(data.description).toBeTruthy();
          expect(typeof data.description).toBe('string');
          expect(data.description.length).toBeGreaterThan(0);
        });

        it('should have valid ISO 8601 dateAdded', () => {
          expect(data.dateAdded).toBeTruthy();
          expect(() => new Date(data.dateAdded)).not.toThrow();
          expect(new Date(data.dateAdded).toString()).not.toBe('Invalid Date');
        });

        it('should have at least one tag', () => {
          expect(data.tags).toBeInstanceOf(Array);
          expect(data.tags.length).toBeGreaterThan(0);
        });

        it('should have all tags as non-empty strings', () => {
          data.tags.forEach((tag: unknown) => {
            expect(typeof tag).toBe('string');
            expect((tag as string).length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('Optional Fields Validation', () => {
    agentFiles.forEach(({ filename, data }) => {
      describe(`${filename} - Optional Fields`, () => {
        if (data.configuration) {
          it('should have valid configuration object', () => {
            const config = data.configuration;

            if (config.temperature !== undefined) {
              expect(typeof config.temperature).toBe('number');
              expect(config.temperature).toBeGreaterThanOrEqual(0);
              expect(config.temperature).toBeLessThanOrEqual(2);
            }

            if (config.maxTokens !== undefined) {
              expect(typeof config.maxTokens).toBe('number');
              expect(config.maxTokens).toBeGreaterThan(0);
            }

            if (config.systemPrompt !== undefined) {
              expect(typeof config.systemPrompt).toBe('string');
            }
          });
        }

        if (data.features) {
          it('should have features as array of strings', () => {
            expect(data.features).toBeInstanceOf(Array);
            data.features.forEach((feature: unknown) => {
              expect(typeof feature).toBe('string');
              expect((feature as string).length).toBeGreaterThan(0);
            });
          });
        }

        if (data.useCases) {
          it('should have useCases as array of strings', () => {
            expect(data.useCases).toBeInstanceOf(Array);
            data.useCases.forEach((useCase: unknown) => {
              expect(typeof useCase).toBe('string');
              expect((useCase as string).length).toBeGreaterThan(0);
            });
          });
        }

        if (data.source) {
          it('should have valid source value', () => {
            expect(['community', 'official', 'verified', 'claudepro']).toContain(data.source);
          });
        }

        if (data.documentationUrl) {
          it('should have valid documentation URL', () => {
            expect(data.documentationUrl).toMatch(/^https?:\/\/.+/);
          });
        }

        if (data.seoTitle) {
          it('should have seoTitle with max 60 characters', () => {
            expect(data.seoTitle.length).toBeLessThanOrEqual(60);
          });
        }

        if (data.examples) {
          it('should have valid usage examples', () => {
            expect(data.examples).toBeInstanceOf(Array);
            expect(data.examples.length).toBeLessThanOrEqual(10);

            data.examples.forEach((example: unknown) => {
              expect(example).toHaveProperty('title');
              expect(example).toHaveProperty('code');
              expect(example).toHaveProperty('language');

              const ex = example as Record<string, unknown>;
              expect(typeof ex.title).toBe('string');
              expect(typeof ex.code).toBe('string');
              expect([
                'typescript',
                'javascript',
                'json',
                'bash',
                'shell',
                'python',
                'yaml',
                'markdown',
                'plaintext',
              ]).toContain(ex.language);

              if (ex.description) {
                expect(typeof ex.description).toBe('string');
                expect((ex.description as string).length).toBeLessThanOrEqual(500);
              }
            });
          });
        }
      });
    });
  });

  describe('Data Consistency Checks', () => {
    it('should have unique slugs across all agents', () => {
      const slugs = agentFiles.map((f) => f.data.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it('should have consistent filename and slug', () => {
      agentFiles.forEach(({ filename, data }) => {
        const expectedFilename = `${data.slug}.json`;
        expect(filename).toBe(expectedFilename);
      });
    });

    it('should have authors with consistent formatting', () => {
      agentFiles.forEach(({ data }) => {
        expect(data.author).toBeTruthy();
        expect(typeof data.author).toBe('string');
        // Author should not be excessively long
        expect(data.author.length).toBeLessThan(100);
      });
    });

    it('should have dates in chronological order (not future dates)', () => {
      const now = new Date();
      agentFiles.forEach(({ data }) => {
        const dateAdded = new Date(data.dateAdded);
        expect(dateAdded.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should reject agent with missing slug', () => {
      const invalidAgent = { ...agentFiles[0]?.data };
      (invalidAgent as Partial<typeof invalidAgent>).slug = undefined;

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with invalid category', () => {
      const invalidAgent = { ...agentFiles[0]?.data, category: 'invalid' };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with empty tags array', () => {
      const invalidAgent = { ...agentFiles[0]?.data, tags: [] };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with invalid temperature (> 2)', () => {
      const invalidAgent = {
        ...agentFiles[0]?.data,
        configuration: { temperature: 3, maxTokens: 1000 },
      };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with invalid temperature (< 0)', () => {
      const invalidAgent = {
        ...agentFiles[0]?.data,
        configuration: { temperature: -1, maxTokens: 1000 },
      };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with seoTitle > 60 characters', () => {
      const invalidAgent = {
        ...agentFiles[0]?.data,
        seoTitle:
          'This is a very long SEO title that exceeds the maximum allowed character limit of sixty characters',
      };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });

    it('should reject agent with > 10 examples', () => {
      const invalidAgent = {
        ...agentFiles[0]?.data,
        examples: Array(11).fill({
          title: 'Example',
          code: 'console.log("test")',
          language: 'javascript',
        }),
      };

      const result = agentContentSchema.safeParse(invalidAgent);
      expect(result.success).toBe(false);
    });
  });
});
