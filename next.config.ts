import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3", "bcrypt"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
