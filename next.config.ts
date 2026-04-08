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
  images: {
    ...buildRemotePatterns(),
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "@apollo/client",
      "react-toastify",
      "swiper",
    ],
  },
};

export default nextConfig;
