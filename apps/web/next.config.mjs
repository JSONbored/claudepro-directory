import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  turbopack: {
    root: resolve(__dirname, "../..")
  }
};

export default nextConfig;
