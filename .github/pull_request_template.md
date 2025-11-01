## What are you submitting?

- [ ] **Content Submission** (agent, MCP, command, hook, rule, statusline, skill, collection)
- [ ] Code change (bug fix, feature, refactor)

---

## 📝 For Content Submissions

### Option 1: Quick Submit (Plaintext - Recommended)

**Submit directly in this PR description using the template below:**

```
Content-Type: agents
Name: Your Content Name Here
Author: Your Name
Author-Profile: https://github.com/yourusername
Description: A concise 1-2 sentence description of what this does and why it's useful.
GitHub-URL: https://github.com/yourusername/your-repo
Tags: tag1, tag2, tag3

Content-JSON:
{
  "paste": "your",
  "json": "content",
  "here": "following the category schema"
}
```

**Our automation will:**
- ✅ Extract content from your PR description
- ✅ Validate format and required fields
- ✅ Create entry in submissions database
- ✅ Notify moderators via Discord
- ✅ Auto-merge to production when approved

---

### Option 2: Traditional File Submit

Add a JSON file to the appropriate category folder:

**File location:** `content/[category]/your-content-slug.json`

**Example for agents:**
```json
{
  "category": "agents",
  "slug": "your-agent-slug",
  "name": "Your Agent Name",
  "author": "Your Name",
  "authorProfileUrl": "https://github.com/yourusername",
  "description": "What this agent does",
  "content": "Agent configuration content here...",
  "tags": ["productivity", "automation"],
  "dateAdded": "2025-10-31",
  "githubUrl": "https://github.com/yourusername/your-repo"
}
```

**Required fields by category:**
- **All categories:** `category`, `slug`, `name`, `author`, `description`, `dateAdded`
- **Agents/Commands/Hooks/Rules/Statuslines:** `content` field with configuration
- **Skills:** ZIP file in `content/skills/` (see [skill template](../tree/main/templates/content/skills))
- **Collections:** `items` array with content references
- **MCP:** `serverConfig` object with connection details

---

### ✅ Submission Checklist

**Before submitting:**
- [ ] I tested this configuration and it works
- [ ] I removed all API keys, secrets, and personal information
- [ ] I added it to the correct category folder (or used plaintext template)
- [ ] Date format is YYYY-MM-DD
- [ ] Description is clear and concise (1-2 sentences)
- [ ] Tags are relevant and specific

**Quality guidelines:**
- [ ] Content is original or properly attributed
- [ ] No spam or promotional content
- [ ] Follows community guidelines
- [ ] Adds value to the directory

---

### 📚 Need Help?

**Templates & Examples:**
- Copy templates from [`templates/content/`](../tree/main/templates/content)
- Check real examples in [`content/`](../tree/main/content) folders
- Read [CONTRIBUTING.md](../blob/main/.github/CONTRIBUTING.md) for detailed guidelines

**Category-Specific Guides:**
- [Agents](../blob/main/docs/content-types/agents.md)
- [MCP Servers](../blob/main/docs/content-types/mcp.md)
- [Commands](../blob/main/docs/content-types/commands.md)
- [Hooks](../blob/main/docs/content-types/hooks.md)
- [Rules](../blob/main/docs/content-types/rules.md)
- [Skills](../blob/main/docs/content-types/skills.md)

---

## 🔧 For Code Changes

**What changed and why?**

<!-- Describe your code changes here -->

**Type of change:**
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Refactor (code change that neither fixes a bug nor adds a feature)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test coverage improvement

**Testing:**
- [ ] Build passes (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)

**Checklist:**
- [ ] Code follows project style guide
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Updated documentation if needed
- [ ] No breaking changes (or documented in PR description)

---

<!-- 🤖 Our validation bot will automatically check your submission -->
