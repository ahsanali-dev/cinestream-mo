import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import PWARegistration from "@/components/PWARegistration";
import { QuickViewProvider } from "@/context/QuickViewContext";
import QuickViewModal from "@/components/QuickViewModal";
import { InstallModalProvider } from "@/context/InstallModalContext";
import DownloadAppModal from "@/components/DownloadAppModal";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

export const viewport: Viewport = {
  themeColor: "#080A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "MoviesZone | Free HD Movies, Hindi Dubbed TV Series & Android App - MovieBox Alternative",
    template: "%s | MoviesZone",
  },
  description: "Stream the latest trending movies, Hollywood & Bollywood blockbusters, and popular Netflix & Prime Video TV series in full 1080p HD on MoviesZone. The ultimate ad-free alternative to MovieBox, NetMirror, and KatmovieHD with Hindi Dubbed audio and free Android APK download.",
  keywords: [
    // Brand & App Keywords
    "MoviesZone",
    "MoviesZone Stream",
    "MoviesZone App",
    "MoviesZone APK Download",
    "MoviesZone Android App",
    "MoviesZone PWA",
    "MoviesZone HD",
    
    // Competitor Alternative Keywords
    "MovieBox",
    "MovieBox Alternative",
    "MovieBox PRO Alternative",
    "TheMovieBox",
    "TheMovieBox APK",
    "MoviesBox Free",
    "NetMirror",
    "NetMirror Alternative",
    "Net Mirror movies",
    "KatmovieHD",
    "KatmovieHD Alternative",
    "KatmovieHD Hindi Dubbed",
    "Netflix free alternative",
    "Prime Video alternative stream",
    "Disney+ Hotstar free shows",
    "Vegamovies",
    "Bollyflix",
    "Filmyzilla dual audio",
    "HDHub4u",
    "123movies",
    "Fmovies",
    "Soap2day",
    "Lookmovie",
    "Flixtor",
    "SFlix",
    
    // High-Intent Search Queries
    "Watch movies online free",
    "Free movie streaming HD",
    "Hindi Dubbed movies 1080p",
    "Dual audio movies download",
    "Watch Netflix series free",
    "Free TV shows streaming",
    "Stream Bollywood movies",
    "Punjabi movies online",
    "Tamil movies in Hindi",
    "Telugu movies in Hindi",
    "South Indian Hindi Dubbed movies",
    "Ad-free movie streaming app",
    "Android cinema APK download",
    "Full HD 1080p online cinema"
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
    title: "MoviesZone | Free HD Movies, Hindi Dubbed TV Series & Android App",
    description: "Stream thousands of blockbuster movies and popular TV series in high definition with Hindi Dubbed audio. Download the official MoviesZone Android App for 100% ad-free cinema playback.",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MoviesZone Logo - Free Movies & TV Shows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MoviesZone | Free HD Movies, Hindi Dubbed Series & Android App",
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
    alternateName: [
      "MoviesZone Stream",
      "MoviesZone HD",
      "MoviesZone App",
      "TheMovieBox Alternative",
      "NetMirror Alternative",
      "KatmovieHD Dual Audio"
    ],
    url: "https://movieszonestream.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://movieszonestream.vercel.app/explore?q={search_term_string}",
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
    description: "MoviesZone is a leading modern streaming platform and Android cinema application offering thousands of Hollywood, Bollywood, and regional movies in Full HD with Hindi Dubbed audio.",
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MoviesZone Android App",
    operatingSystem: "Android 7.0+, iOS, Windows, macOS",
    applicationCategory: "MultimediaApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "48200",
      bestRating: "5",
      worstRating: "1",
    },
    downloadUrl: "https://github.com/ahsanali-dev/movies-zone-releases/releases/latest/download/movieszone.apk",
    description: "Download the official MoviesZone Android App (.APK) for 100% ad-free streaming, Hindi Dubbed cinema, dual audio tracks, and ultra-fast 1080p playback. The #1 alternative to MovieBox, NetMirror, and KatmovieHD.",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is MoviesZone and how does it compare to MovieBox, NetMirror, and KatmovieHD?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MoviesZone is a fast, modern streaming platform and Android APK offering high-definition movies and TV series with Hindi Dubbed audio, dual audio tracks, and English subtitles. Unlike traditional platforms with heavy ads, MoviesZone offers a 100% ad-free experience on its Android App.",
        },
      },
      {
        "@type": "Question",
        name: "Can I watch Netflix, Amazon Prime, and Disney+ series on MoviesZone for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MoviesZone features an extensive collection of trending web series, drama shows, and original releases from major OTT networks in Full HD 1080p without any subscription fees.",
        },
      },
      {
        "@type": "Question",
        name: "How do I download the MoviesZone APK on Android?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can download the MoviesZone APK directly from the official download button on our site. Once downloaded, open the file and install it on any Android phone, tablet, or Android TV.",
        },
      },
      {
        "@type": "Question",
        name: "Are Hindi Dubbed Bollywood, Tamil, and Telugu movies available on MoviesZone?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MoviesZone includes dedicated regional cinema categories for Bollywood (Hindi), Pollywood (Punjabi), Kollywood (Tamil), and Tollywood (Telugu) hits, complete with Hindi Dubbed audio tracks.",
        },
      },
    ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="afterInteractive" />
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <InstallModalProvider>
          <AuthProvider>
            <QuickViewProvider>
              <PWARegistration />
              <Sidebar />
              <Header />
              <div className="flex-1 md:ml-20 w-full overflow-x-hidden pb-16 md:pb-0 pt-20">
                {children}
              </div>
              <BottomNav />
              <QuickViewModal />
              <DownloadAppModal />
              <AuthModal />
            </QuickViewProvider>
          </AuthProvider>
        </InstallModalProvider>
      </body>
    </html>
  );
}
