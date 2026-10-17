import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  reactStrictMode: true,
  transpilePackages: ["@skeleton-crew/blocks"],
};

export default nextConfig;
