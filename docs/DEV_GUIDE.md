# Guía de Desarrollo

1. Clona este repositorio y entra en `spa-ecommerce/`.
2. Asegúrate de tener Node 20+ y npm.
3. Instala dependencias en cada paquete:
   - `cd frontend && npm install`
   - `cd backend && npm install`
4. Levanta el frontend: `npm run dev` dentro de `frontend/`.
5. Levanta el backend: `npm run dev` dentro de `backend/`.

## Docker local

- `cp .env.example .env`
- `docker compose up --build`
- FE: http://localhost:9000  BE: http://localhost:3000/health  DB: localhost:5432
