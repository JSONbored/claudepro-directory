/**
 * Markdown Actions - Storybook Mock Implementation
 *
 * This file provides no-op mock implementations of markdown server actions
 * for Storybook component isolation. Real implementations use next-safe-action.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real markdown-actions.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/markdown-actions.ts for production implementation
 */

/**
 * Mock: Copy markdown content to clipboard
 * @returns Success response with mock markdown content
 */
export const copyMarkdownAction = async (params: {
  category: string;
  slug: string;
  includeMetadata?: boolean;
  includeFooter?: boolean;
}) => {
  // Simulate a delay like the real server action
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    data: {
      success: true,
      markdown: `# Mock Markdown Content\n\nThis is mock markdown for **${params.category}/${params.slug}**`,
    },
  };
};

/**
 * Mock: Download markdown content as file
 * @returns Success response with mock markdown content
 */
export const downloadMarkdownAction = async (params: {
  category: string;
  slug: string;
  includeMetadata?: boolean;
  includeFooter?: boolean;
}) => {
  // Simulate a delay like the real server action
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    data: {
      success: true,
      markdown: `# Mock Markdown Content\n\nThis is mock markdown for **${params.category}/${params.slug}**`,
      filename: `${params.slug}.md`,
    },
  };
};
