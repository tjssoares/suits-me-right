import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Move turbo out of experimental to the top level
  turbopack: {
    // If you had specific rules like SVGR, they go here
  },
  
  // REMOVE the 'eslint' block entirely. 
  // Next.js 16 handles this via eslint.config.mjs now.
  
  // Your other existing settings (images, redirects, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;