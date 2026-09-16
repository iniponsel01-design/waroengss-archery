/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google Drive thumbnail endpoint
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/thumbnail**",
      },
      // Google user content (thumbnails via lh3)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    // Disable image optimization for external Drive URLs
    // (Drive already serves optimized thumbnails)
    unoptimized: false,
    dangerouslyAllowSVG: false,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
