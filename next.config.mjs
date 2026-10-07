/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3007"]
    }
  }
};

export default nextConfig;
