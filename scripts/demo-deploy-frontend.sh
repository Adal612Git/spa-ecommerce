#!/usr/bin/env bash
# Example script to deploy frontend to Vercel

set -euo pipefail

if [ -f .env.demo ]; then
  set -a
  source .env.demo
  set +a
fi

vercel deploy frontend --prod --env VITE_API_URL="$VITE_API_URL"
