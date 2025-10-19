/**
 * Category-Specific Validation Plugins
 *
 * Optional validators for categories that need custom validation logic
 * beyond the generic 6-step process.
 *
 * Only create validators here if validation CAN'T be generalized.
 * Most categories don't need this.
 *
 * @module config/content/validation/category-validators
 */

import type { CategoryValidator } from './generic-validator';

/**
 * MCP Server Category Validator
 *
 * MCP servers require either claudeDesktop or claudeCode configuration.
 * Also provides warnings for authentication and package recommendations.
 */
export const mcpCategoryValidator: CategoryValidator = (validated, errors, warnings) => {
  // Check configuration has at least one platform
  if (validated.configuration) {
    if (!(validated.configuration.claudeDesktop || validated.configuration.claudeCode)) {
      errors.push('Configuration: Must have either claudeDesktop or claudeCode configuration');
    }
  }

  // Check authentication consistency
  if (validated.requiresAuth && !validated.authType) {
    warnings.push('Authentication: requiresAuth is true but authType is not specified');
  }

  // Recommend security section for servers with authentication
  if (validated.requiresAuth && !validated.security) {
    warnings.push(
      'Security: Recommended to include security guidelines for servers requiring authentication'
    );
  }

  // Recommend package field for npm-based servers
  if (
    !validated.package &&
    validated.configuration?.claudeDesktop?.mcp &&
    Object.values(validated.configuration.claudeDesktop.mcp).some(
      (config: { command?: string[] }) => config.command?.some((cmd) => cmd.includes('npx'))
    )
  ) {
    warnings.push('Package: Recommended to specify NPM package identifier for npx-based servers');
  }
};

/**
 * Statuslines Category Validator
 *
 * Statuslines have optional preview field that should be recommended.
 */
export const statuslinesCategoryValidator: CategoryValidator = (validated, _errors, warnings) => {
  if (!validated.preview) {
    warnings.push('Preview: Recommended to include preview output');
  }
};

// Export all category validators
export const CATEGORY_VALIDATORS = {
  mcp: mcpCategoryValidator,
  statuslines: statuslinesCategoryValidator,
  // hooks, commands, rules, agents, skills, collections don't need custom validators
} as const;
