# Contributing to ClaudePro Directory

Thank you for your interest in contributing to ClaudePro Directory! This guide will help you add new content to our community-driven collection of Claude configurations.

## 📋 Quick Start

**Option 1: Use GitHub Issue Templates** (Recommended for non-developers)

- [Submit via Issue Templates](../../issues/new/choose) - Structured forms guide you through submission

**Option 2: Submit via Pull Request** (For developers)

1. **Fork** the repository to your GitHub account
2. **Clone** your fork locally and add your content as a JSON file
3. **Test locally** with `npm run dev`
4. **Submit a PR** using our [PR template](../pull_request_template.md)

## 🔄 Development Workflow

### Contribution Process

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claudepro-directory.git
   cd claudepro-directory
   ```
3. Create a feature branch:
   ```bash
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
7. Open a Pull Request targeting the `main` branch

## 🎯 Content Types We Accept

| Type            | Description                   | Submit via Issue                                                     | Example Files                                        |
| --------------- | ----------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| **Agents**      | Specialized AI personas       | [Submit Agent](../../issues/new?template=submit_agent.yml)           | [View Examples](../../tree/main/content/agents)      |
| **Commands**    | Quick automation actions      | [Submit Command](../../issues/new?template=submit_command.yml)       | [View Examples](../../tree/main/content/commands)    |
| **Hooks**       | Event-driven automation       | [Submit Hook](../../issues/new?template=submit_hook.yml)             | [View Examples](../../tree/main/content/hooks)       |
| **MCP Servers** | Model Context Protocol        | [Submit MCP](../../issues/new?template=submit_mcp.yml)               | [View Examples](../../tree/main/content/mcp)         |
| **Rules**       | System prompts                | [Submit Rule](../../issues/new?template=submit_rule.yml)             | [View Examples](../../tree/main/content/rules)       |
| **Statuslines** | Custom status displays        | [Submit Statusline](../../issues/new?template=submit_statusline.yml) | [View Examples](../../tree/main/content/statuslines) |
| **Collections** | Curated configuration bundles | [Submit Collection](../../issues/new?template=submit_collection.yml) | [View Examples](../../tree/main/content/collections) |

## 📝 How to Add Content

### 1. Choose the Right Directory

Place your JSON file in the appropriate directory:

```
content/
├── agents/       # AI agent configurations
├── commands/     # Automation commands
├── hooks/        # Event hooks
├── mcp/          # MCP server configs
├── rules/        # System prompts
├── statuslines/  # Custom status displays
└── collections/  # Curated configuration bundles
```

### 2. Create Your JSON File

**Start with a template**, then customize it:

#### Templates (Copy & Customize)

- **Agent**: [`agents-template-simple.json`](../../blob/main/templates/content/agents-template-simple.json) | [Full template](../../blob/main/templates/content/agents-template.json)
- **Command**: [`commands-template-simple.json`](../../blob/main/templates/content/commands-template-simple.json) | [Full template](../../blob/main/templates/content/commands-template.json)
- **Hook**: [`hooks-template-simple.json`](../../blob/main/templates/content/hooks-template-simple.json) | [Full template](../../blob/main/templates/content/hooks-template.json)
- **MCP**: [`mcp-template-simple.json`](../../blob/main/templates/content/mcp-template-simple.json) | [Full template](../../blob/main/templates/content/mcp-template.json)
- **Rule**: [`rules-template-simple.json`](../../blob/main/templates/content/rules-template-simple.json) | [Full template](../../blob/main/templates/content/rules-template.json)
- **Statusline**: [`statuslines-template-simple.json`](../../blob/main/templates/content/statuslines-template-simple.json) | [Full template](../../blob/main/templates/content/statuslines-template.json)
- **Collection**: [`collections-template-simple.json`](../../blob/main/templates/content/collections-template-simple.json) | [Full template](../../blob/main/templates/content/collections-template.json)

#### Real-World Examples

- **Agent**: [`code-reviewer-agent.json`](../../blob/main/content/agents/code-reviewer-agent.json)
- **Command**: [`git-smart-commit.json`](../../blob/main/content/commands/git-smart-commit.json)
- **Hook**: [`auto-code-formatter-hook.json`](../../blob/main/content/hooks/auto-code-formatter-hook.json)
- **MCP**: [`github-mcp-server.json`](../../blob/main/content/mcp/github-mcp-server.json)
- **Rule**: [`react-expert.json`](../../blob/main/content/rules/react-expert.json)
- **Statusline**: [`git-status-statusline.json`](../../blob/main/content/statuslines/git-status-statusline.json)
- **Collection**: [`developer-productivity-booster.json`](../../blob/main/content/collections/developer-productivity-booster.json)

### 3. Categories

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

### 4. File Naming

Use kebab-case (lowercase with hyphens): `typescript-expert.json`, `react-code-reviewer.json`

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

When opening a pull request, our [PR template](../pull_request_template.md) will guide you through the process.

### PR Title Format

```
Add [Type]: [Your Content Title]
```

Examples:

- `Add Agent: TypeScript Code Reviewer`
- `Add MCP: PostgreSQL Server`
- `Add Rule: React Best Practices`

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

Browse production examples in our content directories:

- **Agents**: [`content/agents/`](../../tree/main/content/agents)
- **Commands**: [`content/commands/`](../../tree/main/content/commands)
- **Hooks**: [`content/hooks/`](../../tree/main/content/hooks)
- **MCP**: [`content/mcp/`](../../tree/main/content/mcp)
- **Rules**: [`content/rules/`](../../tree/main/content/rules)
- **Statuslines**: [`content/statuslines/`](../../tree/main/content/statuslines)
- **Collections**: [`content/collections/`](../../tree/main/content/collections)

## 🙋 Need Help?

- [Browse existing content](../../tree/main/content) for examples
- [Open an issue](../../issues/new/choose) for questions
- [Check closed PRs](../../pulls?q=is%3Apr+is%3Aclosed) for patterns

---

Thank you for contributing to ClaudePro Directory! Your additions help the entire Claude community. 🎉
