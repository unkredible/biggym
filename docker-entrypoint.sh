#!/bin/sh
# -----------------------------------------------------------------------------
# Container entrypoint.
#   1. Apply outstanding Prisma migrations against the tenant database.
#   2. Hand control to the Next.js standalone server (the CMD).
# -----------------------------------------------------------------------------
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "[entrypoint] FATAL: DATABASE_URL is not set" >&2
  exit 1
fi

echo "[entrypoint] tenant=${TENANT_ID}:${TENANT_NAME} — syncing database schema..."

# If the developer has authored migrations (./prisma/migrations/), apply them
# with `prisma migrate deploy` — the production-safe runner that never prompts
# or generates new migrations.
#
# If the template ships without a migrations directory (first-run / bare
# template), fall back to `prisma db push` so the schema is created in the
# tenant DB anyway. Once the developer authors real migrations, this branch
# is no longer taken.
# Invoke the prisma CLI directly via node so __dirname resolves to the
# real package directory (the .bin/prisma shim does not survive the
# multi-stage COPY — its sibling .wasm assets get left behind).
PRISMA="node ./node_modules/prisma/build/index.js"

if [ -d "./prisma/migrations" ] && [ -n "$(ls -A ./prisma/migrations 2>/dev/null)" ]; then
  $PRISMA migrate deploy
else
  echo "[entrypoint] no migrations found — running 'prisma db push' to sync schema"
  # biggym evolves its schema via db push and carries no production data worth
  # protecting yet, so accept the (non-destructive here) data-loss warnings —
  # e.g. adding a unique index on Client.userId. Switch to real migrations
  # before there is irreplaceable data.
  $PRISMA db push --skip-generate --accept-data-loss
fi

echo "[entrypoint] starting Next.js server on :${PORT:-3000}"
exec "$@"
