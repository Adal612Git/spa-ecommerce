# SPA E-commerce – Backend (Express + TypeScript)

## Scripts

- `npm run dev` — desarrollo con recarga (`tsx watch src/index.ts`)
- `npm run build` — compila a `dist/`
- `npm start` — ejecuta compilado (`node dist/index.js`)
- `npm run db:generate` — genera Prisma Client
- `npm run db:migrate` — aplica migraciones
- `npm run db:seed` — ejecuta seed
- `npm run db:reset` — resetea la BD

## Variables

- `DATABASE_URL` — conexión a Postgres
- `CORS_ORIGIN` — origen permitido para CORS (`*` por defecto)

## Rutas

- `GET /health` → `{ "ok": true, "service": "spa-ecommerce-backend" }`
- `GET /api/users` → `[ { id, email, name, role, createdAt }, ... ]`

## Cómo correr

### Local

```bash
# requiere Postgres en localhost:5432
npm ci
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
# http://localhost:3000/health
```

### Docker Compose

```bash
# en la raíz del repositorio
cp .env.example .env
docker compose up --build
# health: http://localhost:3000/health
# users:  http://localhost:3000/api/users
```
