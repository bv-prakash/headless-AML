import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: (() => {
      const defaults = [
        {
          protocol: "https" as const,
          hostname: "americanlighting.com",
          pathname: "/**",
        },
        {
          protocol: "https" as const,
          hostname: "www.americanlighting.com",
          pathname: "/**",
        },
      ];

      const mediaBase = process.env.NEXT_PUBLIC_IMAGE_DOMAIN;
      if (!mediaBase) return defaults;

      try {
        const { hostname, protocol } = new URL(mediaBase);
        return [
          ...defaults,
          {
            protocol: (protocol.replace(":", "") as "http" | "https") || "https",
            hostname,
            pathname: "/**",
          },
        ];
      } catch {
        return defaults;
      }
    })(),
  },
};

export default nextConfig;
