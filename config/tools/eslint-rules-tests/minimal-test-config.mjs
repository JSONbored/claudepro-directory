/**
 * Minimal ESLint config for testing custom rules
 * Disables all type-checked rules to avoid type information requirements
 */

import architecturalRules from '../eslint-plugin-architectural-rules.js';

export default [
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // No type checking for test files
        projectService: null,
      },
    },
    plugins: {
      'architectural-rules': architecturalRules,
    },
    rules: {
      // Only enable our custom rules for testing
      'architectural-rules/no-css-variables-in-classname': 'warn',
      'architectural-rules/prefer-design-tokens-over-arbitrary-values': 'warn',
      // Disable all other rules to focus on testing our custom rules
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
