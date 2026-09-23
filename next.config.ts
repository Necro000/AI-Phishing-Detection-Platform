import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*)onrender\\.com',
          },
        ],
        destination: '/api',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
