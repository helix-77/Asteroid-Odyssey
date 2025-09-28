/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [
      {
        source: "/data/:path*",
        destination: "/data/:path*",
      },
    ];
  },
};

export default nextConfig;
