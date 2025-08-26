# Checklist de Cumplimiento

| Punto | Estado | Notas |
| --- | --- | --- |
| Ruta `/orders/:id` | ✅ | Implementada en `frontend/src/router/routes.ts` |
| Ruta `/product/:slug` | ✅ | `frontend/src/router/routes.ts`, `backend/src/routes/products.ts` |
| Componentes `AuthForm`, `CheckoutButton`, `OrderStatusBadge`, `Navbar`, `Footer` | ✅ | `frontend/src/components/` |
| Login con `passport-local` + JWT | ✅ | `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts` |
| Endpoint `GET /api/orders` | ✅ | `backend/src/routes/orders.ts`, `backend/src/app.ts` |
| Campos `priceCents` y `totalCents` en órdenes | ✅ | `backend/src/routes/orders.ts` |
| Enum de órdenes usa `CONFIRMED` | ✅ | `backend/prisma/schema.prisma`, `backend/src/routes/webhook.ts` |
| Validación de firma MercadoPago | ✅ | `backend/src/routes/webhook.ts` |
| `render.yaml` presente | ✅ | `render.yaml` |
| `vercel.json` presente | ✅ | `vercel.json` |
| Seeds (admin, clientes, 10 productos) | ✅ | `backend/prisma/seed.ts` |

## Acciones realizadas automáticamente
- Ajuste de campos `priceCents`/`totalCents` y rutas de productos por `slug`.
- Creación de endpoint `GET /api/orders` y detalle, montados en `app.ts`.
- Actualización de seeds con roles correctos y datos en camelCase.
- Generación de archivo `vercel.json` y carpeta `tests` con casos base.
- Ejecución de `npm install`, `prisma generate` y `npm test`.
