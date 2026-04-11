import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

await initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async redirects() {
    return [
      // Legacy path redirects from pre-relaunch site structure
      {
        source: "/trending",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/community",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/board",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/board/new",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/for-you",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/gallery",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/gallery/:category",
        destination: "/browse",
        permanent: true
      },
      {
        source: "/search",
        destination: "/browse",
        permanent: true
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug",
        destination: "/guides/:slug",
        permanent: true
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug/llms.txt",
        destination: "/guides/:slug/llms.txt",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "claudepro.directory" }],
        destination: "https://heyclau.de/:path*",
        permanent: true
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.claudepro.directory" }],
        destination: "https://heyclau.de/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
