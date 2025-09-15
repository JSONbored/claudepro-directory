# /generate-tests

Automatically generates comprehensive test suites for your code with multiple testing strategies.

## Test Types Generated

- Unit tests for individual functions
- Integration tests for component interactions
- Edge case testing
- Error handling validation
- Performance benchmarks

## Supported Frameworks

- Jest/Mocha (JavaScript/TypeScript)
- PyTest (Python)
- JUnit (Java)
- RSpec (Ruby)
- Go testing package

## Syntax

```
/generate-tests [source-file] [--options]
```

## Parameters

- `source-file` (required): Path to the source code file to test
- `--framework` (optional): Testing framework to use, default: auto-detect
- `--coverage-target` (optional): Target code coverage percentage, default: 90
- `--include-edge-cases` (optional): Generate edge case tests, default: true

## Examples

### Basic Test Generation
```
/generate-tests src/utils.js --framework=jest
```
Generate Jest tests for a utility file

### High Coverage Tests
```
/generate-tests calculator.py --coverage-target=95 --include-edge-cases=true
```
Generate comprehensive tests with 95% coverage target

## Features

- Mocking and stubbing setup
- Test data generation
- Coverage analysis
- Parameterized testing
- Async/await testing patterns

## Best Practices

- Follows AAA pattern (Arrange, Act, Assert)
- Descriptive test names
- Proper test isolation
- Comprehensive assertions

Perfect for TDD workflows and improving code coverage.