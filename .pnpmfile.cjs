/**
 * pnpmfile.cjs - Package Manifest Modification Hook
 * 
 * This file modifies package manifests during installation to optimize dependencies.
 * Currently used to limit Sharp platform binaries to Linux x64 only (for Netlify Functions).
 * 
 * @see https://pnpm.io/pnpmfile
 */

function readPackage(pkg, context) {
  // Only modify Sharp's optionalDependencies to install Linux x64 binaries only
  // This prevents installing ~150MB of unnecessary platform binaries (macOS, ARM, etc.)
  // Netlify Functions run on Linux x64, so we only need those binaries
  if (pkg.name === 'sharp') {
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
    Object.keys(linuxX64Only).forEach(key => {
      if (!linuxX64Only[key]) {
        delete linuxX64Only[key];
      }
    });

    // Replace optionalDependencies with Linux x64 only
    if (Object.keys(linuxX64Only).length > 0) {
      pkg.optionalDependencies = linuxX64Only;
      
      // Log what we're doing (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[pnpmfile] Modified sharp@${pkg.version}: ` +
          `Keeping only Linux x64 binaries (${Object.keys(linuxX64Only).length} packages) ` +
          `instead of ${originalCount} platform binaries`
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
