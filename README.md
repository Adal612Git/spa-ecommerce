# SPA E-commerce
[![ci](https://github.com/Adal612Git/spa-ecommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/Adal612Git/spa-ecommerce/actions/workflows/ci.yml)

Monorepo para una tienda en línea con **frontend** (Quasar + Vue 3 + TypeScript) y **backend** (Express + TypeScript).

## Requisitos
- Node 20+ y npm

## Ejecutar en desarrollo
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:9000

# Backend
cd backend
npm install
npm run dev  # http://localhost:3000
```

## Docker (local)
```bash
cp .env.example .env
docker compose up --build
# FE: http://localhost:9000
# BE: http://localhost:3000/health
# DB: localhost:5432
```

## Convenciones
- Ramas: `main` (protegida) y `develop` (desarrollo). Trabaja en ramas `feat/*` o `fix/*`.
- Commits: usa [Conventional Commits](https://www.conventionalcommits.org/).
- Issues y PRs usan sus plantillas en `.github/`.

## Licencia
[MIT](LICENSE)

## Demo Deployment

Ejemplo rápido de cómo publicar una demo en producción usando **Render** para el backend y **Vercel** para el frontend. Revisa `.env.demo` para valores de referencia.

### Backend (Render)

1. Crea un servicio desde la carpeta `backend`.
2. Configura variables de entorno:

   ```
   DATABASE_URL=postgresql://demo_user:demo_pass@demo-db:5432/spa_ecommerce
   JWT_SECRET=demo_supersecret
   MP_ACCESS_TOKEN=TEST-1234567890123456-012345-1234567890abcdef-012345-abcdef1234567890abcdef1234567890-012345678
   MP_ALLOWED_IPS=0.0.0.0/0
   CORS_ORIGIN=https://demo.miapp.com
   ```

3. Usa `npm install && npm run build` como comando de build y `npm run start` como start command.

### Frontend (Vercel)

1. Despliega la carpeta `frontend` como proyecto estático.
2. Define la variable de entorno:

   ```
   VITE_API_URL=https://<tu-backend-demonstrativo>
   ```

3. Vercel detectará el framework y construirá con `npm install && npm run build`.

### Dominio y MercadoPago

- Apunta un dominio (p.ej. `demo.miapp.com`) al frontend y habilita HTTPS.
- Utiliza credenciales **sandbox** de MercadoPago para todas las pruebas.
