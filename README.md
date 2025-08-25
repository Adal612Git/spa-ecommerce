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
