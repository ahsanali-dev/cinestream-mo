import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import PWARegistration from "@/components/PWARegistration";
import { QuickViewProvider } from "@/context/QuickViewContext";
import QuickViewModal from "@/components/QuickViewModal";

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "CineStream | Premium Movie & TV Series Streaming",
    template: "%s | CineStream",
  },
  description: "Stream the latest trending movies and popular TV shows in high definition on CineStream. Explore action, horror, comedy, and animation collections.",
  keywords: [
    "CineStream",
    "Stream movies",
    "Watch TV shows",
    "Free streaming HD",
    "Trending movies",
    "Popular TV series",
    "Action movies",
    "Horror films",
    "Online cinema",
    "Watch movies free"
  ],
  authors: [{ name: "CineStream Team" }],
  creator: "CineStream Team",
  publisher: "CineStream",
  manifest: "/manifest.json",
  metadataBase: new URL("https://cinestream-mo.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cinestream-mo.vercel.app",
    siteName: "CineStream",
    title: "CineStream | Premium Movie & TV Series Streaming",
    description: "Stream the latest trending movies and popular TV shows in high definition on CineStream. Explore action, horror, comedy, and animation collections.",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "CineStream logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineStream | Premium Movie & TV Series Streaming",
    description: "Stream the latest trending movies and popular TV shows in high definition on CineStream.",
    images: ["/icon-512x512.png"],
    creator: "@cinestream",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineStream",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CineStream",
    alternateName: ["CineStream Movies", "CineStream HD"],
    url: "https://cinestream-mo.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://cinestream-mo.vercel.app/explore?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CineStream",
    url: "https://cinestream-mo.vercel.app",
    logo: "https://cinestream-mo.vercel.app/logo.png",
    description: "CineStream is a modern streaming platform offering thousands of movies and TV series in HD with Hindi Dubbed audio.",
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CineStream",
    url: "https://cinestream-mo.vercel.app",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: "Stream trending movies and popular TV shows online in 1080p HD with Hindi Dubbed audio and multi-language subtitles.",
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
        <link rel="alternate" type="application/rss+xml" title="CineStream RSS Feed" href="/feed.xml" />
      </head>
      <body 
        className="flex min-h-screen bg-[#0a0a0b] text-white antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="afterInteractive" />
        <QuickViewProvider>
          <PWARegistration />
          <Sidebar />
          <Header />
          <div className="flex-1 md:ml-20 w-full overflow-x-hidden pb-16 md:pb-0 pt-20">
            {children}
          </div>
          <BottomNav />
          <QuickViewModal />
        </QuickViewProvider>
      </body>
    </html>
  );
}
