const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Output standalone for Docker deployment
  output: 'standalone',
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Webpack configuration
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  
  // Image optimization
  images: {
    domains: ['t.me'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.telegram.org',
      },
    ],
  },
  
  // Headers for Telegram WebApp
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://web.telegram.org',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://web.telegram.org https://telegram.org",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

