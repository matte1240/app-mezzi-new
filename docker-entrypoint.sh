#!/bin/sh
set -e

MAX_RETRIES=20
RETRY=0
UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
PRISMA_CLI="/app/node_modules/.bin/prisma"

mkdir -p "$UPLOAD_DIR"
chown -R nextjs:nodejs "$UPLOAD_DIR"

if [ ! -x "$PRISMA_CLI" ]; then
  echo "Prisma CLI not found at $PRISMA_CLI"
  exit 1
fi

echo "Applying Prisma migrations..."
until su-exec nextjs "$PRISMA_CLI" migrate deploy --schema=/app/prisma/schema.prisma; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "Prisma migrations failed after $MAX_RETRIES attempts"
    exit 1
  fi

  echo "Migration attempt $RETRY failed, retrying in 3 seconds..."
  sleep 3
done

echo "Prisma migrations applied successfully"
echo "Starting Next.js server..."
exec su-exec nextjs node server.js
