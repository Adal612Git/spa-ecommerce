#!/usr/bin/env bash
# Example script to deploy frontend to Vercel

set -euo pipefail

vercel deploy frontend --prod --env VITE_API_BASE_URL="$VITE_API_BASE_URL"
