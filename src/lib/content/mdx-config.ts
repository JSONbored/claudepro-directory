import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import type { MDXFrontmatter } from '@/src/lib/schemas/markdown.schema';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';
import { getSharedHighlighter } from './shiki-singleton';

// MDX node schema for type safety
const mdxNodeChildSchema = z.object({
  type: z.string(),
  value: z.string(),
});

const mdxNodePropsSchema = z.object({
  className: z.array(z.string()).default([]),
});

const mdxNodeSchema = z.object({
  properties: mdxNodePropsSchema.default({ className: [] }),
  children: z.array(mdxNodeChildSchema).default([]),
});

type MDXNode = z.infer<typeof mdxNodeSchema>;

// Frontmatter value schema - supports strings, numbers, booleans, and arrays
const frontmatterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]);

// Frontmatter schema for YAML parsing
const frontmatterSchema = z.record(z.string(), frontmatterValueSchema);

// Local MDX frontmatter schema for validation
const localMdxFrontmatterSchema = z.object({
  title: z.string(),
  seoTitle: z.string().optional(),
  description: z.string(),
  keywords: z.array(z.string()).default([]),
  dateUpdated: z.string().default(''),
  author: z.string().default(''),
  category: z.string().default(''),
  tags: z.array(z.string()).default([]),
  readingTime: z.string().default(''),
  difficulty: z.string().default(''),
  aiOptimized: z.boolean().default(false),
  citationReady: z.boolean().default(false),
  schemas: z
    .object({
      article: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]))
        .default({}),
    })
    .default({ article: {} }),
});

// Helper function to safely parse frontmatter with Zod validation
function parseFrontmatterWithValidation(
  rawFrontmatter: z.infer<typeof frontmatterSchema>
): z.infer<typeof localMdxFrontmatterSchema> {
  return localMdxFrontmatterSchema.parse({
    title: rawFrontmatter.title || 'Untitled',
    seoTitle: typeof rawFrontmatter.seoTitle === 'string' ? rawFrontmatter.seoTitle : undefined,
    description: rawFrontmatter.description || '',
    keywords: Array.isArray(rawFrontmatter.keywords) ? rawFrontmatter.keywords : [],
    dateUpdated: typeof rawFrontmatter.dateUpdated === 'string' ? rawFrontmatter.dateUpdated : '',
    author: typeof rawFrontmatter.author === 'string' ? rawFrontmatter.author : '',
    category: typeof rawFrontmatter.category === 'string' ? rawFrontmatter.category : '',
    tags: Array.isArray(rawFrontmatter.tags) ? rawFrontmatter.tags : [],
    readingTime: typeof rawFrontmatter.readingTime === 'string' ? rawFrontmatter.readingTime : '',
    difficulty: typeof rawFrontmatter.difficulty === 'string' ? rawFrontmatter.difficulty : '',
    aiOptimized:
      typeof rawFrontmatter.aiOptimized === 'boolean' ? rawFrontmatter.aiOptimized : false,
    citationReady:
      typeof rawFrontmatter.citationReady === 'boolean' ? rawFrontmatter.citationReady : false,
    schemas:
      typeof rawFrontmatter.schemas === 'object' && rawFrontmatter.schemas !== null
        ? {
            article:
              'article' in rawFrontmatter.schemas &&
              typeof rawFrontmatter.schemas.article === 'object' &&
              rawFrontmatter.schemas.article !== null
                ? (rawFrontmatter.schemas.article as Record<
                    string,
                    string | number | boolean | string[]
                  >)
                : {},
          }
        : { article: {} },
  });
}

// Shiki configuration for syntax highlighting
const shikiOptions = {
  theme: {
    dark: 'github-dark-dimmed',
    light: 'github-light',
  },
  keepBackground: false,
  defaultLang: 'plaintext',
  transformers: [
    {
      // Add copy button functionality to code blocks
      name: 'copy-button',
      pre(node: MDXNode) {
        node.properties = node.properties || {};
        node.properties.className = node.properties.className || [];
        if (Array.isArray(node.properties.className)) {
          node.properties.className.push('code-block-with-copy');
        }
      },
    },
  ],
};

// Rehype Pretty Code configuration with Shiki singleton
const rehypePrettyCodeOptions = {
  ...shikiOptions,
  // CRITICAL: Provide shared highlighter instance to prevent multiple Shiki instances
  getHighlighter: getSharedHighlighter,
  onVisitLine(node: MDXNode) {
    // Prevent lines from collapsing in `display: grid` mode, and
    // allow empty lines to be copy/pasted
    if (!node.children || node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node: MDXNode) {
    // Add class to highlighted lines
    if (!node.properties) node.properties = { className: [] };
    node.properties.className = ['line--highlighted'];
  },
  onVisitHighlightedChars(node: MDXNode) {
    // Add class to highlighted characters
    if (!node.properties) node.properties = { className: [] };
    node.properties.className = ['word--highlighted'];
  },
};

// Complete MDX options for next-mdx-remote
export const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypePrettyCode, rehypePrettyCodeOptions] as [
      typeof rehypePrettyCode,
      typeof rehypePrettyCodeOptions,
    ],
  ],
  format: 'mdx' as const,
};

// Helper function to parse frontmatter from MDX content
export function parseMDXFrontmatter(content: string): {
  frontmatter: MDXFrontmatter;
  content: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return {
      frontmatter: {
        title: '',
        description: '',
      },
      content,
    };
  }

  const frontmatterString = frontmatterMatch[1] || '';
  const contentString = frontmatterMatch[2] || '';

  // Enhanced YAML/JSON parser for frontmatter
  const frontmatter: z.infer<typeof frontmatterSchema> = {};
  const lines = frontmatterString.split('\n');
  let currentKey = '';
  let inArray = false;
  let inObject = false;
  let objectDepth = 0;
  let objectContent = '';
  let arrayItems: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    // Handle object structures
    if (trimmedLine.includes('{') && !inObject) {
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > -1) {
        currentKey = trimmedLine.slice(0, colonIndex).trim();
        objectContent = '';
        inObject = true;
        objectDepth = 0;

        // Count braces in this line
        for (const char of trimmedLine) {
          if (char === '{') objectDepth++;
          if (char === '}') objectDepth--;
        }

        objectContent += trimmedLine.slice(colonIndex + 1).trim();

        // If object closed on same line
        if (objectDepth === 0) {
          try {
            // Production-grade: safeParse with Zod validation
            const parsed = safeParse(objectContent, frontmatterValueSchema, {
              strategy: ParseStrategy.VALIDATED_JSON,
            });
            frontmatter[currentKey] = parsed;
          } catch (error) {
            // Fallback to raw string if parsing fails
            frontmatter[currentKey] = objectContent;
            logger.warn('Failed to parse frontmatter object', {
              key: currentKey,
              content: objectContent.slice(0, 100),
              error: error instanceof Error ? error.message : String(error),
            });
          }
          inObject = false;
          currentKey = '';
          objectContent = '';
        }
        continue;
      }
    }

    // Continue collecting object content
    if (inObject) {
      for (const char of line) {
        if (char === '{') objectDepth++;
        if (char === '}') objectDepth--;
      }

      objectContent += `\n${line}`;

      // Object complete
      if (objectDepth === 0) {
        try {
          // Production-grade: safeParse with Zod validation
          const parsed = safeParse(objectContent, frontmatterValueSchema, {
            strategy: ParseStrategy.VALIDATED_JSON,
          });
          frontmatter[currentKey] = parsed;
        } catch (error) {
          // Fallback to raw string if parsing fails
          frontmatter[currentKey] = objectContent;
          logger.warn('Failed to parse multiline frontmatter object', {
            key: currentKey,
            content: objectContent.slice(0, 100),
            error: error instanceof Error ? error.message : String(error),
          });
        }
        inObject = false;
        currentKey = '';
        objectContent = '';
      }
      continue;
    }

    // Handle array values
    if (trimmedLine.startsWith('- ')) {
      if (inArray) {
        arrayItems.push(trimmedLine.slice(2).replace(/^["']|["']$/g, ''));
      }
      continue;
    }

    // End array processing
    if (inArray && !trimmedLine.startsWith('- ')) {
      frontmatter[currentKey] = arrayItems;
      arrayItems = [];
      inArray = false;
    }

    // Handle key-value pairs
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > -1) {
      const key = trimmedLine.slice(0, colonIndex).trim();
      const value = trimmedLine.slice(colonIndex + 1).trim();

      if (value === '') {
        // Potential start of array or object
        currentKey = key;
        inArray = true;
        arrayItems = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        const arrayValue = value.slice(1, -1);
        if (arrayValue.trim()) {
          frontmatter[key] = arrayValue
            .split(',')
            .map((item) => item.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[key] = [];
        }
      } else {
        // Regular value
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Handle any remaining array
  if (inArray && arrayItems.length > 0) {
    frontmatter[currentKey] = arrayItems;
  }

  // Validate parsed frontmatter using proper Zod schema
  const validatedFrontmatter = parseFrontmatterWithValidation(frontmatter);

  return {
    frontmatter: validatedFrontmatter,
    content: contentString,
  };
}
