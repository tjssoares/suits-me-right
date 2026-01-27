/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Disable Turbopack for production builds specifically
  experimental: {
    turbo: {
      rules: {},
    },
  },
};

export default nextConfig;