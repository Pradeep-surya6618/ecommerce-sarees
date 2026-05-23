import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow the dev server to accept cross-origin requests from devices on the
  // local network (e.g. testing on a phone at http://192.168.1.x:3000). Without
  // this, Next 16 blocks RSC / HMR / server-action calls from non-localhost
  // origins, which breaks client interactivity (search, menus, timers).
  allowedDevOrigins: ["192.168.1.6", "192.168.1.*", "192.168.0.*", "10.0.0.*", "*.local"],
  images: {
    // Bypass Next.js image optimization entirely — serve admin-uploaded
    // images straight from CloudFront at their original resolution and
    // quality. The default 75% quality + AVIF/WebP transcode noticeably
    // degrades detail on saree photography (zari work, fabric weave),
    // which the team wants to preserve. CloudFront still caches at the
    // edge, so bandwidth and TTFB are unchanged.
    unoptimized: true,
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
  },
};

export default nextConfig;
