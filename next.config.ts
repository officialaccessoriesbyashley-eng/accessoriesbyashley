import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Delegate resizing to the CDN — avoids Next.js downloading full-size images
    // and hitting the 8s optimization timeout for large phone-camera uploads.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
  },
};

export default nextConfig;
