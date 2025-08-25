#!/usr/bin/env bash
# Example script to deploy backend using Render CLI
# Requires render.yaml configured in the backend directory

set -euo pipefail

if [ -f .env.demo ]; then
  set -a
  source .env.demo
  set +a
fi

render services deploy spa-ecommerce-backend \
  --branch main \
  --env DATABASE_URL="$DATABASE_URL" \
  --env JWT_SECRET="$JWT_SECRET" \
  --env MP_ACCESS_TOKEN="$MP_ACCESS_TOKEN" \
  --env MP_ALLOWED_IPS="$MP_ALLOWED_IPS"
