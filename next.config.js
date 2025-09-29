/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Handle environment variables
  env: {
    // Use direct backend URL for API calls
    API_BASE_URL: 'http://localhost:5000/api',
  },

  // Configure CORS headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Configure allowed dev origins for Replit
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN,
    'localhost:3000',
  ].filter(Boolean),
};

module.exports = nextConfig;