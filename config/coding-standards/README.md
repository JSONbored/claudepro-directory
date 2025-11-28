# Coding Standards

This directory contains coding standards and guidelines for the codebase. These documents are used by CodeRabbit and other code review tools to ensure consistency and quality.

## Documents

- **[Logging & Error Instrumentation Standards](./logging-standards.md)** - Structured logging patterns, error handling, and instrumentation requirements
- **[ESLint Architectural Rules](../tools/ESLINT_RULES.md)** - Custom ESLint rules and enforcement patterns

## Purpose

These standards ensure:
- ✅ Consistent logging and error handling across all code
- ✅ Proper instrumentation for debugging and monitoring
- ✅ Code quality and maintainability
- ✅ Security best practices (PII handling, error sanitization)

## Usage

These standards are automatically applied by:
- **CodeRabbit** - Code review tool reads these files for review guidelines
- **ESLint** - Custom rules enforce these patterns at build time
- **Development Workflow** - Developers reference these when writing code

---

**Note**: These are public-facing standards suitable for open source contribution. For internal project management documents, see `.cursor/` directory (gitignored).
