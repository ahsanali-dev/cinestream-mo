import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/watchlist"],
    },
    sitemap: [
      "https://movieszonestream.vercel.app/sitemap.xml",
      "https://movieszonestream.vercel.app/feed.xml",
    ],
  };
}
