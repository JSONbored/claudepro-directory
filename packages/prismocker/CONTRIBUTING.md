# Contributing to prismocker

Thank you for your interest in contributing to `prismocker`! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

* Node.js 18+
* pnpm 10+ (or npm/yarn)

### Setup Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/JSONbored/prismocker.git
   cd prismocker
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Verify setup:**
   ```bash
   pnpm type-check  # Type check
   pnpm build       # Build
   pnpm test        # Run tests
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/__tests__/client.test.ts
```

### Building

```bash
# Build for production
pnpm build

# Build in watch mode (development)
pnpm dev
```

### Type Checking

```bash
pnpm type-check
```

## Code Style

* **TypeScript:** Use strict mode, proper types (no `any` unless absolutely necessary)
* **Formatting:** Code should be formatted consistently (Prettier recommended)
* **Naming:** Use clear, descriptive names
* **Comments:** Add JSDoc comments for public APIs

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add support for custom query executors
fix: correct relation loading for nested includes
docs: update README with new examples
test: add tests for transaction rollback
chore: update dependencies
```

**Types:**

* `feat`: New feature
* `fix`: Bug fix
* `docs`: Documentation changes
* `test`: Test additions/changes
* `chore`: Maintenance tasks (dependencies, tooling, etc.)

## Pull Request Process

1. **Create a branch:**

   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bug-fix
   ```

2. **Make your changes:**
   * Write code
   * Add/update tests
   * Update documentation if needed

3. **Verify your changes:**

   ```bash
   pnpm type-check
   pnpm build
   pnpm test
   ```

4. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feat/my-feature
   ```
   Then create a pull request on GitHub.

## Testing Requirements

* **All new features must include tests**
* **All bug fixes must include regression tests**
* **Tests should be comprehensive and cover edge cases**
* **All tests must pass before PR is merged**

## Documentation

* **Update README.md** if adding new features or changing API
* **Add examples** if introducing new patterns
* **Update CHANGELOG.md** for user-facing changes

## Questions?

Feel free to open an issue for questions or discussions!

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.
