import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Movies, TV Shows & Hindi Dubbed Cinema | MoviesZone",
  description: "Search and browse through thousands of movies, TV shows, and regional cinema collections. Find Action, Comedy, Horror, Bollywood, Punjabi, and South Indian hits in HD on MoviesZone.",
  keywords: [
    "Explore movies online",
    "Search free movies HD",
    "Bollywood movies catalog",
    "MovieBox library",
    "TheMovieBox search",
    "NetMirror explore",
    "KatmovieHD search movies",
    "Hindi dubbed collection"
  ],
  alternates: {
    canonical: "/explore",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
