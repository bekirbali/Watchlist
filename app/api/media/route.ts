import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getTMDBDetails } from "@/lib/tmdb";
import { getOMDbRatings } from "@/lib/omdb";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const mediaType = searchParams.get("mediaType");
    const search = searchParams.get("search")?.trim();
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {
      userId: user.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (mediaType && mediaType !== "ALL") {
      where.mediaType = mediaType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { overview: { contains: search } },
      ];
    }

    let orderBy: any = [{ updatedAt: sortOrder }];
    if (sortBy === "imdbRating") {
      orderBy = [
        { imdbRating: { sort: sortOrder, nulls: "last" } },
        { title: "asc" },
      ];
    } else if (sortBy === "rating") {
      orderBy = [
        { rating: { sort: sortOrder, nulls: "last" } },
        { title: "asc" },
      ];
    } else if (sortBy === "title") {
      orderBy = [{ title: sortOrder }];
    } else if (sortBy === "releaseYear") {
      orderBy = [
        { releaseYear: { sort: sortOrder, nulls: "last" } },
        { title: "asc" },
      ];
    } else if (sortBy === "runtime") {
      orderBy = [
        { runtime: { sort: sortOrder, nulls: "last" } },
        { title: "asc" },
      ];
    } else if (sortBy === "createdAt") {
      orderBy = [{ createdAt: sortOrder }];
    } else if (sortBy === "updatedAt") {
      orderBy = [{ updatedAt: sortOrder }];
    }

    const items = await prisma.mediaItem.findMany({
      where,
      orderBy,
      include: {
        episodes: {
          orderBy: [
            { seasonNumber: "asc" },
            { episodeNumber: "asc" },
          ],
        },
      },
    });

    // Also calculate summary counters for badges
    const counts = await prisma.mediaItem.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    });

    const statusCounts: Record<string, number> = {
      ALL: 0,
      WATCHING: 0,
      PLAN_TO_WATCH: 0,
      COMPLETED: 0,
      DROPPED: 0,
    };

    counts.forEach((c) => {
      statusCounts[c.status] = c._count._all;
      statusCounts.ALL += c._count._all;
    });

    return NextResponse.json({ items, counts: statusCounts });
  } catch (err: any) {
    console.error("GET /api/media error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const {
      tmdbId,
      mediaType = "TV",
      title,
      status = "PLAN_TO_WATCH",
      rating,
      notes,
      posterPath,
      backdropPath,
      genres,
      releaseYear,
      runtime,
      overview,
      totalEpisodes,
    } = body;

    if (!title && !tmdbId) {
      return NextResponse.json({ error: "Title or tmdbId is required" }, { status: 400 });
    }

    let itemDetails: any = null;
    if (tmdbId) {
      itemDetails = await getTMDBDetails(tmdbId, mediaType);
    }

    const imdbId = itemDetails?.imdbId || null;
    let omdbRatings: any = null;
    if (imdbId) {
      omdbRatings = await getOMDbRatings(imdbId);
    }

    const finalTitle =
      itemDetails?.title && itemDetails.title !== "TV Series" && itemDetails.title !== "Movie"
        ? itemDetails.title
        : title || itemDetails?.title || "Untitled";
    const finalMediaType = itemDetails?.mediaType || mediaType;

    // Duplicate prevention check
    const orConditions: any[] = [];
    if (tmdbId) {
      orConditions.push({ tmdbId: Number(tmdbId), mediaType: finalMediaType });
    }
    if (imdbId) {
      orConditions.push({ imdbId });
    }
    if (finalTitle && finalTitle !== "Untitled") {
      orConditions.push({ title: finalTitle });
    }

    if (orConditions.length > 0) {
      const existing = await prisma.mediaItem.findFirst({
        where: {
          userId: user.id,
          OR: orConditions,
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error: `"${existing.title}" is already in your watchlist (${existing.status}).`,
            alreadyExists: true,
            existingItem: existing,
          },
          { status: 409 }
        );
      }
    }

    const finalPoster = itemDetails?.posterPath || posterPath || null;
    const finalBackdrop = itemDetails?.backdropPath || backdropPath || null;
    const finalOverview = itemDetails?.overview || overview || "";
    const finalYear =
      itemDetails?.releaseYear ||
      (releaseYear ? parseInt(String(releaseYear), 10) || null : null);
    const finalGenres = itemDetails?.genres
      ? itemDetails.genres.join(", ")
      : genres
      ? String(genres).trim()
      : null;
    const finalRuntime =
      itemDetails?.runtime ||
      (runtime ? parseInt(String(runtime), 10) || null : null);
    const totalSeasons = itemDetails?.totalSeasons || (finalMediaType === "TV" ? 1 : 1);
    const finalEpisodes =
      itemDetails?.totalEpisodes ||
      (totalEpisodes ? parseInt(String(totalEpisodes), 10) || 1 : (finalMediaType === "TV" ? 10 : 1));

    // Initial episode progress setup
    const initialCurrentSeason = 1;
    const initialCurrentEpisode = status === "WATCHING" ? 1 : 0;

    const seasonsDataJson =
      itemDetails?.seasons && Array.isArray(itemDetails.seasons) && itemDetails.seasons.length > 0
        ? JSON.stringify(itemDetails.seasons)
        : null;

    const mediaItem = await prisma.mediaItem.create({
      data: {
        userId: user.id,
        tmdbId: tmdbId ? Number(tmdbId) : null,
        imdbId,
        mediaType: finalMediaType,
        title: finalTitle,
        posterPath: finalPoster,
        backdropPath: finalBackdrop,
        overview: finalOverview,
        releaseYear: finalYear,
        genres: finalGenres,
        status,
        rating: rating ? Number(rating) : null,
        tmdbRating: itemDetails?.voteAverage || null,
        imdbRating: omdbRatings?.imdbRating || null,
        rottenTomatoes: omdbRatings?.rottenTomatoes || null,
        voteCount: itemDetails?.voteCount || null,
        runtime: finalRuntime,
        tagline: itemDetails?.tagline || null,
        network: itemDetails?.network || null,
        country: itemDetails?.country || null,
        director: itemDetails?.director || null,
        cast: itemDetails?.cast || null,
        trailerKey: itemDetails?.trailerKey || null,
        watchProviders: itemDetails?.watchProviders || null,
        nextEpisodeDate: itemDetails?.nextEpisodeDate || null,
        showStatus: itemDetails?.showStatus || null,
        notes: notes || null,
        seasonsData: seasonsDataJson,
        totalSeasons,
        totalEpisodes: finalEpisodes,
        currentSeason: initialCurrentSeason,
        currentEpisode: initialCurrentEpisode,
        lastWatchedAt: status === "WATCHING" || status === "COMPLETED" ? new Date() : null,
      },
      include: {
        episodes: true,
      },
    });

    return NextResponse.json({ item: mediaItem }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/media error:", err);
    return NextResponse.json({ error: err.message || "Failed to create media" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { id, status, rating, notes, currentSeason, currentEpisode } = body;

    if (!id) {
      return NextResponse.json({ error: "Item id is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.mediaItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating !== null ? Number(rating) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (currentSeason !== undefined) updateData.currentSeason = Number(currentSeason);
    if (currentEpisode !== undefined) {
      updateData.currentEpisode = Number(currentEpisode);
      updateData.lastWatchedAt = new Date();
    }

    // Auto-transition to COMPLETED if currentEpisode matches totalEpisodes for TV show
    if (
      existing.mediaType === "TV" &&
      updateData.currentEpisode !== undefined &&
      updateData.currentEpisode >= existing.totalEpisodes &&
      existing.totalEpisodes > 1
    ) {
      updateData.status = "COMPLETED";
    }

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: updateData,
      include: {
        episodes: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("PATCH /api/media error:", err);
    return NextResponse.json({ error: err.message || "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item id is required" }, { status: 400 });
    }

    await prisma.mediaItem.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/media error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete media" }, { status: 500 });
  }
}

