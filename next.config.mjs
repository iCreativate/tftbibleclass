/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3007"]
    }
  }
};

export default nextConfig;
