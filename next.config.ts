import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set COOP and COEP headers for o1js WASM support
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },

  // Enable webpack 5 for WASM support
  webpack: (config, { isServer }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Configure WASM file handling
    if (!config.resolve.extensions?.includes(".wasm")) {
      config.resolve.extensions = config.resolve.extensions || [];
      config.resolve.extensions.push(".wasm");
    }

    // Add fallbacks for Node.js modules that aren't available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Handle WASM files - allow them to be loaded as assets
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },

  // Optimize for o1js
  experimental: {
    serverComponentsExternalPackages: ["o1js"],
  },
};

export default nextConfig;