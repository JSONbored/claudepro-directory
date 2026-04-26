import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

await initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.svg",
        permanent: true,
      },
      {
        source: "/hero.jpg",
        destination: "/og-image.png",
        permanent: true,
      },
      {
        source: "/trending",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/community",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/board",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/board/new",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/for-you",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/gallery",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/gallery/:category",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/browse",
        permanent: true,
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug",
        destination: "/guides/:slug",
        permanent: true,
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug/llms.txt",
        destination: "/guides/:slug/llms.txt",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
