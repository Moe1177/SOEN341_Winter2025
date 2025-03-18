import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["assets.aceternity.com", "images.unsplash.com"], // Add this domain
  },
  eslint: {
    // Disable ESLint in production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
