import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages — no server needed
  output: "export",

  // Required for static export — Next.js Image optimization needs a server
  images: { unoptimized: true },

  // For username.github.io (main pages site) — leave empty
  // For username.github.io/repo-name (project site) — set to "/repo-name"
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

export default nextConfig;
