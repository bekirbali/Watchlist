import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateDefaultUser } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const delta = typeof body.delta === "number" ? body.delta : undefined;
    const directSeason = typeof body.season === "number" ? body.season : undefined;
    const directEpisode = typeof body.episode === "number" ? body.episode : undefined;

    const item = await prisma.mediaItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Parse or generate season structure
    let seasons: Array<{ seasonNumber: number; episodeCount: number }> = [];
    if (item.seasonsData) {
      try {
        seasons = JSON.parse(item.seasonsData);
      } catch (e) {
        console.warn("Failed to parse seasonsData:", e);
      }
    }

    const totalSeasons = Math.max(1, item.totalSeasons || 1);
    if (!seasons || seasons.length === 0) {
      const perSeason = Math.max(1, Math.ceil((item.totalEpisodes || 10) / totalSeasons));
      for (let s = 1; s <= totalSeasons; s++) {
        seasons.push({ seasonNumber: s, episodeCount: perSeason });
      }
    }

    let newSeason = item.currentSeason || 1;
    let newEpisode = item.currentEpisode || 0;
    let newStatus = item.status;

    if (directSeason !== undefined && directEpisode !== undefined) {
      // Direct positioning from modal episode click or season completion
      newSeason = Math.max(1, Math.min(totalSeasons, directSeason));
      const targetSeasonObj = seasons.find((s) => s.seasonNumber === newSeason);
      const maxEpForSeason = targetSeasonObj?.episodeCount || 10;
      newEpisode = Math.max(0, Math.min(maxEpForSeason, directEpisode));

      if (newEpisode > 0 && newStatus === "PLAN_TO_WATCH") {
        newStatus = "WATCHING";
      }

      // Check if last season last episode
      if (
        newSeason >= totalSeasons &&
        newEpisode >= maxEpForSeason
      ) {
        newStatus = "COMPLETED";
      }
    } else if (delta !== undefined) {
      // Step delta (e.g. +1 from card Next Ep button)
      const currentSeasonObj = seasons.find((s) => s.seasonNumber === newSeason) || {
        seasonNumber: newSeason,
        episodeCount: 10,
      };

      if (delta > 0) {
        if (newEpisode < currentSeasonObj.episodeCount) {
          newEpisode += 1;
        } else {
          // Exceeded current season episodes -> advance to next season
          if (newSeason < totalSeasons) {
            newSeason += 1;
            newEpisode = 1;
          } else {
            // Already on last season last episode
            newStatus = "COMPLETED";
          }
        }

        if (newStatus === "PLAN_TO_WATCH") {
          newStatus = "WATCHING";
        }
      } else if (delta < 0) {
        if (newEpisode > 1) {
          newEpisode -= 1;
        } else if (newEpisode === 1 && newSeason > 1) {
          newSeason -= 1;
          const prevSeasonObj = seasons.find((s) => s.seasonNumber === newSeason);
          newEpisode = prevSeasonObj?.episodeCount || 10;
        } else {
          newEpisode = 0;
        }
      }
    }

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: {
        currentSeason: newSeason,
        currentEpisode: newEpisode,
        status: newStatus,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    console.error("POST /api/media/[id]/progress error:", err);
    return NextResponse.json({ error: err.message || "Failed to update progress" }, { status: 500 });
  }
}

