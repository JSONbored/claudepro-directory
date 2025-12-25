/**
 * pnpmfile.cjs - Package Manifest Modification Hook
 *
 * This file modifies package manifests during installation to optimize dependencies.
 * Platform-aware Sharp binary configuration:
 * - Local development: Allows current platform binaries (macOS, Linux, etc.)
 * - Netlify/CI builds: Restricts to Linux x64 only (for Netlify Functions)
 *
 * @see https://pnpm.io/pnpmfile
 */

function readPackage(pkg, context) {
  // Only modify Sharp's optionalDependencies for production/CI builds
  // Local development needs platform-specific binaries (macOS, Linux, etc.)
  // Netlify Functions run on Linux x64, so we only need those binaries in production
  if (pkg.name === 'sharp') {
    // Detect if we're in a CI/production environment (Netlify, GitHub Actions, etc.)
    const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const isNetlifyBuild = process.env.NETLIFY === 'true';

    // Only restrict to Linux x64 for Netlify builds or CI environments
    // Local development needs platform-specific binaries
    if (isNetlifyBuild || (isCI && isProduction)) {
      // Store original count for logging
      const originalCount = Object.keys(pkg.optionalDependencies || {}).length;

      // Keep only Linux x64 binaries (needed for Netlify Functions)
      // Remove all other platform binaries (macOS, ARM, Windows, etc.)
      const linuxX64Only = {
        // Core Sharp Linux x64 binary
        '@img/sharp-linux-x64': pkg.optionalDependencies?.['@img/sharp-linux-x64'],
        // libvips Linux x64 binary (required for Sharp to work)
        '@img/sharp-libvips-linux-x64': pkg.optionalDependencies?.['@img/sharp-libvips-linux-x64'],
      };

      // Remove undefined entries (in case version doesn't match)
      Object.keys(linuxX64Only).forEach((key) => {
        if (!linuxX64Only[key]) {
          delete linuxX64Only[key];
        }
      });

      // Replace optionalDependencies with Linux x64 only
      if (Object.keys(linuxX64Only).length > 0) {
        pkg.optionalDependencies = linuxX64Only;

        // Log what we're doing
        console.log(
          `[pnpmfile] Modified sharp@${pkg.version} for ${isNetlifyBuild ? 'Netlify' : 'CI'} build: ` +
            `Keeping only Linux x64 binaries (${Object.keys(linuxX64Only).length} packages) ` +
            `instead of ${originalCount} platform binaries`
        );
      }
    } else {
      // Local development: Don't modify - allow all platform binaries
      // This ensures sharp works correctly on macOS, Linux, Windows during development
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[pnpmfile] Allowing all platform binaries for sharp@${pkg.version} (local development)`
        );
      }
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
