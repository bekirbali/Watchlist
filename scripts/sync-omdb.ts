import { PrismaClient } from "@prisma/client";
import { getOMDbRatings } from "../lib/omdb";

const prisma = new PrismaClient();

async function sync() {
  console.log("Starting OMDb IMDb rating synchronization...");
  const items = await prisma.mediaItem.findMany({
    where: {
      imdbId: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      imdbId: true,
      imdbRating: true,
    },
  });

  console.log(`Found ${items.length} items with imdbId.`);
  let updatedCount = 0;

  for (const item of items) {
    if (!item.imdbId) continue;
    try {
      const ratings = await getOMDbRatings(item.imdbId);
      if (ratings && ratings.imdbRating !== null) {
        await prisma.mediaItem.update({
          where: { id: item.id },
          data: {
            imdbRating: ratings.imdbRating,
          },
        });
        console.log(`✓ ${item.title}: IMDb ${ratings.imdbRating}`);
        updatedCount++;
      } else {
        console.log(`- ${item.title}: No IMDb rating found (Response: N/A)`);
      }
    } catch (err) {
      console.error(`✗ Error fetching for ${item.title} (${item.imdbId}):`, err);
    }
    // Small delay between calls
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\nSynchronization finished! Successfully updated ${updatedCount}/${items.length} items.`);
}

sync()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

