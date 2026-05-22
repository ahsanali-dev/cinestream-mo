# CineStream 🎬

CineStream is a premium, high-performance web application for streaming movies and TV shows online. Built with a modern dark-mode aesthetic, it provides a seamless cinematic viewing experience across all devices.

## 🚀 Key Features

* **Premium Cinematic UI/UX**: Rich, fluid layout using a sleek dark theme with customized category sections, interactive carousel rows, and responsive touch-scroll rows.
* **TMDB API Integration**: Dynamically pulls up-to-date movies, trending titles, popular TV series, genre collections, cast summaries, and recommendations.
* **Responsive Mobile-First Design**: Optimized interfaces for both desktop and mobile screens, including a bottom tab bar navigation for mobile devices.
* **Enhanced Embedded Video Player**: Uses an sandboxed iframe environment preventing unwanted external top-level redirects while maintaining media presentation and scripts functionality.
* **Autoplay Support**: Configured to auto-play movies and TV shows directly when navigating to the watch screen.
* **PWA Ready**: Integrated Progressive Web App capabilities for mobile app installs.

---

## 🔍 Full SEO & Metadata Architecture

This project is fully optimized for search engines (SEO) using the latest Next.js Metadata APIs:

* **Sitemap & Robots**:
  * Automatically compiles dynamic `/sitemap.xml` mapping static routes and trending content fetched directly from TMDB.
  * Configured `/robots.txt` to permit search engine indexation on public routes while hiding account-related paths.
* **Static Page Metadata**: Added full descriptions, keywords, OpenGraph tags, and Twitter Cards to Home, Movies, TV Shows, and Explore pages.
* **Dynamic Title & Meta Tags**: Watch routes (`/watch/[id]`) and genre routes (`/explore/[...slug]`) dynamically resolve data from the TMDB database to generate customized page titles, descriptions, and backdrop poster previews for optimal social link sharing.
* **Hydration Fix**: Implemented a mounting state check in the navigation layout headers to avoid hydration mismatch errors on dynamic SSR pages.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Icons**: Phosphor Icons
* **Styling**: Tailwind CSS
* **API Data**: The Movie Database (TMDB)

---

## ⚙️ Setup & Installation

### 1. Environment Variables

Create a `.env.local` file in the root directory and configure the following TMDB credentials:

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application in action.

### 4. Build for Production

```bash
npm run build
npm start
```
