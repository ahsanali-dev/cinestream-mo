import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | Find Movies & TV Shows",
  description: "Search and browse through thousands of movies, TV shows, and genres. Find action, comedy, horror, and animation titles on CineStream.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
