import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

await initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async redirects() {
    return [
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
