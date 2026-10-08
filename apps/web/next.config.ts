import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the Next.js dev-mode indicator (the floating "N" button + its menu in
  // the corner). It is a dev-only overlay, never part of Ember and never shown
  // in production; this removes it from `next dev` too.
  devIndicators: false,
  // Compile the shared workspace package (TypeScript source) with the app.
  transpilePackages: ['@ember/shared'],
  // Linting is run separately via the root `pnpm lint`; skip it during builds.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
