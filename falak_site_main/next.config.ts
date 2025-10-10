import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          // Optional: some CDNs honor this header specifically. Harmless if ignored.
          { key: "CDN-Cache-Control", value: "max-age=31536000" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy unified events route now permanently points to sports cluster
      {
        source: "/events",
        destination: "/sports",
        permanent: true,
      },
      // Preserve deep links under /events/... by mapping path segments to sports
      // Adjust later if you want smarter per-category routing (e.g. cultural)
      {
        source: "/events/:path*",
        destination: "/sports/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
