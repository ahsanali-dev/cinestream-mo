export interface Movie {
    id: string;
    tmdbId?: string;
    title: string;
    year: string;
    rating: string;
    image: string;
    description: string;
    category: 'movie' | 'tv';
    backdrop: string;
    cast?: string[];
    duration?: string;
    genre?: string[];
    seasons?: { season: number; episodes: number }[];
}

export const ALL_MOVIES: Movie[] = [
    {
        id: "dune-2",
        tmdbId: "693134",
        title: "Dune: Part Two",
        year: "2024",
        rating: "8.4",
        image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop",
        backdrop: "https://images.unsplash.com/photo-1542204172-3c1f81d05d77?q=80&w=2000&auto=format&fit=crop",
        description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        category: 'movie',
        duration: "2h 46m",
        genre: ["Sci-Fi", "Adventure", "Action"],
        cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"]
    },
    {
        id: "joker-2",
        tmdbId: "889737",
        title: "Joker: Folie à Deux",
        year: "2024",
        rating: "7.9",
        image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop",
        backdrop: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2000&auto=format&fit=crop",
        description: "Arthur Fleck, incarcerated at Arkham awaiting trial for his crimes as Joker, finds the love of his life in Lee Quinzel.",
        category: 'movie',
        duration: "2h 18m",
        genre: ["Drama", "Crime", "Musical"],
        cast: ["Joaquin Phoenix", "Lady Gaga", "Zazie Beetz"]
    },
    {
        id: "oppenheimer",
        tmdbId: "872585",
        title: "Oppenheimer",
        year: "2023",
        rating: "8.1",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop",
        backdrop: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2000&auto=format&fit=crop",
        description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
        category: 'movie',
        duration: "3h 0m",
        genre: ["History", "Biography", "Drama"],
        cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"]
    },
    {
        id: "stranger-things",
        tmdbId: "66732",
        title: "Stranger Things",
        year: "2016-Present",
        rating: "8.7",
        image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop",
        backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop",
        description: "A young boy vanishes and a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        category: 'tv',
        duration: "4 Seasons",
        genre: ["Sci-Fi", "Horror", "Mystery"],
        cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
        seasons: [
            { season: 1, episodes: 8 },
            { season: 2, episodes: 9 },
            { season: 3, episodes: 8 },
            { season: 4, episodes: 9 }
        ]
    },
    {
        id: "the-bear",
        tmdbId: "136315",
        title: "The Bear",
        year: "2022-Present",
        rating: "8.6",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=500&auto=format&fit=crop",
        backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2000&auto=format&fit=crop",
        description: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
        category: 'tv',
        duration: "3 Seasons",
        genre: ["Drama", "Comedy"],
        cast: ["Jeremy Allen White", "Ayo Edebiri", "Ebon Moss-Bachrach"],
        seasons: [
            { season: 1, episodes: 8 },
            { season: 2, episodes: 10 },
            { season: 3, episodes: 10 }
        ]
    }
];
