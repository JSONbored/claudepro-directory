# GitHub Content Management Guide

Your Claude Pro Directory is now fully set up for GitHub-based content management! Here's how to add and edit content:

## 📁 Content Structure

### Claude Rules
**Location:** `src/data/rules/`

**To add a new rule:**
1. Create a new file: `src/data/rules/your-rule-name.ts`
2. Follow this template:

```typescript
import { Rule } from './index';

export const yourRuleName: Rule = {
  id: 'unique-id-here',
  name: 'Your Rule Name',
  description: 'Brief description of what this rule does',
  tags: ['tag1', 'tag2', 'tag3'],
  author: 'Your Name',
  content: `Your complete rule content here. This can be:
- Multi-line
- Include examples
- Have formatting
- Be as detailed as needed`,
  slug: 'your-rule-name',
  category: 'development', // or 'writing', 'analysis', 'creative', 'business', 'other'
  popularity: 85, // 0-100 score
  createdAt: '2025-01-15',
};
```

3. Add your rule to `src/data/rules/index.ts`:
```typescript
import { yourRuleName } from './your-rule-name';

export const rules: Rule[] = [
  // existing rules...
  yourRuleName,
];
```

### MCP Servers
**Location:** `src/data/mcp/`

**To add a new MCP server:**
1. Create: `src/data/mcp/your-server-name.ts`
2. Template:

```typescript
import { MCPServer } from './index';

export const yourServerMcp: MCPServer = {
  id: 'unique-id',
  name: 'Your MCP Server',
  description: 'What this MCP server does',
  tags: ['database', 'automation'],
  author: 'Your Name',
  config: `{
  \"mcpServers\": {
    \"your-server\": {
      \"command\": \"your-command\",
      \"args\": [\"--option\", \"value\"]
    }
  }
}`,
  slug: 'your-server-name',
  category: 'database', // database, api, file-system, ai, productivity, development, automation, other
  popularity: 92,
  createdAt: '2025-01-15',
  repository: 'https://github.com/username/your-mcp-server',
  documentation: 'https://docs.example.com/your-server'
};
```

3. Add to `src/data/mcp/index.ts`

### Jobs
**Location:** `src/data/jobs/index.ts`

**To add a job:**
Edit the `jobs` array directly:

```typescript
{
  id: 'unique-job-id',
  title: 'Senior AI Engineer',
  company: 'Your Company',
  location: 'San Francisco, CA',
  type: 'full-time', // full-time, part-time, contract, freelance, remote
  description: 'Job description here...',
  requirements: [
    'Requirement 1',
    'Requirement 2'
  ],
  tags: ['AI', 'Python', 'Claude'],
  salary: '$150,000 - $250,000',
  slug: 'senior-ai-engineer-company',
  category: 'engineering', // engineering, design, product, marketing, sales, other
  postedAt: '2025-01-15',
  applyUrl: 'https://company.com/apply',
  companyDescription: 'About the company...',
  remote: true,
  featured: false
}
```

### Authors/Contributors
**Location:** `src/data/authors/index.ts`

Add community members to the `authors` array.

## 🔄 How It Works

1. **Edit files** directly in your GitHub repo
2. **Commit changes** - the site automatically rebuilds
3. **Content appears live** within minutes via Vercel deployment

## 📝 Quick Editing Tips

- Use GitHub's web editor for quick changes
- Create branches for major content updates
- Use pull requests for community contributions
- All content supports markdown formatting in descriptions

## 🎯 Content Guidelines

- **Rules**: Focus on practical, reusable Claude configurations
- **MCP Servers**: Include working configuration examples
- **Jobs**: Keep postings current and relevant to AI/Claude work
- **Authors**: Verify social links and maintain accurate stats

Your content is now fully version-controlled and community-manageable through GitHub!
