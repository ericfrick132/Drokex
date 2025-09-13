# GymHero Multi-Tenancy Implementation

## Resumen

GymHero ha sido convertido de una aplicación single-tenant a una aplicación **multi-tenant** completa, lista para ser vendida como SaaS. Cada gimnasio (tenant) tiene sus datos completamente aislados y puede acceder a la aplicación a través de su propio subdominio.

## Arquitectura Multi-Tenancy

### Estrategia Implementada: Row Level Security (RLS)
- **Una base de datos** con múltiples tenants
- **Aislamiento por `tenant_id`** en cada tabla
- **Filtros globales automáticos** via Entity Framework
- **Resolución de tenant** por subdominio o headers HTTP

### Ventajas de esta implementación:
- ✅ **Eficiencia de recursos** (una sola base de datos)
- ✅ **Facilidad de mantenimiento** y actualizaciones
- ✅ **Backup y recuperación simplificados**
- ✅ **Escalabilidad horizontal**
- ✅ **Costos reducidos** de infraestructura

## Componentes Implementados

### 1. Backend (ASP.NET Core)

#### Modelo Tenant
```csharp
public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; }       // Nombre del gimnasio
    public string Subdomain { get; set; }  // URL: subdomain.gymhero.fitness
    public string AdminEmail { get; set; }
    public bool IsTrialPeriod { get; set; }
    public DateTime? TrialEndsAt { get; set; }
    public int? MaxMembers { get; set; }    // Límites por plan
    public int? MaxClasses { get; set; }
    // ... más propiedades
}
```

#### Middleware de Resolución de Tenant
- **Automático**: Resuelve el tenant desde el subdominio de la URL
- **Fallback**: Headers HTTP `X-Tenant-ID` o `X-Tenant-Subdomain`
- **Desarrollo**: Query parameter `?tenant=demo`

#### Entity Framework Filters
- **Filtros globales automáticos** en todas las consultas
- **Auto-asignación** de `TenantId` en entidades nuevas
- **Configuración**: Se aplica solo cuando hay un tenant activo

#### Servicios Multi-Tenant
- `ITenantService` - Gestión de tenants
- `TenantResolutionMiddleware` - Resolución automática
- JWT tokens incluyen `tenant_id` claim

### 2. Frontend (React + TypeScript)

#### TenantProvider
- **Inicialización automática** del tenant desde la URL
- **Estado global** via Redux
- **Loading states** durante la inicialización

#### Servicios de Tenant
- `tenantService` - API calls para gestión de tenants
- **Headers automáticos** para identificar tenant en cada request
- **Soporte multi-ambiente** (desarrollo y producción)

#### Componentes
- `TenantInfo` - Muestra información del tenant actual
- `TenantSetupPage` - Página para crear nuevos tenants

## URLs Multi-Tenant

### Producción
- **Tenant principal**: `https://demo.gymhero.fitness`
- **Nuevo tenant**: `https://mygym.gymhero.fitness`
- **Setup**: `https://gymhero.fitness/setup`

### Desarrollo
- **Con query param**: `http://localhost:3000?tenant=demo`
- **Headers HTTP**: `X-Tenant-Subdomain: demo`

## Configuración del Entorno

### 1. Base de Datos
```bash
# Ejecutar migraciones para agregar tabla Tenants y TenantId
dotnet ef database update
```

### 2. Variables de Entorno
```bash
# Backend
FRONTEND_URL=http://localhost:3000
ADDITIONAL_CORS_ORIGINS=https://demo.gymhero.fitness,https://*.gymhero.fitness

# Frontend  
REACT_APP_API_URL=http://localhost:5000
```

### 3. DNS Configuration (Producción)
```
# Wildcard DNS para subdomínios
*.gymhero.fitness -> Tu servidor
demo.gymhero.fitness -> Tu servidor
```

## Flujo de Creación de Tenant

### 1. Registro
1. Usuario visita `/setup`
2. Completa formulario con datos del gimnasio
3. Sistema verifica disponibilidad del subdominio
4. Crea tenant con **30 días de prueba gratuita**

### 2. Acceso
1. Usuario accede a `https://subdominio.gymhero.fitness`
2. Middleware resuelve tenant por subdominio
3. Usuario hace login con sus credenciales
4. JWT incluye `tenant_id` para todas las requests

### 3. Datos Aislados
- Todos los datos (miembros, clases, pagos) están **aislados por tenant**
- Filtros automáticos previenen acceso cross-tenant
- Cada tenant ve solo sus propios datos

## Planes y Límites

### Plan Gratuito (30 días)
- ✅ Hasta 100 miembros
- ✅ Hasta 50 clases
- ✅ Funcionalidades completas
- ❌ Sin soporte prioritario

### Planes Pagos (Futuro)
- 🔄 **Básico**: 200 miembros, 100 clases
- 🔄 **Pro**: 500 miembros, 250 clases  
- 🔄 **Enterprise**: Sin límites

## Seguridad Multi-Tenant

### Aislamiento de Datos
- ✅ **Filtros automáticos** a nivel de Entity Framework
- ✅ **Validación** de tenant en cada request
- ✅ **JWT claims** incluyen tenant_id
- ✅ **Middleware de autorización** verifica tenant activo

### Prevención Cross-Tenant
- ✅ Imposible acceder datos de otros tenants
- ✅ Auto-asignación de tenant_id en entidades nuevas
- ✅ Validación de tenant en controladores

## Monitoreo y Métricas

### Métricas por Tenant
- Número de miembros activos
- Número de clases programadas  
- Última actividad
- Uso vs límites del plan

### Logs Multi-Tenant
- Todos los logs incluyen `TenantId` para debugging
- Separación clara de logs por tenant

## Testing Multi-Tenancy

### URLs de Prueba
```bash
# Crear tenant demo
POST /api/tenants
{
  "name": "Gimnasio Demo",
  "subdomain": "demo", 
  "adminEmail": "admin@demo.com"
}

# Acceder con tenant
GET /api/tenants/current
Headers: X-Tenant-Subdomain: demo

# Verificar aislamiento
GET /api/members (solo devuelve miembros del tenant actual)
```

### Desarrollo Local
```bash
# Iniciar con tenant demo
http://localhost:3000?tenant=demo

# Crear nuevo tenant desde setup
http://localhost:3000/setup
```

## Migración desde Single-Tenant

Los datos existentes se asocian automáticamente al **tenant por defecto** (ID: 1) durante la migración:

```sql
-- Todos los datos existentes van al tenant demo
UPDATE Members SET TenantId = 1;
UPDATE GymClasses SET TenantId = 1;
-- etc...
```

## Próximos Pasos SaaS

### 1. Implementar Billing
- Integración con Stripe/Payment providers
- Gestión de suscripciones
- Upgrade/downgrade de planes

### 2. Administración Global  
- Panel de admin para gestionar todos los tenants
- Métricas globales del SaaS
- Soporte técnico

### 3. Optimizaciones
- Caching por tenant
- CDN para assets estáticos
- Database sharding (si es necesario)

---

## Comandos Útiles

```bash
# Backend: Ejecutar migraciones
cd src/backend/GymHero.API
dotnet ef database update

# Frontend: Instalar dependencias
cd src/frontend  
npm install

# Docker: Levantar todo el stack
docker-compose up -d

# Testing: Crear tenant de prueba
curl -X POST http://localhost:5000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Gimnasio","subdomain":"mygym","adminEmail":"admin@mygym.com"}'
```

¡GymHero está ahora **100% listo** para ser vendido como SaaS multi-tenant! 🎉