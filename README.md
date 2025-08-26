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

## Deploy Demo

Guía para publicar una demo con backend y frontend reales usando credenciales **sandbox**. Revisa `.env.demo` para valores de referencia.

### Backend (Render)

1. Render puede leer `render.yaml` y crear un servicio web HTTPS para la carpeta `backend`.
2. Define las variables de entorno del archivo `.env.demo`:

   ```
   DATABASE_URL=postgresql://demo_user:demo_pass@demo-db:5432/spa_ecommerce
   JWT_SECRET=demo_supersecret
   MP_ACCESS_TOKEN=TEST-1234567890123456-012345-1234567890abcdef-012345-abcdef1234567890abcdef1234567890-012345678
   MP_ALLOWED_IPS=0.0.0.0/0
   CORS_ORIGIN=https://demo.miapp.com
   ```

3. Usa `npm install && npm run build` como build command y `npm run start` como start command.
4. Render expone automáticamente el servicio con HTTPS.

### Frontend (Vercel)

1. Despliega la carpeta `frontend` empleando la configuración de `frontend/vercel.json`.
2. Configura la variable de entorno `VITE_API_URL` apuntando al backend (p.ej. `https://api.demo.miapp.com`).
3. Vercel ejecutará `npm install && npm run build` y publicará `dist/spa` con HTTPS.

### Dominio y MercadoPago

- Apunta un dominio público, como `demo.miapp.com`, al despliegue del frontend y habilita HTTPS.
- El backend puede exponerse como `api.demo.miapp.com` o usar el dominio por defecto de Render.
- Ejecuta el flujo de pago con credenciales **sandbox** de MercadoPago para verificar la integración.
