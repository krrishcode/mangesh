import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  images: { unoptimized: true },
};

export default nextConfig;
