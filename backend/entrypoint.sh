#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "Migration failed or no migrations to apply"
echo "Starting server..."
exec node dist/index.js
