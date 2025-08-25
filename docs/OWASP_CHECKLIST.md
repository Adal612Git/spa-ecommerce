# OWASP Top 10 – Checklist Rápida

- **A01 - Broken Access Control:**
  - Uso de JWT y verificación de roles.
- **A02 - Cryptographic Failures:**
  - Contraseñas hasheadas con `bcryptjs`.
  - HTTPS obligatorio y HSTS habilitado.
- **A03 - Injection:**
  - ORM Prisma evita SQL injection.
  - Inputs validados con `zod`.
- **A04 - Insecure Design:**
  - Revisar flujos de negocio y límites de rate limit.
- **A05 - Security Misconfiguration:**
  - `helmet` configurado, CORS restringido, logs sanitizados.
- **A06 - Vulnerable and Outdated Components:**
  - Dependencias actualizadas vía `npm audit`.
- **A07 - Identification and Authentication Failures:**
  - Rate limit estricto en `/auth/*` y expiración de JWT.
- **A08 - Software and Data Integrity Failures:**
  - Validación de payloads en webhooks.
- **A09 - Security Logging and Monitoring Failures:**
  - `pino` con redacción de datos sensibles y recomendación de rotación.
- **A10 - Server-Side Request Forgery:**
  - Webhooks con allowlist de IPs.

## Backups

Ejecutar `backend/scripts/db-backup.sh` para generar un dump comprimido usando `pg_dump`.
Ejemplo de cron diario a las 2 AM:

```
0 2 * * * /ruta/al/repo/backend/scripts/db-backup.sh > /var/log/db-backup.log 2>&1
```
