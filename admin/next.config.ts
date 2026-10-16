import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nginx has a dedicated `location /admin-assets/ { proxy_pass
  // http://127.0.0.1:3002/; }` rule specifically for this app's static
  // files — without this, Next.js emits bare /_next/static/... URLs,
  // which fall through nginx's generic `/` rule to the frontend app
  // instead (404, since the frontend doesn't have these files). Only
  // applied in production — local dev accesses this app directly on its
  // own port, with no nginx prefix involved.
  assetPrefix: process.env.NODE_ENV === "production" ? "/admin-assets" : undefined,
};

export default nextConfig;
