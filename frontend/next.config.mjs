/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a small self-contained server for Docker (see Dockerfile).
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
