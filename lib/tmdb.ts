import https from "https";

export interface TMDBMediaSearchResult {
  tmdbId: number;
  mediaType: "MOVIE" | "TV";
  title: string;
  originalTitle?: string;
  releaseYear?: number;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  voteAverage: number;
}

export interface TMDBMediaDetails extends TMDBMediaSearchResult {
  genres: string[];
  totalSeasons: number;
  totalEpisodes: number;
  seasons?: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
  }>;
  imdbId?: string | null;
  runtime?: number | null;
  tagline?: string | null;
  network?: string | null;
  country?: string | null;
  director?: string | null;
  cast?: string | null;
  trailerKey?: string | null;
  watchProviders?: string | null;
  nextEpisodeDate?: string | null;
  showStatus?: string | null;
  voteCount?: number | null;
}

// Direct CloudFront IP list for api.themoviedb.org
// Bypasses ISP DNS poisoning in Turkey (where api.themoviedb.org is falsely resolved to 127.0.0.1)
const TMDB_API_IPS = ["65.9.130.53", "65.9.130.126", "65.9.130.129", "65.9.130.24"];

function getApiKey(): string | null {
  let key = process.env.TMDB_API_KEY?.trim();
  if (!key) return null;
  // Strip surrounding quotes if entered in .env
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key.length > 5 ? key : null;
}

export function formatImageUrl(
  path: string | null,
  size: "w342" | "w500" | "w780" | "original" = "w500"
): string | null {
  if (!path) return null;
  if (path.startsWith("/api/tmdb/image")) return path;
  if (path.startsWith("http") && !path.includes("image.tmdb.org")) return path;
  
  // Extract pure relative path if full image.tmdb.org URL was stored
  const relativePath = path.includes("/t/p/") ? path.replace(/^.*?\/t\/p\/[^\/]+/, "") : path;
  return `/api/tmdb/image?path=${encodeURIComponent(relativePath)}&size=${size}`;
}

async function tmdbRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const urlParams = new URLSearchParams(params);
  if (!apiKey.startsWith("eyJ")) {
    urlParams.set("api_key", apiKey);
  }

  const path = `/3${endpoint}?${urlParams.toString()}`;
  const headers: Record<string, string> = {
    Host: "api.themoviedb.org",
    Accept: "application/json",
    "User-Agent": "WatchlistApp/1.0",
  };

  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  for (const ip of TMDB_API_IPS) {
    try {
      const res = await new Promise<{ status: number; data: string }>((resolve, reject) => {
        const req = https.request(
          {
            hostname: ip,
            port: 443,
            path,
            method: "GET",
            headers,
            servername: "api.themoviedb.org",
            timeout: 6000,
          },
          (response) => {
            let body = "";
            response.on("data", (chunk) => (body += chunk));
            response.on("end", () => resolve({ status: response.statusCode || 500, data: body }));
          }
        );

        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Timeout connecting to TMDB IP"));
        });
        req.end();
      });

      if (res.status === 200) {
        return JSON.parse(res.data) as T;
      } else {
        console.warn(`TMDB request to ${ip} returned status ${res.status}:`, res.data);
      }
    } catch (err: any) {
      console.warn(`TMDB request to ${ip} failed: ${err.message}`);
    }
  }

  return null;
}

export async function searchTMDB(
  query: string,
  type: "all" | "movie" | "tv" = "all"
): Promise<TMDBMediaSearchResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getMockSearchResults(query, type);
  }

  const endpoint = type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi";
  const data = await tmdbRequest<any>(endpoint, {
    query,
    include_adult: "false",
    language: "en-US",
  });

  if (!data || !data.results) {
    return getMockSearchResults(query, type);
  }

  const results = data.results || [];
  return results
    .filter((item: any) => {
      if (type === "all") return item.media_type === "movie" || item.media_type === "tv";
      return true;
    })
    .slice(0, 15)
    .map((item: any) => {
      const isTv = type === "tv" || item.media_type === "tv";
      const title = isTv ? item.name || item.original_name : item.title || item.original_title;
      const releaseDate = isTv ? item.first_air_date : item.release_date;
      const releaseYear = releaseDate ? parseInt(releaseDate.split("-")[0], 10) : undefined;

      return {
        tmdbId: item.id,
        mediaType: isTv ? "TV" : "MOVIE",
        title: title || "Unknown Title",
        originalTitle: isTv ? item.original_name : item.original_title,
        releaseYear,
        posterPath: item.poster_path ? formatImageUrl(item.poster_path, "w500") : null,
        backdropPath: item.backdrop_path ? formatImageUrl(item.backdrop_path, "original") : null,
        overview: item.overview || "",
        voteAverage: Math.round((item.vote_average || 0) * 10) / 10,
      };
    });
}

export async function getTMDBDetails(tmdbId: number, mediaType: "MOVIE" | "TV"): Promise<TMDBMediaDetails | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return getMockDetails(tmdbId, mediaType);
  }

  const endpoint = mediaType === "TV" ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const item = await tmdbRequest<any>(endpoint, {
    language: "en-US",
    append_to_response: "videos,credits,watch/providers,external_ids",
  });

  if (!item) {
    return getMockDetails(tmdbId, mediaType);
  }

  const isTv = mediaType === "TV";
  const title = isTv ? item.name || item.original_name : item.title || item.original_title;
  const releaseDate = isTv ? item.first_air_date : item.release_date;
  const releaseYear = releaseDate ? parseInt(releaseDate.split("-")[0], 10) : undefined;
  const genres = (item.genres || []).map((g: any) => g.name);

  let totalEpisodes = 1;
  let totalSeasons = 1;
  let seasons: Array<{ seasonNumber: number; name: string; episodeCount: number }> = [];

  if (isTv) {
    totalSeasons = item.number_of_seasons || 1;
    totalEpisodes = item.number_of_episodes || totalSeasons * 10;
    if (item.seasons && Array.isArray(item.seasons)) {
      seasons = item.seasons
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          seasonNumber: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episodeCount: s.episode_count || 10,
        }));
    }
  }

  // Extract rich metadata
  const imdbId = item.imdb_id || item.external_ids?.imdb_id || null;
  const runtime = isTv
    ? item.episode_run_time?.[0] || null
    : item.runtime || null;
  const tagline = item.tagline || null;
  const network = item.networks?.[0]?.name || null;
  const country = item.origin_country?.[0] || null;
  const director = item.credits?.crew?.find((c: any) => c.job === "Director")?.name || null;
  const cast = (item.credits?.cast || []).slice(0, 5).map((c: any) => c.name).join(", ") || null;

  const youtubeVideos = (item.videos?.results || []).filter((v: any) => v.site === "YouTube");
  const officialTrailer =
    youtubeVideos.find((v: any) => v.type === "Trailer") || youtubeVideos[0];
  const trailerKey = officialTrailer?.key || null;

  const trProviders = item["watch/providers"]?.results?.TR?.flatrate;
  const watchProviders = Array.isArray(trProviders)
    ? trProviders.map((p: any) => p.provider_name).join(", ")
    : null;

  const nextEpisodeDate = item.next_episode_to_air?.air_date || null;
  const showStatus = item.status || null;
  const voteCount = item.vote_count || null;

  return {
    tmdbId: item.id,
    imdbId,
    mediaType,
    title: title || "Unknown Title",
    originalTitle: isTv ? item.original_name : item.original_title,
    releaseYear,
    posterPath: item.poster_path ? formatImageUrl(item.poster_path, "w500") : null,
    backdropPath: item.backdrop_path ? formatImageUrl(item.backdrop_path, "original") : null,
    overview: item.overview || "",
    voteAverage: Math.round((item.vote_average || 0) * 10) / 10,
    voteCount,
    genres,
    totalSeasons,
    totalEpisodes,
    seasons,
    runtime,
    tagline,
    network,
    country,
    director,
    cast,
    trailerKey,
    watchProviders,
    nextEpisodeDate,
    showStatus,
  };
}

// Fallback mock responses when API key is not yet set
function getMockSearchResults(query: string, type: "all" | "movie" | "tv"): TMDBMediaSearchResult[] {
  const q = query.trim().toLowerCase();
  const sampleData: TMDBMediaSearchResult[] = [
    {
      tmdbId: 1396,
      mediaType: "TV",
      title: "Breaking Bad",
      originalTitle: "Breaking Bad",
      releaseYear: 2008,
      posterPath: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      overview:
        "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years left to live. He chooses to enter a dangerous world of crime and produces the finest methamphetamine in the country.",
      voteAverage: 8.9,
    },
    {
      tmdbId: 27205,
      mediaType: "MOVIE",
      title: "Inception",
      originalTitle: "Inception",
      releaseYear: 2010,
      posterPath: "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
      overview:
        'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
      voteAverage: 8.4,
    },
    {
      tmdbId: 95557,
      mediaType: "TV",
      title: "Severance",
      originalTitle: "Severance",
      releaseYear: 2022,
      posterPath: "https://image.tmdb.org/t/p/w500/9Pfbtq5moxLd5V1xWvKx1C4kYwP.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/7vuhZf7k6w4D0Lz6pUqU1aI4a9l.jpg",
      overview:
        "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.",
      voteAverage: 8.3,
    },
    {
      tmdbId: 157336,
      mediaType: "MOVIE",
      title: "Interstellar",
      originalTitle: "Interstellar",
      releaseYear: 2014,
      posterPath: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
      overview:
        "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
      voteAverage: 8.4,
    },
  ];

  const matched = sampleData.filter((item) => {
    if (type !== "all" && item.mediaType !== type.toUpperCase()) return false;
    return item.title.toLowerCase().includes(q) || q.includes(item.title.toLowerCase());
  });

  if (matched.length > 0) return matched;

  return [
    {
      tmdbId: Math.floor(Math.random() * 100000) + 1000,
      mediaType: type === "tv" ? "TV" : "MOVIE",
      title: query,
      releaseYear: new Date().getFullYear(),
      posterPath: null,
      backdropPath: null,
      overview: `Search result for "${query}". Add your TMDB_API_KEY in .env to fetch live official posters and details.`,
      voteAverage: 7.5,
    },
  ];
}

function getMockDetails(tmdbId: number, mediaType: "MOVIE" | "TV"): TMDBMediaDetails {
  const isTv = mediaType === "TV";
  const known = [
    {
      tmdbId: 1396,
      mediaType: "TV" as const,
      title: "Breaking Bad",
      releaseYear: 2008,
      posterPath: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      overview: "Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer.",
      voteAverage: 8.9,
      genres: ["Drama", "Crime"],
      totalSeasons: 5,
      totalEpisodes: 62,
    },
    {
      tmdbId: 95557,
      mediaType: "TV" as const,
      title: "Severance",
      releaseYear: 2022,
      posterPath: "https://image.tmdb.org/t/p/w500/9Pfbtq5moxLd5V1xWvKx1C4kYwP.jpg",
      backdropPath: "https://image.tmdb.org/t/p/original/7vuhZf7k6w4D0Lz6pUqU1aI4a9l.jpg",
      overview: "Mark leads a team of office workers whose memories have been surgically divided.",
      voteAverage: 8.3,
      genres: ["Drama", "Sci-Fi", "Mystery"],
      totalSeasons: 2,
      totalEpisodes: 19,
    },
  ];

  const match = known.find((k) => k.tmdbId === tmdbId);
  if (match) {
    return {
      ...match,
      seasons: isTv
        ? Array.from({ length: match.totalSeasons }, (_, i) => ({
            seasonNumber: i + 1,
            name: `Season ${i + 1}`,
            episodeCount: Math.ceil(match.totalEpisodes / match.totalSeasons),
          }))
        : [],
    };
  }

  return {
    tmdbId,
    mediaType,
    title: isTv ? "TV Series" : "Movie",
    releaseYear: 2024,
    posterPath: null,
    backdropPath: null,
    overview: "Configure TMDB_API_KEY in .env to automatically fetch full season and episode breakdowns.",
    voteAverage: 8.0,
    genres: ["Drama", "Sci-Fi", "Thriller"],
    totalSeasons: isTv ? 3 : 1,
    totalEpisodes: isTv ? 24 : 1,
    seasons: isTv
      ? [
          { seasonNumber: 1, name: "Season 1", episodeCount: 8 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 8 },
          { seasonNumber: 3, name: "Season 3", episodeCount: 8 },
        ]
      : [],
  };
}
