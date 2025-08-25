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
- `CORS_ORIGIN` — orígenes permitidos para CORS separados por coma (ej. `https://mi-front.com`)
- `JWT_SECRET` — secreto para firmar JWT
- `JWT_EXPIRES_IN` — expiración del token (ej. `7d`)
- `MP_ACCESS_TOKEN` — token de acceso de MercadoPago
- `MP_ALLOWED_IPS` — IPs permitidas para webhooks de MercadoPago (separadas por coma)

## Seguridad

- `helmet` aplicado con HSTS, XSS Filter y `noSniff`.
- CORS restringido a los dominios definidos en `CORS_ORIGIN`.
- Rate limiting con `express-rate-limit`:
  - `/auth/*` → 5 solicitudes por minuto por IP.
  - `/webhook/mercadopago` → 30 solicitudes por minuto por IP.
- Script `scripts/db-backup.sh` para respaldos diarios de la base de datos (ejecutar vía cron).

## Logs

- Los logs se guardan en `logs/app.log`.
- Se rotan diariamente o al alcanzar 10 MB, conservando solo los últimos 7 archivos.
- Datos sensibles como tokens o contraseñas se redactan como `[REDACTED]`.

## Rutas

- `GET /health` → `{ "ok": true, "service": "spa-ecommerce-backend" }`
- `POST /auth/register` → crea usuario `{ id, email, name, role, createdAt }`
- `POST /auth/login` → `{ token }`
- `GET /auth/me` → usuario autenticado `{ id, email, name, role, createdAt }`
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
