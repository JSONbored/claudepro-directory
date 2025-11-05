# Contributing to ClaudePro Directory

Thank you for your interest in contributing to ClaudePro Directory! This guide will help you add new content to our community-driven collection of Claude configurations.

## 📋 Quick Start

**Option 1: Web Submission Form** (Recommended - Easiest)

Visit [claudepro.directory/submit](https://claudepro.directory/submit) to submit through our database-driven form:
- ✅ Dynamic field validation based on content type
- ✅ Auto-complete from curated database templates
- ✅ Real-time duplicate detection
- ✅ Automatic schema compliance checking

**Option 2: GitHub PR Submission** (For developers who prefer Git workflow)

1. **Fork** the repository
2. **Open a PR** using our [PR template](pull_request_template.md)
3. Our automation will extract your submission and validate it against our database schema
4. Once approved, your content will be automatically synced to our database

## 🎯 Content Types We Accept

| Type            | Description                           | Browse Live Examples                                  |
| --------------- | ------------------------------------- | ----------------------------------------------------- |
| **Agents**      | Specialized AI personas               | [claudepro.directory/agents](https://claudepro.directory/agents)           |
| **MCP Servers** | Model Context Protocol integrations   | [claudepro.directory/mcp](https://claudepro.directory/mcp)                 |
| **Commands**    | Quick automation slash commands       | [claudepro.directory/commands](https://claudepro.directory/commands)       |
| **Rules**       | System prompts & behavior guidelines  | [claudepro.directory/rules](https://claudepro.directory/rules)             |
| **Hooks**       | Event-driven automation scripts       | [claudepro.directory/hooks](https://claudepro.directory/hooks)             |
| **Statuslines** | Custom CLI status displays            | [claudepro.directory/statuslines](https://claudepro.directory/statuslines) |
| **Collections** | Curated bundles of related configs    | [claudepro.directory/collections](https://claudepro.directory/collections) |
| **Skills**      | Task-focused capability guides        | [claudepro.directory/skills](https://claudepro.directory/skills)           |

**Submit any content type at:** [claudepro.directory/submit](https://claudepro.directory/submit)

## 📝 How to Submit Content

### Method 1: Web Form (Recommended)

1. **Visit** [claudepro.directory/submit](https://claudepro.directory/submit)
2. **Sign in** with your GitHub account (required for submissions)
3. **Select** your content type from the dropdown
4. **Use Template** (optional) - Click to pre-fill with database examples
5. **Fill out** the dynamically generated form fields
6. **Submit** - Your submission enters our database as `pending` status
7. **Review** - Moderators review in our database
8. **Published** - Approved content goes live on the website

### Method 2: GitHub PR

1. **Fork** this repository
2. **Create** a pull request with your content submission
3. **Format** your submission using the plaintext template in our [PR template](pull_request_template.md)
4. **Validation** - Our GitHub workflow extracts and validates your submission against database schemas
5. **Review** - Same moderation process as web submissions
6. **Merge** - Approved PRs are auto-merged and synced to our database

## 🗄️ Our Database-First Architecture

**All content is stored in PostgreSQL, not JSON files.**

- ✅ **Dynamic forms**: Generated from `form_field_definitions` table
- ✅ **Validation**: PostgreSQL CHECK constraints enforce data quality
- ✅ **Templates**: Curated examples stored in `content_templates` table
- ✅ **Published content**: Lives in `content` table with full-text search
- ✅ **Submissions**: Tracked in `content_submissions` table with moderation workflow

**Note for developers:** The `content/skills/*.zip` files in this repo are backup copies only. Live skill downloads are served from Supabase Storage.

## 🧪 Testing Code Changes (For Developers)

If you're contributing **code changes** (not content submissions):

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run dev server:**
   ```bash
   pnpm dev
   ```

3. **Build:**
   ```bash
   pnpm build
   ```

4. **Lint:**
   ```bash
   pnpm lint
   ```

## 📤 PR Guidelines

### PR Title Format

```
Add [Type]: [Your Content Title]
```

Examples:
- `Add Agent: TypeScript Code Reviewer`
- `Add MCP: PostgreSQL Server`
- `Add Rule: React Best Practices`

Or for code changes:
- `fix: resolve build error in submit form`
- `feat: add new validation rule`

### Checklist Before Submitting

**For Content Submissions:**
- [ ] Tested your configuration and it works
- [ ] Removed all API keys, secrets, and personal information
- [ ] Content is original or properly attributed
- [ ] No spam or promotional content

**For Code Changes:**
- [ ] Build passes (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Tested locally
- [ ] Updated documentation if needed

## 🚫 What NOT to Include

- Personal information (emails, passwords, API keys)
- Copyrighted content without permission
- Malicious or harmful configurations
- Advertisements or spam
- Low-quality or duplicate content

## 💡 Tips for Great Contributions

1. **Clear Names** - Be specific about what your content does
2. **Detailed Descriptions** - Help users understand the value (1-2 sentences)
3. **Comprehensive Content** - Include examples and explanations
4. **Proper Formatting** - Use markdown for better readability
5. **Relevant Tags** - Help users discover your content (3-5 recommended)

## 🤝 Community Guidelines

- Be respectful and constructive
- Help review other contributions
- Report issues or improvements
- Share knowledge and learn from others

## 📚 Additional Resources

- **Browse Live Examples**: [claudepro.directory](https://claudepro.directory)
- **Submit Form**: [claudepro.directory/submit](https://claudepro.directory/submit)
- **Open an Issue**: [Report bugs or request features](../../issues/new/choose)
- **View Closed PRs**: [See contribution patterns](../../pulls?q=is%3Apr+is%3Aclosed)

---

Thank you for contributing to ClaudePro Directory! Your additions help the entire Claude community. 🎉
