import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

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
      pre(node: any) {
        node.properties = node.properties || {};
        node.properties.className = node.properties.className || [];
        if (Array.isArray(node.properties.className)) {
          node.properties.className.push('code-block-with-copy');
        }
      },
    },
  ],
};

// Rehype Pretty Code configuration
const rehypePrettyCodeOptions = {
  ...shikiOptions,
  onVisitLine(node: any) {
    // Prevent lines from collapsing in `display: grid` mode, and
    // allow empty lines to be copy/pasted
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node: any) {
    // Add class to highlighted lines
    node.properties.className = ['line--highlighted'];
  },
  onVisitHighlightedChars(node: any) {
    // Add class to highlighted characters
    node.properties.className = ['word--highlighted'];
  },
};

// Complete MDX options for next-mdx-remote
export const mdxOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeSlug, [rehypePrettyCode, rehypePrettyCodeOptions] as any],
  format: 'mdx' as const,
};

// Type definitions for MDX frontmatter
export interface MDXFrontmatter {
  title: string;
  description: string;
  keywords?: string[];
  dateUpdated?: string;
  author?: string;
  category?: string;
  tags?: string[];
  schemas?: {
    article?: any;
    faq?: any;
    breadcrumb?: any;
    howto?: any;
  };
}

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
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterString.split('\n');
  let currentKey = '';
  let inArray = false;
  let inObject = false;
  let objectDepth = 0;
  let objectContent = '';
  let arrayItems: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
            frontmatter[currentKey] = JSON.parse(objectContent);
          } catch {
            frontmatter[currentKey] = objectContent;
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
          frontmatter[currentKey] = JSON.parse(objectContent);
        } catch {
          frontmatter[currentKey] = objectContent;
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

  return {
    frontmatter: {
      title: frontmatter.title || '',
      description: frontmatter.description || '',
      keywords: frontmatter.keywords,
      dateUpdated: frontmatter.dateUpdated,
      author: frontmatter.author,
      category: frontmatter.category,
      tags: frontmatter.tags,
      schemas: frontmatter.schemas,
    } as MDXFrontmatter,
    content: contentString,
  };
}
