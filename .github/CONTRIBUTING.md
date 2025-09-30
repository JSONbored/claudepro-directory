# Contributing to ClaudePro Directory

Thank you for your interest in contributing to ClaudePro Directory! This guide will help you add new content to our community-driven collection of Claude configurations.

## 📋 Quick Start

1. **Fork** the repository to your GitHub account
2. **Clone** your fork locally
3. **Create a feature branch** from `dev` branch
4. **Add your content** as a JSON file
5. **Test locally** with `npm run dev`
6. **Submit a PR** targeting our `dev` branch

## 🔄 Development Workflow

### Branch Structure
- `main` - Production branch (stable releases)
- `dev` - Development branch (integration branch for new features)
- Feature branches - Your contributions

### Contribution Process
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claudepro-directory.git
   cd claudepro-directory
   ```
3. Create a feature branch from `dev`:
   ```bash
   git checkout dev
   git pull upstream dev  # If you've set up upstream
   git checkout -b feature/your-feature-name
   ```
4. Make your changes
5. Commit with clear messages:
   ```bash
   git commit -m "Add [Type]: Brief description"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Open a Pull Request targeting our `dev` branch (not `main`!)

## 🎯 Content Types We Accept

- **Rules** - System prompts and configurations for Claude
- **MCP Servers** - Model Context Protocol server configurations
- **Agents** - Specialized AI agent configurations
- **Commands** - Powerful automation commands
- **Hooks** - Event-driven automation hooks

## 📝 How to Add Content

### 1. Choose the Right Directory

Place your JSON file in the appropriate directory:
```
content/
├── agents/       # AI agent configurations
├── commands/     # Automation commands
├── hooks/        # Event hooks
├── mcp/          # MCP server configs
└── rules/        # System prompts
```

### 2. Choose Your Template

We provide two template options for each content type:

**Simple Templates** (Recommended for beginners)
- Minimal fields and clear examples
- Perfect for getting started quickly
- Available: `*-template-simple.json`

**Advanced Templates** (For experienced contributors)
- Comprehensive field documentation
- Optional features and customization
- Available: `*-template.json`

### 3. Create Your JSON File

Copy the appropriate template from the `content/` directory and fill in your content:

#### Simple Template Example (Recommended for Beginners)

**Agent Example:**
```json
{
  "slug": "my-agent-name",
  "description": "A brief description of what your agent does",
  "category": "agents",
  "author": "YourName",
  "dateAdded": "2025-01-15",
  "tags": ["main-skill", "technology", "use-case"],
  "content": "You are an expert in [YOUR DOMAIN]...",
  "configuration": {
    "temperature": 0.3,
    "maxTokens": 8000
  },
  "source": "community"
}
```

**Hook Example:**
```json
{
  "slug": "my-hook",
  "description": "A brief description of what this hook does",
  "category": "hooks",
  "author": "YourName",
  "dateAdded": "2025-01-15",
  "tags": ["event-type", "technology", "use-case"],
  "content": "#!/usr/bin/env bash\n# Your script here",
  "source": "community",
  "hookType": "pre-tool-use",
  "triggeredBy": ["tool-name"]
}
```

#### Advanced Template Features

For experienced contributors, advanced templates include:
- Detailed installation instructions
- Troubleshooting guides
- Usage examples with expected outcomes
- Related content cross-references
- Custom configuration options

**Important Notes:**
- All content types use `slug` field - titles are auto-generated with smart capitalization
- "aws-api-validator" → "AWS API Validator" (auto-capitalized)
- Slugs should use kebab-case (lowercase with hyphens)

### 4. Template Locations

Find templates in the `content/` directory:
- `content/agents-template-simple.json` / `content/agents-template.json`
- `content/commands-template-simple.json` / `content/commands-template.json`
- `content/hooks-template-simple.json` / `content/hooks-template.json`
- `content/mcp-template-simple.json` / `content/mcp-template.json`
- `content/rules-template-simple.json` / `content/rules-template.json`

### 5. Categories

Use one of these standard categories:

**For Rules/Agents/Commands/Hooks:**
- `development` - Programming & software development
- `productivity` - Task management & efficiency
- `creative` - Writing, art, design
- `business` - Business analysis & strategy
- `data` - Data analysis & processing
- `automation` - Workflow automation
- `other` - Doesn't fit other categories

**For MCP Servers:**
- `database` - Database connections
- `development` - Dev tools & APIs
- `productivity` - Productivity tools
- `automation` - Automation services
- `file-system` - File operations
- `other` - Other integrations

### 6. File Naming

Name your file descriptively using kebab-case:
- ✅ `typescript-expert.json`
- ✅ `react-code-reviewer.json`
- ❌ `my_agent.json`
- ❌ `Agent1.json`

## 🧪 Testing Your Contribution

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build content:**
   ```bash
   npm run build:content
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   ```

4. **Verify your content:**
   - Navigate to the appropriate section
   - Check that your content appears
   - Test the detail page works

## 📤 Submitting Your PR

### PR Title Format
```
Add [Type]: [Your Content Title]
```

Examples:
- `Add Agent: TypeScript Code Reviewer`
- `Add MCP: PostgreSQL Server`
- `Add Rule: React Best Practices`

### PR Description Template
```markdown
## Content Type
[Agent/Rule/MCP/Command/Hook]

## Description
Brief description of what this content does

## Testing
- [ ] Content displays correctly in list view
- [ ] Detail page loads without errors
- [ ] All links work properly
- [ ] Tested locally with `npm run dev`

## Category
[development/productivity/creative/etc]

## Tags
tag1, tag2, tag3
```

## ✅ Checklist Before Submitting

- [ ] JSON file is valid (no syntax errors)
- [ ] Used appropriate category
- [ ] Added relevant tags (3-5 recommended)
- [ ] Content is useful and well-written
- [ ] No duplicate content exists
- [ ] Tested locally
- [ ] PR follows naming convention
- [ ] Only one content addition per PR

## 🚫 What NOT to Include

- Personal information (emails, passwords, API keys)
- Copyrighted content without permission
- Malicious or harmful configurations
- Advertisements or spam
- Low-quality or duplicate content

## 💡 Tips for Great Contributions

1. **Clear Titles** - Be specific about what your content does
2. **Detailed Descriptions** - Help users understand the value
3. **Comprehensive Content** - Include examples and explanations
4. **Proper Formatting** - Use markdown for better readability
5. **Relevant Tags** - Help users discover your content

## 🤝 Community Guidelines

- Be respectful and constructive
- Help review other contributions
- Report issues or improvements
- Share knowledge and learn from others

## 📚 Real-World Examples

Check the `content/` directories for production examples:
- **Agents**: `content/agents/` - See professional agent configurations
- **Commands**: `content/commands/` - Review working command implementations
- **Hooks**: `content/hooks/` - Study event-driven automation examples
- **MCP**: `content/mcp/` - Explore server integration patterns
- **Rules**: `content/rules/` - Learn from expert system prompts

### Quick Reference: Simple vs Advanced Templates

| Feature | Simple Template | Advanced Template |
|---------|----------------|-------------------|
| Required Fields Only | ✅ | ✅ |
| Basic Examples | ✅ | ✅ |
| Installation Guide | ❌ | ✅ |
| Troubleshooting | ❌ | ✅ |
| Usage Examples | ❌ | ✅ |
| Configuration Options | Minimal | Comprehensive |
| Comments & Documentation | Minimal | Detailed |
| Best For | Quick contributions | Production-ready content |

## 🙋 Need Help?

- Check existing content for examples
- Open an issue for questions
- Join discussions in GitHub Issues
- Review closed PRs for patterns

---

Thank you for contributing to ClaudePro Directory! Your additions help the entire Claude community. 🎉