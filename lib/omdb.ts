export interface OMDbRatings {
  imdbRating: number | null;
  imdbVotes: string | null;
  rottenTomatoes: string | null;
  metascore: string | null;
}

function getOmdbKey(): string | null {
  let key = process.env.OMDB_API_KEY?.trim();
  if (!key) return null;
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key.length > 3 ? key : null;
}

export async function getOMDbRatings(imdbId: string): Promise<OMDbRatings | null> {
  const apiKey = getOmdbKey();
  if (!apiKey || !imdbId || !imdbId.startsWith("tt")) {
    return null;
  }

  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      console.warn(`OMDb API returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.Response === "False") {
      return null;
    }

    const imdbRating = data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null;
    const imdbVotes = data.imdbVotes && data.imdbVotes !== "N/A" ? data.imdbVotes : null;

    let rottenTomatoes: string | null = null;
    if (Array.isArray(data.Ratings)) {
      const rt = data.Ratings.find((r: any) => r.Source === "Rotten Tomatoes");
      if (rt && rt.Value) {
        rottenTomatoes = rt.Value;
      }
    }

    const metascore = data.Metascore && data.Metascore !== "N/A" ? data.Metascore : null;

    return {
      imdbRating,
      imdbVotes,
      rottenTomatoes,
      metascore,
    };
  } catch (err: any) {
    console.warn("Failed to fetch OMDb ratings:", err.message);
    return null;
  }
}

