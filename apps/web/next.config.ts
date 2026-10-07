import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace package (TypeScript source) with the app.
  transpilePackages: ['@ember/shared'],
  // Linting is run separately via the root `pnpm lint`; skip it during builds.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
