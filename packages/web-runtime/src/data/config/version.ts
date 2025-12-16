/**
 * Application Version
 *
 * This file exports the application version from the root package.json.
 * This version should be kept in sync with the root package.json version.
 *
 * To update: Run `pnpm bump:patch/minor/major` which will update both
 * package.json and this file automatically.
 *
 * @see {@link ../../../../package.json | Root package.json}
 */

/**
 * Application version from root package.json
 * This should match the version in the root package.json file
 */
export const APP_VERSION = '1.1.0' as const;
