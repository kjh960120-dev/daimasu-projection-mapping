import type { NextConfig } from "next";

/**
 * Content-Security-Policy — restaurant site + Stripe checkout + Supabase API.
 * `'unsafe-inline'` on style-src is unavoidable while Tailwind v4 ships
 * runtime arbitrary-class CSS; script-src stays strict (no unsafe-inline).
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://www.google-analytics.com",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.telegram.org https://api.resend.com https://www.google-analytics.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
