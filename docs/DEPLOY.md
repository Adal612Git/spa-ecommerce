# Guía de Deploy

## Checklist
- `cd frontend && npm ci && npm run build`
- `cd backend && npm ci && npm run build`
- Verificar `GET /health` en la instancia desplegada

## Acciones manuales en GitHub
- Proteger rama `main` obligando PR y *Require status checks to pass* con los jobs de CI.
- Crear labels: `type:bug`, `type:feat`, `scope:fe`, `scope:be`, `good-first-issue`, `prio:high`.
- Crear project board **"Sprint 0 – Setup"** con columnas *To do*, *In progress*, *Review*, *Done*.
