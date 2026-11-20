import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// El plugin conecta next-intl con src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Portadas de IGDB servidas a través de next/image (optimizadas y con caché).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.igdb.com", pathname: "/igdb/image/upload/**" },
      // Avatares en Supabase Storage (el host sale de la variable de cada entorno).
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/avatars/**" }] : []),
    ],
  },
  experimental: {
    // Las server actions aceptan hasta 1 MB por defecto; el avatar puede pesar
    // 2 MB más lo que agrega el formulario.
    serverActions: { bodySizeLimit: "3mb" },
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
