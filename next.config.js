/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output dramatically shrinks the production image — Next.js
  // copies only the files needed to run the server.
  output: "standalone",

  // Trust the X-Forwarded-* headers set by nginx-proxy.
  experimental: {
    // Increase if you stream large uploads; the storage volume is local disk.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // The Stripe webhook route reads the raw body, so disable body parsing
  // there. (Configured per-route via `export const runtime = "nodejs"` and
  // manual `await req.text()` parsing in route.ts.)
  poweredByHeader: false,
};

module.exports = nextConfig;
