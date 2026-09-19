import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["cheerio", "iconv-lite"],
};

export default nextConfig;
