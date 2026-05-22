import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import PWARegistration from "@/components/PWARegistration";

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
  return (
    <html lang="en">
      <body 
        className="flex min-h-screen bg-[#0a0a0b] text-white antialiased"
        suppressHydrationWarning
      >
        <Script src="https://unpkg.com/@phosphor-icons/web" strategy="afterInteractive" />
        <PWARegistration />
        <Sidebar />
        <Header />
        <div className="flex-1 md:ml-20 w-full overflow-x-hidden pb-16 md:pb-0 pt-20">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
