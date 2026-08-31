import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gqgamvavrqavifthxglc.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      "/comparisons",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/dashboard",
      "/values",
      "/watchlist",
      "/purchases",
      "/transportation",
      "/reports",
      "/live-bid",
      "/acquisition",
      "/auction-fees",
    ].map((source) => ({ source, destination: "/", permanent: false }));
  },
};

export default nextConfig;
