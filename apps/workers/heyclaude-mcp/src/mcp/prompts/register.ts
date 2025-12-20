/**
 * Prompts Registration Implementation
 *
 * Registers all MCP prompts with the server.
 * Prompts provide pre-defined templates for common workflows.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '../tools/categories.js';
import { z } from 'zod';

// Zod schemas for prompt arguments (as raw shapes, not ZodObjects)
const categoryPromptArgSchema = {
  category: z.string().optional(),
  submission_type: z.string().optional(),
};

const platformPromptArgSchema = {
  platform: z.string(),
  content_type: z.string().optional(),
};

const queryTypePromptArgSchema = {
  query_type: z.string().optional(),
};

const serverSlugPromptArgSchema = {
  server_slug: z.string().optional(),
};

const contentTypePromptArgSchema = {
  content_type: z.string().optional(),
};

const formatPromptArgSchema = {
  format: z.string().optional(),
};

/**
 * Register all prompts on the MCP server
 *
 * @param mcpServer - MCP server instance
 * @param context - Tool handler context
 */
export function registerAllPrompts(mcpServer: McpServer, context: ToolContext): void {
  const { logger } = context;

  // 1. Submit Content Guide - Step-by-step guide for submitting content
  mcpServer.registerPrompt(
    'submit-content-guide',
    {
      title: 'Submit Content Guide',
      description:
        'Step-by-step guide for submitting new content to the Claude Pro Directory. Provides instructions, requirements, and best practices for each content type.',
      argsSchema: categoryPromptArgSchema,
    },
    async ({ category, submission_type }) => {
      const categoryText = category
        ? ` for the **${category}** category`
        : '';
      const typeText = submission_type
        ? ` as a **${submission_type}**`
        : '';

      const guide = `# Content Submission Guide${categoryText}${typeText}

## Overview

This guide will help you submit content to the Claude Pro Directory. Follow these steps to ensure your submission is complete and meets our quality standards.

## Step 1: Choose Your Content Type

Select the type of content you want to submit:
- **Agents**: AI agents and assistants
- **MCP Servers**: Model Context Protocol servers
- **Rules**: Claude rules and guidelines
- **Commands**: Command-line tools and utilities
- **Hooks**: Git hooks and automation scripts
- **Templates**: Project templates and starters

## Step 2: Gather Required Information

Before submitting, make sure you have:
- **Name**: Clear, descriptive name
- **Description**: Detailed description (at least 100 characters)
- **Author**: Your name or organization
- **Category**: Appropriate category selection
- **Tags**: Relevant tags (3-10 tags recommended)

## Step 3: Optional Information

Consider including:
- **Author Profile URL**: Link to your profile or website
- **GitHub URL**: Repository link (if applicable)
- **Content Data**: Additional structured data (JSON format)

## Step 4: Review Requirements

Ensure your submission:
- ✅ Has a clear, descriptive name
- ✅ Includes a detailed description
- ✅ Is properly categorized
- ✅ Has relevant tags
- ✅ Follows content guidelines
- ✅ Is original or properly attributed

## Step 5: Submit

Use the \`submitContent\` tool to submit your content. The tool will guide you through the submission process and provide a URL to complete the submission in the web interface.

## Best Practices

- **Be Descriptive**: Provide clear, detailed descriptions
- **Use Tags Wisely**: Choose relevant tags that help discovery
- **Include Examples**: Show how to use your content
- **Follow Guidelines**: Review category-specific requirements
- **Test First**: Ensure your content works before submitting

## Need Help?

If you need assistance:
- Check category-specific requirements using \`getCategoryConfigs\`
- Review submission templates using \`getTemplates\`
- Contact support through the web interface

Ready to submit? Use the \`submitContent\` tool to begin!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 2. Format Content for Platform - Platform-specific formatting instructions
  mcpServer.registerPrompt(
    'format-content-for-platform',
    {
      title: 'Format Content for Platform',
      description:
        'Instructions for formatting content for specific platforms (Claude Code, Cursor, etc.) with installation steps and configuration examples.',
      argsSchema: platformPromptArgSchema,
    },
    async ({ platform, content_type }) => {
      const platformName = platform === 'claude-code' ? 'Claude Code' : platform === 'cursor' ? 'Cursor' : platform;
      const contentType = content_type || 'content';

      const guide = `# Formatting Content for ${platformName}

## Platform: ${platformName}
## Content Type: ${contentType}

## Installation Instructions

### For Claude Code:
1. Open Claude Code settings
2. Navigate to the appropriate section
3. Copy the content below
4. Paste into the configuration
5. Save and restart if needed

### For Cursor:
1. Open Cursor settings
2. Navigate to Rules or Agents section
3. Create a new entry
4. Paste the formatted content
5. Save configuration

## Formatting Guidelines

- **Indentation**: Use consistent indentation (2 or 4 spaces)
- **Comments**: Include helpful comments
- **Structure**: Follow platform-specific structure
- **Validation**: Ensure content is valid for the platform

## Example Format

\`\`\`
# ${contentType} Configuration

[Formatted content here]
\`\`\`

## Next Steps

1. Use \`downloadContentForPlatform\` tool to get formatted content
2. Follow platform-specific installation steps
3. Test the configuration
4. Adjust as needed

## Platform-Specific Notes

${platform === 'claude-code' ? '- Claude Code uses YAML format\n- Place files in .claude/ directory\n- Restart Claude Code after changes' : platform === 'cursor' ? '- Cursor uses JSON or YAML\n- Configuration in .cursor/ directory\n- May require workspace reload' : '- Check platform documentation\n- Follow platform conventions\n- Test thoroughly'}

Need the actual formatted content? Use the \`downloadContentForPlatform\` tool!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 3. Search Optimization Tips - Tips for better search results
  mcpServer.registerPrompt(
    'search-optimization-tips',
    {
      title: 'Search Optimization Tips',
      description:
        'Tips and best practices for optimizing search queries to find content more effectively in the Claude Pro Directory.',
      argsSchema: queryTypePromptArgSchema,
    },
    async () => {
      const guide = `# Search Optimization Tips

## Overview

Learn how to search the Claude Pro Directory effectively to find exactly what you need.

## General Search Tips

### 1. Use Specific Keywords
- **Good**: "authentication agent" or "PostgreSQL MCP server"
- **Avoid**: "stuff" or "things"

### 2. Combine Keywords
- Use multiple relevant terms
- Example: "React TypeScript component library"

### 3. Use Category Filters
- Filter by category when you know the type
- Categories: agents, mcp, rules, commands, hooks, templates

### 4. Leverage Tags
- Tags help narrow results
- Use \`getSearchFacets\` to see available tags
- Combine multiple tags for precise results

## Advanced Search Strategies

### Category-Specific Searches
\`\`\`
Use searchContent with:
- category: "agents" (or other category)
- query: "your search terms"
- tags: ["relevant", "tags"]
\`\`\`

### Tag-Based Filtering
\`\`\`
Use getContentByTag with:
- tags: ["react", "typescript"]
- match_mode: "all" (AND) or "any" (OR)
\`\`\`

### Faceted Search
1. Use \`getSearchFacets\` to see available filters
2. Use facets to refine your search
3. Combine with searchContent for best results

## Search Tools Available

1. **searchContent**: General search with filters
2. **getSearchSuggestions**: Autocomplete suggestions
3. **getSearchFacets**: Available filters and facets
4. **getContentByTag**: Tag-based filtering
5. **getRelatedContent**: Find similar content

## Best Practices

- ✅ Start broad, then narrow down
- ✅ Use category filters when possible
- ✅ Leverage tags for precision
- ✅ Check search facets for available filters
- ✅ Use suggestions for query refinement
- ✅ Review related content for discovery

## Example Workflows

### Finding a React Component Library:
\`\`\`
1. searchContent(query: "React component", category: "agents")
2. Review results
3. Use getRelatedContent for similar items
4. Check tags from results
5. Refine with getContentByTag if needed
\`\`\`

### Discovering MCP Servers:
\`\`\`
1. getMcpServers() to see all servers
2. Use searchContent with category: "mcp"
3. Filter by tags like "database" or "api"
4. Review server details
\`\`\`

## Common Mistakes to Avoid

- ❌ Too generic queries ("good stuff")
- ❌ Ignoring category filters
- ❌ Not using tags effectively
- ❌ Skipping search facets
- ❌ Not checking related content

## Quick Reference

- **General Search**: \`searchContent\`
- **By Category**: \`searchContent\` with category filter
- **By Tags**: \`getContentByTag\`
- **Suggestions**: \`getSearchSuggestions\`
- **Facets**: \`getSearchFacets\`
- **Related**: \`getRelatedContent\`

Start searching with \`searchContent\` or explore available options with \`getSearchFacets\`!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 4. Content Discovery Guide - How to discover and explore content
  mcpServer.registerPrompt(
    'content-discovery-guide',
    {
      title: 'Content Discovery Guide',
      description:
        'Comprehensive guide on discovering, exploring, and navigating content in the Claude Pro Directory using various tools and strategies.',
      argsSchema: {}, // No arguments
    },
    async () => {
      const guide = `# Content Discovery Guide

## Overview

Learn how to effectively discover and explore content in the Claude Pro Directory using our comprehensive set of tools.

## Discovery Methods

### 1. Browse by Category
Use \`listCategories\` to see all categories, then:
- Use \`getTrending\` for popular content
- Use \`getFeatured\` for highlighted content
- Use \`getPopular\` for most-viewed content
- Use \`getRecent\` for newest additions

### 2. Search
- **General Search**: \`searchContent\` with query
- **Tag-Based**: \`getContentByTag\` for specific tags
- **Faceted**: Use \`getSearchFacets\` to see available filters

### 3. Explore Related Content
- Use \`getRelatedContent\` after finding something interesting
- Discover similar or related items
- Find complementary content

### 4. Platform-Specific
- Use \`downloadContentForPlatform\` for platform-formatted content
- Get installation instructions
- Access platform-optimized formats

## Recommended Workflows

### Workflow 1: Category Exploration
\`\`\`
1. listCategories() - See all categories
2. getTrending(category: "agents") - See trending agents
3. getContentDetail() - Get details for interesting items
4. getRelatedContent() - Find similar content
\`\`\`

### Workflow 2: Targeted Search
\`\`\`
1. searchContent(query: "authentication") - Initial search
2. getSearchFacets() - See available filters
3. Refine search with category/tags
4. getContentDetail() - Deep dive into results
\`\`\`

### Workflow 3: Tag Discovery
\`\`\`
1. getContentByTag(tags: ["react", "typescript"]) - Tag-based discovery
2. Review results
3. Use getRelatedContent() - Find related items
4. Explore categories from results
\`\`\`

## Available Tools

### Discovery Tools:
- \`listCategories\` - Browse all categories
- \`getTrending\` - Trending content
- \`getFeatured\` - Featured content
- \`getPopular\` - Popular content
- \`getRecent\` - Recent additions

### Search Tools:
- \`searchContent\` - General search
- \`getSearchSuggestions\` - Query suggestions
- \`getSearchFacets\` - Available filters
- \`getContentByTag\` - Tag filtering

### Detail Tools:
- \`getContentDetail\` - Full content details
- \`getRelatedContent\` - Similar content
- \`getCategoryConfigs\` - Category info

### Export Tools:
- \`downloadContentForPlatform\` - Platform-specific formats
- Resource templates - Various export formats

## Pro Tips

1. **Start Broad**: Use \`listCategories\` or \`getTrending\`
2. **Narrow Down**: Use search with filters
3. **Explore Related**: Use \`getRelatedContent\`
4. **Check Details**: Always review \`getContentDetail\`
5. **Use Tags**: Leverage tags for precision
6. **Try Suggestions**: Use \`getSearchSuggestions\`

## Quick Start

New to the directory? Try:
1. \`listCategories\` - See what's available
2. \`getTrending\` - See what's popular
3. \`getFeatured\` - See highlighted content
4. \`searchContent\` - Search for specific needs

Happy discovering! 🚀`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 5. MCP Server Setup Guide - How to set up and use MCP servers
  mcpServer.registerPrompt(
    'mcp-server-setup-guide',
    {
      title: 'MCP Server Setup Guide',
      description:
        'Complete guide on setting up, configuring, and using MCP servers from the directory, including installation and integration steps.',
      argsSchema: serverSlugPromptArgSchema,
    },
    async ({ server_slug }) => {
      const serverSpecific = server_slug
        ? `\n## Server: ${server_slug}\n\nUse \`getMcpServers\` to find this server and get specific setup instructions.`
        : '';

      const guide = `# MCP Server Setup Guide${serverSpecific}

## Overview

This guide will help you set up and use MCP servers from the Claude Pro Directory.

## What is an MCP Server?

Model Context Protocol (MCP) servers extend Claude's capabilities by providing:
- **Tools**: Functions Claude can call
- **Resources**: Data sources Claude can access
- **Prompts**: Pre-defined prompt templates

## Setup Steps

### Step 1: Find an MCP Server
- Use \`getMcpServers\` to browse available servers
- Use \`searchContent\` with category: "mcp" to search
- Review server details with \`getContentDetail\`

### Step 2: Review Requirements
- Check if authentication is required
- Review configuration options
- Understand dependencies

### Step 3: Install the Server
- Follow server-specific installation instructions
- Configure environment variables if needed
- Set up authentication if required

### Step 4: Configure Claude
- Add server to Claude's MCP configuration
- Provide required credentials
- Test the connection

## Common Setup Patterns

### Public Servers (No Auth)
\`\`\`
1. Get server URL from getMcpServers
2. Add to Claude MCP config
3. Test connection
\`\`\`

### Authenticated Servers
\`\`\`
1. Get server details
2. Complete OAuth flow
3. Add to Claude config with tokens
4. Test authenticated access
\`\`\`

## Configuration

### Basic Configuration
\`\`\`json
{
  "mcpServers": {
    "server-name": {
      "url": "https://mcp.example.com/mcp",
      "transport": "http"
    }
  }
}
\`\`\`

### With Authentication
\`\`\`json
{
  "mcpServers": {
    "server-name": {
      "url": "https://mcp.example.com/mcp",
      "transport": "http",
      "auth": {
        "type": "oauth",
        "clientId": "...",
        "accessToken": "..."
      }
    }
  }
}
\`\`\`

## Available MCP Servers

Use \`getMcpServers\` to:
- Browse all available servers
- See server descriptions
- Get download URLs
- Check authentication requirements
- Review configuration options

## Troubleshooting

### Connection Issues
- Verify server URL is correct
- Check network connectivity
- Review server status

### Authentication Issues
- Complete OAuth flow
- Verify tokens are valid
- Check token expiration

### Tool/Resource Issues
- Review server documentation
- Check tool/resource availability
- Verify permissions

## Next Steps

1. Browse servers: \`getMcpServers\`
2. Get details: \`getContentDetail\`
3. Follow setup instructions
4. Test in Claude

Ready to explore? Use \`getMcpServers\` to see available servers!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 6. Content Submission Best Practices - Best practices for submitting quality content
  mcpServer.registerPrompt(
    'content-submission-best-practices',
    {
      title: 'Content Submission Best Practices',
      description:
        'Best practices, guidelines, and tips for submitting high-quality content that gets accepted and helps the community.',
      argsSchema: contentTypePromptArgSchema,
    },
    async ({ content_type }) => {
      const typeSpecific = content_type
        ? `\n## ${content_type} Specific Guidelines\n\nUse \`getCategoryConfigs\` with category to get type-specific requirements.`
        : '';

      const guide = `# Content Submission Best Practices${typeSpecific}

## Overview

Follow these best practices to ensure your content submission is high-quality, helpful, and gets accepted.

## Quality Standards

### 1. Clear and Descriptive
- **Name**: Use clear, descriptive names
- **Description**: Provide detailed descriptions (100+ characters)
- **Examples**: Include usage examples when possible

### 2. Complete Information
- ✅ All required fields filled
- ✅ Optional fields when relevant
- ✅ Proper categorization
- ✅ Relevant tags (3-10 recommended)

### 3. Accuracy
- ✅ Tested and working
- ✅ Accurate descriptions
- ✅ Up-to-date information
- ✅ Correct links and URLs

## Content Guidelines

### Descriptions
- **Minimum**: 100 characters
- **Recommended**: 200-500 characters
- **Include**: What it does, how to use it, key features

### Tags
- **Count**: 3-10 tags recommended
- **Relevance**: Use relevant, specific tags
- **Format**: Lowercase, hyphenated (e.g., "react-typescript")

### Categories
- Choose the most appropriate category
- Use \`getCategoryConfigs\` to see category requirements
- Follow category-specific guidelines

## Submission Checklist

Before submitting, verify:
- [ ] Clear, descriptive name
- [ ] Detailed description (100+ chars)
- [ ] Correct category
- [ ] Relevant tags (3-10)
- [ ] Author information
- [ ] Working links/URLs
- [ ] Tested and functional
- [ ] Follows guidelines

## Category-Specific Tips

### Agents
- Include use cases
- Show example interactions
- Document configuration

### MCP Servers
- Document authentication
- List available tools/resources
- Provide setup instructions

### Rules
- Show before/after examples
- Explain use cases
- Include configuration

### Commands
- Include usage examples
- Document parameters
- Show output examples

## Common Mistakes

### ❌ Avoid:
- Vague descriptions
- Missing required fields
- Wrong category
- Too many/few tags
- Broken links
- Untested content

### ✅ Do:
- Be specific and detailed
- Complete all fields
- Choose correct category
- Use relevant tags
- Test everything
- Provide examples

## Getting Help

- Use \`getCategoryConfigs\` for category requirements
- Use \`getTemplates\` for submission templates
- Review similar content for examples
- Check guidelines before submitting

## Submission Process

1. **Prepare**: Gather all information
2. **Review**: Check guidelines and requirements
3. **Submit**: Use \`submitContent\` tool
4. **Complete**: Finish in web interface
5. **Wait**: Review process may take time

## Pro Tips

- **Research First**: Check existing content
- **Be Original**: Avoid duplicates
- **Provide Value**: Focus on usefulness
- **Follow Format**: Use proper structure
- **Test Thoroughly**: Ensure it works

Ready to submit? Use \`submitContent\` to begin!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 7. Tool Usage Guide - How to use MCP tools effectively
  mcpServer.registerPrompt(
    'tool-usage-guide',
    {
      title: 'Tool Usage Guide',
      description:
        'Comprehensive guide on using MCP tools effectively, including tool selection, parameter usage, and best practices.',
      argsSchema: {}, // No arguments
    },
    async () => {
      const guide = `# MCP Tool Usage Guide

## Overview

Learn how to effectively use the 20 available MCP tools to interact with the Claude Pro Directory.

## Tool Categories

### Discovery Tools
- \`listCategories\` - Browse all categories
- \`getTrending\` - Trending content
- \`getFeatured\` - Featured content
- \`getPopular\` - Popular content
- \`getRecent\` - Recent additions

### Search Tools
- \`searchContent\` - General search with filters
- \`getSearchSuggestions\` - Query autocomplete
- \`getSearchFacets\` - Available filters
- \`getContentByTag\` - Tag-based filtering

### Detail Tools
- \`getContentDetail\` - Full content details
- \`getRelatedContent\` - Similar content
- \`getCategoryConfigs\` - Category information

### Specialized Tools
- \`getMcpServers\` - Browse MCP servers
- \`getTemplates\` - Submission templates
- \`getChangelog\` - Content updates
- \`getSocialProofStats\` - Community stats

### Action Tools
- \`submitContent\` - Submit new content
- \`createAccount\` - Create user account
- \`subscribeNewsletter\` - Newsletter subscription
- \`downloadContentForPlatform\` - Platform downloads

## Common Workflows

### Finding Content
\`\`\`
1. searchContent(query: "your search")
2. Review results
3. getContentDetail(slug, category) for details
4. getRelatedContent() for similar items
\`\`\`

### Exploring Categories
\`\`\`
1. listCategories() - See all categories
2. getTrending(category: "agents") - Trending in category
3. getContentDetail() - Get details
4. getRelatedContent() - Find similar
\`\`\`

### Tag-Based Discovery
\`\`\`
1. getContentByTag(tags: ["react", "typescript"])
2. Review results
3. Use getRelatedContent() for expansion
\`\`\`

## Tool Selection Guide

### When to Use Each Tool:

**Discovery:**
- \`listCategories\` - Starting point
- \`getTrending\` - Popular content
- \`getFeatured\` - Highlighted content

**Search:**
- \`searchContent\` - General search
- \`getContentByTag\` - Tag filtering
- \`getSearchFacets\` - See filters

**Details:**
- \`getContentDetail\` - Full information
- \`getRelatedContent\` - Similar items
- \`getCategoryConfigs\` - Category info

**Actions:**
- \`submitContent\` - Submit new content
- \`downloadContentForPlatform\` - Get formatted content
- \`createAccount\` - User registration

## Best Practices

1. **Start Broad**: Use discovery tools first
2. **Narrow Down**: Use search with filters
3. **Get Details**: Always check \`getContentDetail\`
4. **Explore Related**: Use \`getRelatedContent\`
5. **Use Tags**: Leverage tag-based tools
6. **Check Facets**: Use \`getSearchFacets\` for filters

## Tool Combinations

### Effective Combinations:
- \`listCategories\` + \`getTrending\`
- \`searchContent\` + \`getContentDetail\`
- \`getContentByTag\` + \`getRelatedContent\`
- \`getSearchFacets\` + \`searchContent\`

## Quick Reference

**Discovery**: listCategories, getTrending, getFeatured, getPopular, getRecent
**Search**: searchContent, getSearchSuggestions, getSearchFacets, getContentByTag
**Details**: getContentDetail, getRelatedContent, getCategoryConfigs
**Specialized**: getMcpServers, getTemplates, getChangelog, getSocialProofStats
**Actions**: submitContent, createAccount, subscribeNewsletter, downloadContentForPlatform

Start exploring with \`listCategories\` or search with \`searchContent\`!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  // 8. Resource Access Guide - How to access and use MCP resources
  mcpServer.registerPrompt(
    'resource-access-guide',
    {
      title: 'Resource Access Guide',
      description:
        'Guide on accessing and using MCP resources, including content exports, category exports, and sitewide exports in various formats.',
      argsSchema: formatPromptArgSchema,
    },
    async ({ format }) => {
      const formatInfo = format
        ? `\n## Format: ${format}\n\nThis guide focuses on the ${format} format.`
        : '\n## Available Formats\n\n- llms.txt: LLMs.txt format\n- markdown: Markdown format\n- json: JSON format\n- rss: RSS feed\n- atom: Atom feed';

      const guide = `# Resource Access Guide${formatInfo}

## Overview

Learn how to access and use MCP resources to export content from the Claude Pro Directory.

## Resource Types

### 1. Content Resource
**URI**: \`claudepro://content/{category}/{slug}/{format}\`

Access a specific content item in various formats:
- Individual content exports
- Multiple format options
- Category-specific content

### 2. Category Resource
**URI**: \`claudepro://category/{category}/{format}\`

Export all content in a category:
- Category-wide exports
- All items in category
- Multiple formats available

### 3. Sitewide Resource
**URI**: \`claudepro://sitewide/{format}\`

Export all content across all categories:
- Complete directory export
- All categories included
- Comprehensive data

## Available Formats

### LLMs.txt
- Human and AI-readable
- Structured format
- Good for AI consumption

### Markdown
- Human-readable
- Rich formatting
- Documentation-friendly

### JSON
- Machine-readable
- Structured data
- API-friendly

### RSS
- RSS feed format
- Syndication
- Feed readers

### Atom
- Atom feed format
- Modern syndication
- Feed readers

## Usage Examples

### Access Single Content
\`\`\`
Resource: claudepro://content/agents/my-agent/llms.txt
\`\`\`

### Access Category
\`\`\`
Resource: claudepro://category/agents/markdown
\`\`\`

### Access Sitewide
\`\`\`
Resource: claudepro://sitewide/json
\`\`\`

## When to Use Resources

**Use Resources When:**
- ✅ You need formatted exports
- ✅ You want bulk data
- ✅ You need specific formats
- ✅ You're building integrations
- ✅ You need feed formats

**Use Tools When:**
- ✅ You need to search/filter
- ✅ You need interactive discovery
- ✅ You need detailed metadata
- ✅ You need to submit content

## Resource vs Tools

**Resources**: Static exports, formatted data, feeds
**Tools**: Interactive search, discovery, actions

## Best Practices

1. **Choose Right Format**: Select format for your use case
2. **Use Appropriate Resource**: Content vs Category vs Sitewide
3. **Cache When Possible**: Resources can be cached
4. **Handle Large Exports**: Sitewide exports can be large

## Integration Examples

### RSS Feed Integration
\`\`\`
Use: claudepro://category/agents/rss
Integrate with feed readers
\`\`\`

### API Integration
\`\`\`
Use: claudepro://content/{category}/{slug}/json
Parse JSON in your application
\`\`\`

## Quick Reference

**Content**: claudepro://content/{category}/{slug}/{format}
**Category**: claudepro://category/{category}/{format}
**Sitewide**: claudepro://sitewide/{format}

**Formats**: llms.txt, markdown, json, rss, atom

Access resources through your MCP client's resource system!`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guide,
            },
          },
        ],
      };
    }
  );

  logger.info({ promptCount: 8 }, 'Registered all MCP prompts');
}
