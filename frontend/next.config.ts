import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Remote product/brand/category/vendor imagery comes from the FastAPI
    // backend (picsum placeholders + locally uploaded files under /uploads).
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
       {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
