#!/bin/sh
set -e

MAX_RETRIES=20
RETRY=0

echo "Applying Prisma migrations..."
until npx prisma migrate deploy --schema=/app/prisma/schema.prisma; do
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
exec node server.js
