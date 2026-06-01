import type { NextConfig } from "next";
import path from "path";

const isCI = process.env.CI === "true";

const nextConfig: NextConfig = {
  // Locally: set root to avoid multiple-lockfile confusion.
  // In CI: empty turbopack config to silence webpack+turbopack coexistence warning.
  turbopack: isCI ? {} : { root: path.resolve(__dirname) },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("maplibre-gl");
      }
    }
    return config;
  },
};

export default nextConfig;
