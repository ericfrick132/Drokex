# Drokex — Despliegue (MVP)

## Infraestructura recomendada
- Frontend (React): $5
- API .NET: $5
- PostgreSQL: $7

## Requisitos
- Dominios y subdominios (prod): *.drokex.com
- Dev: subdominio en localhost (ej. honduras.localhost:3100)
- Variables: JWT Key, cadena de conexión Postgres, Cloudinary (imágenes)

## Pasos
1. Construir imágenes Docker y levantar docker-compose.
2. API aplica migraciones automáticamente y hace seeding.
3. Configurar DNS (prod) para subdominios de tenant a frontend/API.
4. Verificar CORS en API (permite *.drokex.com y *.localhost:3100).

## Multi-tenant
- Resolución por subdominio (middleware) + header X-Tenant-Subdomain desde el frontend.

## Impersonación
- Super Admin: /api/superadmin/impersonate -> redirige a /api/auth/impersonate-login en el subdominio.

## Emails
- Integrar proveedor (SendGrid/Mailgun) y configurar env vars para forgot/confirm.
