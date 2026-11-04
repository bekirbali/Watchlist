import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isDbSchemaEnsured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Self-healing runtime migration check:
 * Automatically verifies and adds missing columns to SQLite (like username or passwordHash)
 * when running against existing production volumes where db push might have been skipped.
 */
export async function ensureDatabaseSchema() {
  if (globalForPrisma.isDbSchemaEnsured) return;

  try {
    const tableInfo: any[] = await prisma.$queryRawUnsafe(`PRAGMA table_info("User");`);
    if (Array.isArray(tableInfo) && tableInfo.length > 0) {
      const colNames = new Set(tableInfo.map((col: any) => col.name));

      if (!colNames.has("username")) {
        console.log("[Watchlist DB] Adding missing 'username' column to User table...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "username" TEXT;`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`);
        console.log("[Watchlist DB] 'username' column and unique index created successfully.");
      }

      if (!colNames.has("passwordHash")) {
        console.log("[Watchlist DB] Adding missing 'passwordHash' column to User table...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;`);
        console.log("[Watchlist DB] 'passwordHash' column created successfully.");
      }

      if (!colNames.has("role")) {
        console.log("[Watchlist DB] Adding missing 'role' column to User table...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER';`);
        console.log("[Watchlist DB] 'role' column created successfully.");
      }
    }
    globalForPrisma.isDbSchemaEnsured = true;
  } catch (err) {
    console.warn("[Watchlist DB] ensureDatabaseSchema notice:", err);
  }
}

export async function getOrCreateDefaultUser() {
  await ensureDatabaseSchema();
  const email = process.env.DEFAULT_USER_EMAIL || "furkan@watchlist.local";
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Furkan",
        role: "ADMIN",
      },
    });
  }

  return user;
}
