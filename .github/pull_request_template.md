## What type of change is this?

- [ ] **Code change** (bug fix, feature, refactor, performance, documentation)
- [ ] **Content submission** (agent, MCP, rule, command, hook, statusline, skill, collection)

---

## ⚠️ For Content Submissions

**Please use our web form instead:** [claudepro.directory/submit](https://claudepro.directory/submit)

Our database-driven submission system provides:
- ✅ Guided form with dynamic field validation
- ✅ Template starter options from our database
- ✅ Real-time duplicate detection
- ✅ Automatic schema compliance checking
- ✅ Faster review process

**Why use the web form?**
- No need to manually format JSON
- See exactly what fields are required for your content type
- Get instant feedback on validation errors
- Track your submission status in your account

**Alternative:** If you prefer GitHub, [open an issue instead](../../issues/new?template=submit_content.yml) - our issue template will guide you to the web form.

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
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Tested locally
- [ ] Added/updated tests if applicable

**Checklist:**
- [ ] Code follows project style guide (database-first architecture)
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Updated documentation if needed
- [ ] No breaking changes (or documented in PR description)
- [ ] Verified against database schema if touching data layer

**Database Changes (if applicable):**
- [ ] Migration file included
- [ ] RPC functions tested
- [ ] RLS policies verified
- [ ] Generated types updated (`pnpm generate:types`)
- [ ] Database indexes considered

---

<!-- 🤖 Our validation bot will automatically check code submissions -->
