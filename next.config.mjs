/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["72.62.35.185", "10.0.10.41"],
  images: {
    localPatterns: [
      {
        pathname: "/api/documents/**",
        search: "?variant=thumb",
      },
      {
        pathname: "/api/vehicle-photos/**",
        search: "?variant=thumb",
      },
    ],
  },
  experimental: {
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
