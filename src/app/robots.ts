import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portfolio-analytics", "/hosted"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
