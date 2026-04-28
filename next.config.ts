import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build for Vultr Docker deployment.
  // Produces .next/standalone/ which can be copied into a slim Node image.
  output: "standalone",
  images: {
    // Vultr deploy serves images from /public and Supabase Storage URLs;
    // skip the loader to avoid extra runtime cost on a single-VM host.
    unoptimized: true,
  },
  devIndicators: false,
  // Trust the bar.daimasu.com.ph proxy that nginx terminates.
  poweredByHeader: false,
};

export default nextConfig;
