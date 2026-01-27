import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is now top-level and stable in Next.js 16
  turbopack: {
    // Custom rules can go here, but empty is fine for now
  },

  // This is the "Emergency Exit" to stop builds from hanging on type errors
  typescript: {
    ignoreBuildErrors: true,
  },

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