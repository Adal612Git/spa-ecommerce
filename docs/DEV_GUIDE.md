# Guía de Desarrollo

1. Clona este repositorio y entra en `spa-ecommerce/`.
2. Asegúrate de tener Node 20+ y npm.
3. Instala dependencias en cada paquete:
   - `cd frontend && npm install`
   - `cd backend && npm install`
4. Levanta el frontend: `npm run dev` dentro de `frontend/`.
5. Antes de iniciar el backend asegúrate de que el puerto 3000 esté libre:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
   Luego, levanta el backend: `npm run dev` dentro de `backend/`.
6. Inicia sesión en el panel de administración con `admin2@example.com` / `admin12345`.

## Docker local
```bash
# Backend + DB con Docker
cp .env.example .env
docker compose up --build
# health: http://localhost:3000/health
# users:  http://localhost:3000/api/users
```
