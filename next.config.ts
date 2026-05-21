import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow the dev server to accept cross-origin requests from devices on the
  // local network (e.g. testing on a phone at http://192.168.1.x:3000). Without
  // this, Next 16 blocks RSC / HMR / server-action calls from non-localhost
  // origins, which breaks client interactivity (search, menus, timers).
  allowedDevOrigins: ["192.168.1.6", "192.168.1.*", "192.168.0.*", "10.0.0.*", "*.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "d177stdfdu6ts7.cloudfront.net",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
