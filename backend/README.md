# SPA E-commerce – Backend (Express + TypeScript)

## Scripts
- `npm run dev` — desarrollo con recarga (`tsx watch src/index.ts`)
- `npm run build` — compila a `dist/`
- `npm start` — ejecuta compilado (`node dist/index.js`)

## Endpoint
- `GET /health` → `{ "ok": true, "service": "spa-ecommerce-backend" }`

## Cómo correr
```bash
npm ci
npm run build
node dist/index.js
# http://localhost:3000/health
```
