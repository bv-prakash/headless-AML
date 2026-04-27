import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

loadEnvConfig(process.cwd());

const isDev = process.env.NODE_ENV !== "production";

/**
 * Env vars that may contain domains serving images.
 * Add new entries here when the project adds more image sources.
 */
const IMAGE_SOURCE_VARS = [
  "NEXT_PUBLIC_IMAGE_DOMAIN",
  "NEXT_PUBLIC_COMMERCE_BASE_URL",
] as const;

/**
 * Safely extract a hostname (and optional port) from a raw env value.
 *
 * Handles every edge-case the team has hit so far:
 *  - value is undefined / empty / whitespace-only
 *  - value is a bare domain without protocol  ("example.com/media")
 *  - value has a trailing path                 ("https://example.com/media/")
 *  - value has a port                          ("https://local.ddev.site:8443")
 *  - value is completely invalid               ("not a url at all")
 */
function extractHost(raw: string | undefined): {
  hostname: string;
  port: string;
} | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  const urlCandidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const { hostname, port } = new URL(urlCandidate);
    if (!hostname || hostname === "localhost") return null;
    return { hostname, port };
  } catch {
    return null;
  }
}

function buildRemotePatterns(): NextConfig["images"] {
  const seen = new Set<string>();
  const patterns: NonNullable<
    NonNullable<NextConfig["images"]>["remotePatterns"]
  > = [];

  for (const envKey of IMAGE_SOURCE_VARS) {
    const host = extractHost(process.env[envKey]);
    if (!host) continue;

    const key = `${host.hostname}:${host.port}`;
    if (seen.has(key)) continue;
    seen.add(key);

    patterns.push({
      hostname: host.hostname,
      ...(host.port ? { port: host.port } : {}),
      pathname: "/**",
    });
  }

  if (patterns.length === 0 || isDev) {
    patterns.push({ hostname: "**" });
  }

  return { remotePatterns: patterns };
}

const nextConfig: NextConfig = {
  i18n: {
    locales: ["en", "ar"],
    defaultLocale: "en",
  },
  
  images: {
    ...buildRemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
  /**
   * Next 16 + Turbopack can disagree with the browser on `serveStreamingMetadata`, so
   * `Next.MetadataOutlet` renders `<Suspense>` on one side and a non-Suspense tree on
   * the other → recoverable hydration mismatch (`__next_outlet_boundary__`).
   *
   * Matching every real User-Agent here forces the non-streaming metadata path for
   * normal document loads (same tree server + client). Tags still resolve; only the
   * streaming wrapper shape changes. If you need streaming metadata for crawlers,
   * narrow this regex or use `npm run dev:webpack` while debugging.
   *
   * @see `next/dist/lib/metadata/metadata.js` (`createMetadataComponents` / `MetadataOutlet`)
   */
  htmlLimitedBots: /.*/,
  experimental: {
    // Faster incremental builds
    staticGenerationRetryCount: 1,
    /**
     * Do **not** enable `optimizePackageImports` for `@apollo/client` / `swiper` / `react-redux`
     * here — Next can strip exports that Apollo links rely on at runtime, which breaks cart,
     * checkout, PLP `ProductActions`, and other GraphQL flows after a “perf” change.
     */
  },
  // Better page loading for faster development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
};

export default nextConfig;

