import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable API routes (can't use static export with API routes)
  // output: 'export', // Commented out - we need server-side API routes
  
  // Environment variables available to API routes
  env: {
    DASHBOARD_DATA_PATH: './data/dashboard-data.json',
  },
  
  // Optional: Add rewrites or headers if needed
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
