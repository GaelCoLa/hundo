import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// El plugin conecta next-intl con src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Portadas de IGDB servidas a través de next/image (optimizadas y con caché).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.igdb.com", pathname: "/igdb/image/upload/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
