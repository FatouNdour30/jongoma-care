import type { NextConfig } from "next";

// Prototype entièrement dynamique (données modifiées à chaque action) :
// Cache Components désactivé volontairement.
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
