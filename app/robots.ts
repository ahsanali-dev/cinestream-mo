import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/watchlist"],
    },
    sitemap: "https://cinestream-mo.vercel.app/sitemap.xml",
  };
}
