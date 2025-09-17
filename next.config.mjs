/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds since we use Biome/Ultracite
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We handle TypeScript checking separately
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;