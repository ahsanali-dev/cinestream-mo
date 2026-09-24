import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import AppDownloadClient from "./AppDownloadClient";

export const metadata: Metadata = {
  title: "Download MoviesZone App APK | 100% Ad-Free HD Streaming for Android, iOS & PC",
  description: "Download the official MoviesZone Android App (.APK) for free. Enjoy 100% ad-free cinema streaming, Hindi Dubbed dual audio, 1080p Ultra HD video, and Netflix/Prime series. The ultimate alternative to MovieBox, NetMirror, and KatmovieHD.",
  keywords: [
    "MoviesZone App",
    "MoviesZone APK Download",
    "MoviesZone Android App",
    "Download MoviesZone App",
    "MoviesZone APK Download Free",
    "MoviesZone for PC",
    "MoviesZone iOS Web App",
    "MovieBox APK alternative",
    "TheMovieBox app download",
    "NetMirror app APK",
    "KatmovieHD app",
    "Vegamovies app",
    "Bollyflix app",
    "Free movie streaming app android",
    "100% ad-free cinema app",
    "Hindi dubbed movies app"
  ],
  alternates: {
    canonical: "/app",
  },
  openGraph: {
    title: "Download MoviesZone App APK | 100% Ad-Free HD Streaming",
    description: "Download the official MoviesZone Android App (.APK) for 100% ad-free streaming, Hindi Dubbed movies, and popular TV series.",
    url: "https://movieszonestream.vercel.app/app",
    siteName: "MoviesZone",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MoviesZone App Download",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Download MoviesZone App APK | 100% Ad-Free Movie Streaming",
    description: "Download official MoviesZone APK for Android, iOS PWA, and Desktop PC.",
    images: ["/icon-512x512.png"],
    creator: "@movieszone",
  },
};

export default function AppDownloadPage() {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MoviesZone Android App",
    operatingSystem: "Android 7.0+, iOS, Windows, macOS",
    applicationCategory: "MultimediaApplication",
    fileFormat: "application/vnd.android.package-archive",
    fileSize: "80.6MB",
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
    description: "Download official MoviesZone APK for guaranteed 100% ad-free streaming, Hindi Dubbed dual audio, and 1080p full HD movies. The best alternative to MovieBox, NetMirror, and KatmovieHD.",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://movieszonestream.vercel.app",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Download App",
        "item": "https://movieszonestream.vercel.app/app",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is MoviesZone App free to download and use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MoviesZone is 100% free with no hidden charges, premium paywalls, or monthly subscriptions.",
        },
      },
      {
        "@type": "Question",
        name: "How is MoviesZone App better than MovieBox and NetMirror?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Unlike MovieBox and NetMirror which have heavy popup ads and slow server speeds, MoviesZone Android App is 100% ad-free, loads ultra-fast via high-speed CDN, and includes guaranteed Hindi Dubbed audio for Hollywood & regional titles.",
        },
      },
      {
        "@type": "Question",
        name: "Is MoviesZone APK safe and virus-free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our APK packages are built securely and distributed directly from official GitHub releases without any malware, spyware, or adware.",
        },
      },
      {
        "@type": "Question",
        name: "Can I install MoviesZone on iPhone (iOS) or iPad?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, iPhone users can install the MoviesZone Progressive Web App (PWA) directly by opening Safari, tapping the Share button, and choosing 'Add to Home Screen'.",
        },
      },
      {
        "@type": "Question",
        name: "Does the app support Android TV and Casting?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MoviesZone works on Android smartphones, tablets, Android TV boxes, and supports video playback on external media screens.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#080A0F] text-white pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <AppDownloadClient />
    </main>
  );
}
