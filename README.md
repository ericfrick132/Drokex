# 🚀 DROKEX - Multi-Tenant Marketplace



                                                                                                                                                        
  - Super Admin (global):                                                                                                                                         
      - master@drokex.com / Master@Drokex2024!                                                                                                                    
      - admin@drokex.com / Admin@Drokex2024!                                                                                                                      
      - support@drokex.com / Support@Drokex2024!                                                                                                                  
  - Admin de tenant (Role=Admin, usa /login):                                                                                                                     
      - superadmin@honduras.drokex.com / SuperAdmin123!                                                                                                           
      - superadmin@guatemala.drokex.com / SuperAdmin123!                                                                                                          
      - superadmin@mexico.drokex.com / SuperAdmin123!                                                                                                             
  - Proveedores (Role=Provider, usa /login):                                                                                                                      
      - admin@cafemonteverde.hn / Admin123!                                                                                                                       
      - admin@mieldorada.hn / Admin123!                                                                                                                           
      - admin@textilesmaya.gt / Admin123!                                                                                                                         
      - admin@cardamomopremium.gt / Admin123!                                                                                                                     
      - admin@aguacatesmichoacan.mx / Admin123!                                                                                                                   
      - admin@tequilalosaltos.mx / Admin123!            

**Connecting LATAM Businesses** - Plataforma multi-tenant para marketplaces regionales

## 🌎 Arquitectura Multi-Tenant

Drokex utiliza una arquitectura multi-tenant que permite crear marketplaces independientes para cada región de LATAM:

- **Honduras**: `honduras.drokex.com` 🇭🇳
- **Guatemala**: `guatemala.drokex.com` 🇬🇹  
- **México**: `mexico.drokex.com` 🇲🇽
- **República Dominicana**: `dominicana.drokex.com` 🇩🇴
- **El Salvador**: `elsalvador.drokex.com` 🇸🇻

## 🎨 Identidad de Marca

### Colores Drokex
- **Verde Lima**: `#abd305` (Color primario)
- **Verde Teal**: `#006d5a` (Color secundario)
- **Crema**: `#fcffee` (Fondo)
- **Negro**: `#161616` (Texto)

### Tipografías
- **Encabezados**: Nagoda (Bold)
- **Texto**: Manrope (Regular, Medium, SemiBold)

## 🛠️ Stack Técnico

### Backend (.NET 8)
- **Multi-tenancy**: Row Level Security (RLS)
- **Base de datos**: PostgreSQL con filtros globales
- **Authentication**: JWT con tenant claims
- **API**: RESTful con Swagger

### Frontend (React + TypeScript)
- **Theming**: CSS custom properties por tenant
- **State**: Context API + localStorage
- **Styling**: CSS Module con sistema Drokex
- **Components**: Componentización con marca

## 🚀 Desarrollo

### Requisitos
- Docker & Docker Compose
- Node.js 18+ (para desarrollo frontend)
- .NET 8 SDK (para desarrollo backend)
- PostgreSQL (externo o containerizado)

### Configuración Inicial

1. **Clonar y configurar**:
```bash
git clone <repo>
cd Dockex
cp .env.example .env
```

2. **Configurar base de datos**:
```bash
# Editar .env con credenciales de PostgreSQL
DB_HOST=localhost  # o host.docker.internal para Docker
DB_NAME=drokexdb
DB_USER=postgres
DB_PASSWORD=tu_password
```

3. **Iniciar con Docker**:
```bash
# Producción
docker-compose up --build

# Desarrollo con servicios adicionales
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### URLs de Desarrollo

- **Frontend**: http://localhost:3100
- **Backend API**: http://localhost:5100
- **Swagger**: http://localhost:5100/swagger
- **Docs**: http://localhost:8080 (dev mode)
- **Adminer**: http://localhost:8081 (dev mode)

### Acceso por Tenant

#### Desarrollo Local:
```bash
# Por query parameter
http://localhost:3100?tenant=honduras
http://localhost:3100?tenant=guatemala
http://localhost:3100?tenant=mexico

# Por header HTTP (para testing API)
curl -H "X-Tenant-Subdomain: honduras" http://localhost:5100/api/tenants/current
```

#### Producción:
```bash
https://honduras.drokex.com
https://guatemala.drokex.com
https://mexico.drokex.com
```

## 🗄️ Base de Datos

### Migración Multi-Tenant
```bash
cd src/backend/Dockex.API
dotnet ef database update
```

### Tenants por Defecto
El sistema crea automáticamente 3 tenants base:
- Honduras (ID: 1)
- Guatemala (ID: 2)  
- México (ID: 3)

### Estructura Multi-Tenant
Todas las tablas principales incluyen:
- `TenantId` (required)
- Filtros globales automáticos
- Índices compuestos para performance

## 🧪 Testing Multi-Tenancy

### Crear Nuevo Tenant
```bash
curl -X POST http://localhost:5100/api/tenants/setup \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "costarica",
    "country": "Costa Rica", 
    "countryCode": "CR",
    "currency": "CRC",
    "currencySymbol": "₡",
    "adminEmail": "admin@costarica.drokex.com"
  }'
```

### Verificar Tenant Actual
```bash
# Con subdomain header
curl -H "X-Tenant-Subdomain: honduras" http://localhost:5100/api/tenants/current

# Información de debugging
curl http://localhost:5100/tenant-info
```

### Validar Aislamiento
```bash
# Solo devuelve empresas del tenant actual
curl -H "X-Tenant-Subdomain: guatemala" http://localhost:5100/api/companies

# Cambiar a otro tenant
curl -H "X-Tenant-Subdomain: mexico" http://localhost:5100/api/companies
```

## 📊 Características Multi-Tenant

### Resolución de Tenant
1. **Subdomain** (producción): `honduras.drokex.com`
2. **Header HTTP**: `X-Tenant-Subdomain: honduras`
3. **Query parameter**: `?tenant=honduras`
4. **Fallback**: Tenant por defecto en desarrollo

### Filtros Automáticos
- Todas las queries incluyen `WHERE TenantId = @currentTenantId`
- Auto-asignación de TenantId en entidades nuevas
- Validación en controllers via `BaseTenantController`

### Configuración por Tenant
- **Colores personalizados** por región
- **Moneda local** (HNL, GTQ, MXN, etc.)
- **Zona horaria** específica
- **Límites por plan** (empresas, productos)

## 🎯 Planes y Límites

### Trial (30 días) - Gratuito
- ✅ 50 empresas máximo
- ✅ 500 productos máximo  
- ✅ Todas las funcionalidades
- ❌ Sin soporte prioritario

### Starter ($99/mes)
- ✅ 100 empresas
- ✅ 1,000 productos
- ✅ 2.5% comisión por transacción

### Business ($299/mes)  
- ✅ 500 empresas
- ✅ 5,000 productos
- ✅ 1.5% comisión por transacción

### Enterprise (Personalizado)
- ✅ Sin límites
- ✅ Comisión negociable
- ✅ SLA garantizado

## 🔐 Seguridad Multi-Tenant

### Aislamiento de Datos
- ✅ Filtros automáticos EF Core
- ✅ Validación de tenant en requests  
- ✅ JWT claims incluyen TenantId
- ✅ Imposible acceso cross-tenant

### Headers de Seguridad
- `X-Drokex-Tenant`: Tenant actual
- `X-Drokex-Region`: País/región
- Rate limiting por tenant

## 📈 Monitoreo

### Métricas por Tenant
- Empresas activas/pendientes
- Productos publicados  
- Usuarios registrados
- Revenue mensual
- Última actividad

### Logs Estructurados
Todos los logs incluyen:
```json
{
  "tenantId": 1,
  "tenantSubdomain": "honduras", 
  "action": "CreateProduct",
  "userId": "user@example.com"
}
```

## 🚀 Despliegue

### Variables de Entorno Críticas
```bash
# Multi-tenancy
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=db;Database=drokexdb;...

# CORS para subdominios
AdditionalCorsOrigins=https://honduras.drokex.com,https://guatemala.drokex.com

# JWT
Jwt__Key=drokex-secret-key-minimum-32-characters-long

# Frontend
REACT_APP_MULTI_TENANT=true
REACT_APP_SUPPORTED_REGIONS=honduras,guatemala,mexico
```

### DNS Wildcard
```
*.drokex.com -> Tu servidor
honduras.drokex.com -> Tu servidor  
guatemala.drokex.com -> Tu servidor
mexico.drokex.com -> Tu servidor
```

## 🎨 Personalización de Marca

### CSS Custom Properties
```css
:root {
  --drokex-primary: #abd305;
  --drokex-secondary: #006d5a;
}

[data-tenant="honduras"] {
  --drokex-accent-country: #0073e6;
}

[data-tenant="guatemala"] {  
  --drokex-accent-country: #4285f4;
}
```

### Componentes de Marca
```tsx
import { DrokexLogo, DrokexGradient } from './components/branding';

<DrokexLogo size="lg" showCountry variant="full" />
<DrokexGradient direction="to-br">Content</DrokexGradient>
```

## 📚 APIs Principales

### Tenant Management
- `GET /api/tenants/current` - Tenant actual
- `POST /api/tenants/setup` - Crear tenant
- `GET /api/tenants/check-subdomain/{subdomain}` - Validar disponibilidad

### Multi-Tenant Data
- `GET /api/companies` - Empresas del tenant actual
- `GET /api/products` - Productos del tenant actual  
- `GET /api/categories` - Categorías del tenant actual

### Debugging
- `GET /health` - Estado del sistema
- `GET /tenant-info` - Info de tenant actual

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-region`
3. Commit: `git commit -m 'Add: marketplace para Ecuador'`
4. Push: `git push origin feature/nueva-region`
5. Pull Request

## 📄 Licencia

Drokex - Proprietary Software
© 2024 Drokex Team. All rights reserved.

---

**🚀 Drokex - Connecting LATAM Businesses**
*Transforming regional commerce through technology*
