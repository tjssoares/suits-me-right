import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is now stable and top-level in Next.js 16
  turbopack: {
    // Custom rules go here if needed
  },

  // Note: 'eslint' and 'experimental.turbo' are removed 
  // as they cause hangs in Next.js 16
  
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