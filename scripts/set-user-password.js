/**
 * Helper script to set or update a user's password and ensure ADMIN role.
 * Usage: node scripts/set-user-password.js <email_or_username> <password> [new_username]
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const idOrEmail = process.argv[2];
  const password = process.argv[3];
  const customUsername = process.argv[4];

  if (!idOrEmail || !password) {
    console.log("Usage: node scripts/set-user-password.js <email_or_username> <password> [new_username]");
    process.exit(1);
  }

  const cleanId = idOrEmail.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanId },
        { username: cleanId },
      ],
    },
  });

  if (existing) {
    const updateData = {
      passwordHash,
      role: "ADMIN",
    };
    if (customUsername) {
      updateData.username = customUsername.trim().toLowerCase();
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
    });
    console.log(`Successfully updated user: ${updated.email} [Username: @${updated.username || 'none'}] [Role: ${updated.role}]`);
  } else {
    const isEmail = cleanId.includes("@");
    const email = isEmail ? cleanId : `${cleanId}@watchlist.local`;
    const username = customUsername ? customUsername.trim().toLowerCase() : (isEmail ? cleanId.split("@")[0] : cleanId);

    const created = await prisma.user.create({
      data: {
        email,
        username,
        name: username,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`Created new admin user: ${created.email} [Username: @${created.username}] [Role: ${created.role}]`);
  }
}

main()
  .catch((err) => {
    console.error("Error setting user password:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
