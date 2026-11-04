import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { searchTMDB, getTMDBDetails } from "@/lib/tmdb";
import { getOMDbRatings } from "@/lib/omdb";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { titles, items, previewOnly = false } = body;

    // Load existing items for duplicate prevention
    const existingUserItems = await prisma.mediaItem.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        tmdbId: true,
        mediaType: true,
        title: true,
        imdbId: true,
        status: true,
      },
    });

    const isExisting = (checkTmdbId?: number | null, checkMediaType?: string, checkTitle?: string) => {
      if (checkTmdbId && checkMediaType) {
        const found = existingUserItems.find(
          (ex) => ex.tmdbId === checkTmdbId && ex.mediaType === checkMediaType
        );
        if (found) return found;
      }
      if (checkTitle) {
        const normalized = checkTitle.toLowerCase().trim();
        const found = existingUserItems.find(
          (ex) => ex.title.toLowerCase().trim() === normalized
        );
        if (found) return found;
      }
      return null;
    };

    // Case 1: Direct item objects provided from frontend preview confirmation
    if (Array.isArray(items) && items.length > 0) {
      const createdItems: any[] = [];
      let skippedDuplicates = 0;

      for (const item of items) {
        // Double-check duplicate before creating
        const dup = isExisting(item.tmdbId, item.mediaType, item.title);
        if (dup) {
          skippedDuplicates++;
          continue;
        }

        let details: any = null;
        if (item.tmdbId) {
          details = await getTMDBDetails(item.tmdbId, item.mediaType);
        }

        const imdbId = details?.imdbId || null;
        let omdbRatings: any = null;
        if (imdbId) {
          omdbRatings = await getOMDbRatings(imdbId);
        }

        const totalSeasons = details?.totalSeasons || 1;
        const totalEpisodes = details?.totalEpisodes || (item.mediaType === "TV" ? 10 : 1);
        const genres = details?.genres ? details.genres.join(", ") : null;
        const seasonsData =
          details?.seasons && Array.isArray(details.seasons) && details.seasons.length > 0
            ? JSON.stringify(details.seasons)
            : null;

        const created = await prisma.mediaItem.create({
          data: {
            userId: user.id,
            tmdbId: item.tmdbId ? Number(item.tmdbId) : null,
            imdbId,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: details?.posterPath || item.posterPath,
            backdropPath: details?.backdropPath || item.backdropPath,
            overview: details?.overview || item.overview || "",
            releaseYear: item.releaseYear,
            genres,
            status: "PLAN_TO_WATCH",
            tmdbRating: details?.voteAverage || null,
            imdbRating: omdbRatings?.imdbRating || null,
            rottenTomatoes: omdbRatings?.rottenTomatoes || null,
            voteCount: details?.voteCount || null,
            runtime: details?.runtime || null,
            tagline: details?.tagline || null,
            network: details?.network || null,
            country: details?.country || null,
            director: details?.director || null,
            cast: details?.cast || null,
            trailerKey: details?.trailerKey || null,
            watchProviders: details?.watchProviders || null,
            nextEpisodeDate: details?.nextEpisodeDate || null,
            showStatus: details?.showStatus || null,
            seasonsData,
            totalSeasons,
            totalEpisodes,
            currentSeason: 1,
            currentEpisode: 0,
          },
        });

        createdItems.push(created);
        // Track locally so subsequent items in the same batch don't duplicate
        existingUserItems.push({
          id: created.id,
          tmdbId: created.tmdbId,
          mediaType: created.mediaType,
          title: created.title,
          imdbId: created.imdbId,
          status: created.status,
        });
      }

      return NextResponse.json({
        success: true,
        count: createdItems.length,
        skippedDuplicates,
        items: createdItems,
      });
    }

    // Case 2: Raw titles string list (Scanning / Preview step)
    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ error: "An array of titles or items is required" }, { status: 400 });
    }

    const cleanedTitles = titles
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 50);

    const resolvedList: any[] = [];
    const failedList: string[] = [];

    for (const rawTitle of cleanedTitles) {
      try {
        const cleanQuery = rawTitle
          .replace(/^[\d\.\-\*\•\s]+/, "")
          .replace(/\((dizi|film|series|movie)\)/gi, "")
          .trim();

        const searchResults = await searchTMDB(cleanQuery, "all");
        if (searchResults && searchResults.length > 0) {
          const topMatch = searchResults[0];
          const dup = isExisting(topMatch.tmdbId, topMatch.mediaType, topMatch.title);

          resolvedList.push({
            inputTitle: rawTitle,
            tmdbId: topMatch.tmdbId,
            mediaType: topMatch.mediaType,
            title: topMatch.title,
            originalTitle: topMatch.originalTitle,
            releaseYear: topMatch.releaseYear,
            posterPath: topMatch.posterPath,
            backdropPath: topMatch.backdropPath,
            overview: topMatch.overview,
            voteAverage: topMatch.voteAverage,
            isDuplicate: !!dup,
            existingStatus: dup?.status || null,
          });
        } else {
          const dup = isExisting(null, "TV", cleanQuery);
          resolvedList.push({
            inputTitle: rawTitle,
            tmdbId: null,
            mediaType: "TV",
            title: cleanQuery,
            releaseYear: new Date().getFullYear(),
            posterPath: null,
            backdropPath: null,
            overview: "Imported from personal notes.",
            voteAverage: null,
            isDuplicate: !!dup,
            existingStatus: dup?.status || null,
          });
        }
      } catch (err) {
        console.error(`Error resolving title: ${rawTitle}`, err);
        failedList.push(rawTitle);
      }
    }

    if (previewOnly) {
      return NextResponse.json({ resolved: resolvedList, failed: failedList });
    }

    // Fallback if someone called without previewOnly and with titles
    const createdItems: any[] = [];
    let skippedDuplicates = 0;

    for (const item of resolvedList) {
      if (item.isDuplicate) {
        skippedDuplicates++;
        continue;
      }

      let details: any = null;
      if (item.tmdbId) {
        details = await getTMDBDetails(item.tmdbId, item.mediaType);
      }

      const imdbId = details?.imdbId || null;
      let omdbRatings: any = null;
      if (imdbId) {
        omdbRatings = await getOMDbRatings(imdbId);
      }

      const totalSeasons = details?.totalSeasons || 1;
      const totalEpisodes = details?.totalEpisodes || (item.mediaType === "TV" ? 10 : 1);
      const genres = details?.genres ? details.genres.join(", ") : null;
      const seasonsData =
        details?.seasons && Array.isArray(details.seasons) && details.seasons.length > 0
          ? JSON.stringify(details.seasons)
          : null;

      const created = await prisma.mediaItem.create({
        data: {
          userId: user.id,
          tmdbId: item.tmdbId ? Number(item.tmdbId) : null,
          imdbId,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: details?.posterPath || item.posterPath,
          backdropPath: details?.backdropPath || item.backdropPath,
          overview: details?.overview || item.overview || "",
          releaseYear: item.releaseYear,
          genres,
          status: "PLAN_TO_WATCH",
          tmdbRating: details?.voteAverage || null,
          imdbRating: omdbRatings?.imdbRating || null,
          rottenTomatoes: omdbRatings?.rottenTomatoes || null,
          voteCount: details?.voteCount || null,
          runtime: details?.runtime || null,
          tagline: details?.tagline || null,
          network: details?.network || null,
          country: details?.country || null,
          director: details?.director || null,
          cast: details?.cast || null,
          trailerKey: details?.trailerKey || null,
          watchProviders: details?.watchProviders || null,
          nextEpisodeDate: details?.nextEpisodeDate || null,
          showStatus: details?.showStatus || null,
          seasonsData,
          totalSeasons,
          totalEpisodes,
          currentSeason: 1,
          currentEpisode: 0,
        },
      });

      createdItems.push(created);
    }

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      skippedDuplicates,
      items: createdItems,
      failed: failedList,
    });
  } catch (err: any) {
    console.error("POST /api/media/batch error:", err);
    return NextResponse.json({ error: err.message || "Failed to batch import" }, { status: 500 });
  }
}
