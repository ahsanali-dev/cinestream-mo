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
  themeColor: "#080A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "MoviesZone | Free HD Movie & TV Series Streaming",
    template: "%s | MoviesZone",
  },
  description: "Stream the latest trending movies and popular TV shows in high definition on MoviesZone. Explore action, Hindi Dubbed, drama, comedy, and anime collections.",
  keywords: [
    "MoviesZone",
    "MoviesZone Stream",
    "Stream movies",
    "Watch TV shows",
    "Free streaming HD",
    "Hindi Dubbed movies",
    "Trending movies",
    "Popular TV series",
    "Action movies",
    "Online cinema",
    "Watch movies free"
  ],
  authors: [{ name: "MoviesZone Team" }],
  creator: "MoviesZone Team",
  publisher: "MoviesZone",
  manifest: "/manifest.json",
  metadataBase: new URL("https://movieszonestream.vercel.app"),
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
    url: "https://movieszonestream.vercel.app",
    siteName: "MoviesZone",
    title: "MoviesZone | Free HD Movie & TV Series Streaming",
    description: "Stream the latest trending movies and popular TV shows in high definition on MoviesZone. Explore action, Hindi Dubbed, drama, comedy, and anime collections.",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MoviesZone logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoviesZone | Free HD Movie & TV Series Streaming",
    description: "Stream the latest trending movies and popular TV shows in high definition on MoviesZone.",
    images: ["/icon-512x512.png"],
    creator: "@movieszone",
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
    title: "MoviesZone",
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
    name: "MoviesZone",
    alternateName: ["MoviesZone Stream", "MoviesZone HD", "MoviesZone App"],
    url: "https://movieszonestream.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://movieszonestream.vercel.app/explore?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MoviesZone",
    url: "https://movieszonestream.vercel.app",
    logo: "https://movieszonestream.vercel.app/logo.png",
    description: "MoviesZone is a modern streaming platform offering thousands of movies and TV series in HD with Hindi Dubbed audio.",
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MoviesZone",
    url: "https://movieszonestream.vercel.app",
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
        <link rel="alternate" type="application/rss+xml" title="MoviesZone RSS Feed" href="/feed.xml" />
      </head>
      <body 
        className="flex min-h-screen bg-[#080A0F] text-white antialiased"
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
