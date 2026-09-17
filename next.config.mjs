/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TS + ESLint during build — avoids SIGSEGV on constrained build environments
  // Type checking should be run separately: npm run typecheck
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/thumbnail**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: false,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
