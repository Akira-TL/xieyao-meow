import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack(config, { dev }) {
    if (dev) {
      // Next 15.4's filesystem cache can race during rapid HMR rebuilds and leave
      // transient clientReferenceManifest / JSON parse failures. Keep local demo
      // rendering deterministic; production builds still use the normal cache path.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
