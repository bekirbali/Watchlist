#!/bin/sh
set -e

# If dev.db does not exist in /app/prisma (fresh volume), copy template
if [ ! -f /app/prisma/dev.db ]; then
  if [ -f /app/prisma-template/dev.db ]; then
    echo "[Watchlist] Initializing SQLite database from pre-built template..."
    cp /app/prisma-template/dev.db /app/prisma/dev.db
  fi
fi

# Ensure schema is up to date
echo "[Watchlist] Syncing database schema with Prisma..."
npx prisma db push --skip-generate || true

echo "[Watchlist] Starting server on port ${PORT:-3000}..."
exec node server.js

