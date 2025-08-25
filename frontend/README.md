# SPA E-commerce – Frontend (Quasar + TypeScript)

Frontend del monorepo **spa-ecommerce** construido con **Quasar (Vue 3 + Vite + TS)**.

## Requisitos
- Node 20+ y npm
- No instales Quasar CLI global; viene como *devDependency*

## Scripts
```bash
npm run dev     # quasar dev -> http://localhost:9000
npm run build   # quasar build -> genera dist/
npm run lint    # lint con ESLint
npm run format  # formatea con Prettier
```

## Estructura `src/`
- `pages/`: páginas de la app
- `components/`: componentes reutilizables
- `layouts/`: layouts principales
- `router/`: configuración de rutas
- `stores/`: Pinia stores

## Rutas

- `/` → Home
- `/login` → Login
- `/register` → Register

## Stores

- `useAuthStore`: maneja `login`, `register` y `logout`. Persiste el token JWT en `localStorage` y expone el getter `isAuthenticated`.
- `useProductStore`: store inicial para productos con método `fetchProducts` (sin implementación todavía).

## Flujo de autenticación

El guard global del router verifica `to.meta.requiresAuth`. Si la ruta requiere autenticación y no existe token, redirige a `/login`. `logout` limpia el token y reinicia el estado.

## Desarrollo
```bash
npm install
npm run dev
```
