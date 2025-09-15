import { Command } from './index';

export const generateTestsCommand: Command = {
  id: 'generate-tests',
  title: '/generate-tests',
  description: 'Automatically generate comprehensive test suites with unit, integration, and end-to-end tests',
  author: '@JSONbored',
  category: 'development',
  tags: ['testing', 'automation', 'quality-assurance', 'unit-tests', 'integration-tests'],
  content: `# /generate-tests Command

Automatically generate comprehensive test suites for your code with intelligent coverage analysis and multiple testing frameworks support.

## Test Types Generated:

### Unit Tests
- Function and method testing
- Class and component testing
- Mock and stub generation
- Edge case identification
- Input validation testing

### Integration Tests
- API endpoint testing
- Database integration tests
- Service interaction tests
- Module integration validation
- External dependency testing

### End-to-End Tests
- User workflow testing
- Complete feature testing
- Cross-browser compatibility
- Performance testing scenarios
- Accessibility testing

## Framework Support:

### JavaScript/TypeScript
- Jest, Mocha, Jasmine
- React Testing Library, Enzyme
- Cypress, Playwright, Selenium
- Supertest for API testing

### Python
- pytest, unittest, nose2
- Mock, MagicMock
- Selenium, pytest-django
- FastAPI TestClient

### Other Languages
- JUnit (Java), NUnit (C#)
- RSpec (Ruby), PHPUnit (PHP)
- Go testing package
- Rust cargo test

## Features:

### Intelligent Coverage
- Automated test case discovery
- Branch and condition coverage
- Boundary value testing
- Error condition testing
- Performance benchmarks

### Best Practices
- Arrange-Act-Assert pattern
- Descriptive test naming
- Proper setup and teardown
- Isolation and independence
- Maintainable test structure

### Custom Configuration
- Testing framework selection
- Coverage requirements
- Mock strategy preferences
- Test environment setup
- CI/CD integration

Perfect for maintaining code quality, preventing regressions, and ensuring robust software delivery.`,
  slug: 'generate-tests',
  popularity: 89,
  createdAt: '2025-08-14',
  updatedAt: '2024-01-15',
  featured: false,
  syntax: '/generate-tests [file|directory] [--type=unit|integration|e2e|all] [--framework=auto|jest|pytest|etc] [--coverage=basic|thorough]',
  parameters: [
    {
      name: 'target',
      type: 'string',
      required: true,
      description: 'File or directory to generate tests for'
    },
    {
      name: 'type',
      type: 'string',
      required: false,
      description: 'Test type: unit, integration, e2e, or all',
      default: 'unit'
    },
    {
      name: 'framework',
      type: 'string',
      required: false,
      description: 'Testing framework (auto-detected if not specified)',
      default: 'auto'
    },
    {
      name: 'coverage',
      type: 'string',
      required: false,
      description: 'Coverage level: basic or thorough',
      default: 'basic'
    }
  ],
  examples: [
    {
      title: 'Generate unit tests',
      command: '/generate-tests src/utils.js --type=unit --framework=jest',
      description: 'Create Jest unit tests for utility functions'
    },
    {
      title: 'Full test suite',
      command: '/generate-tests src/ --type=all --coverage=thorough',
      description: 'Generate comprehensive test suite for entire source directory'
    },
    {
      title: 'Integration tests',
      command: '/generate-tests api/endpoints/ --type=integration --framework=supertest',
      description: 'Create integration tests for API endpoints'
    }
  ],
  platforms: ['CLI', 'IDE', 'CI/CD'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/generate-tests.ts'
};