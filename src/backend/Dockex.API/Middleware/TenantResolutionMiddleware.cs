using Dockex.API.Services;
using System.Text.Json;

namespace Dockex.API.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService, ITenantResolutionService tenantResolution)
    {
        try
        {
            var tenant = await ResolveTenantAsync(context, tenantService);
            
            if (tenant != null)
            {
                tenantResolution.SetCurrentTenant(tenant.Id, tenant.Subdomain);
                
                // Agregar información del tenant a los headers de respuesta para debugging
                context.Response.Headers["X-Drokex-Tenant"] = tenant.Subdomain;
                context.Response.Headers["X-Drokex-Region"] = tenant.Country;
                
                _logger.LogDebug("Tenant resuelto: {TenantName} ({Subdomain}) para {RequestPath}", 
                    tenant.Name, tenant.Subdomain, context.Request.Path);
            }
            else
            {
                // Para rutas que no requieren tenant (health checks, setup, etc.)
                var isPublicRoute = IsPublicRoute(context.Request.Path);
                if (!isPublicRoute)
                {
                    _logger.LogWarning("No se pudo resolver tenant para: {RequestPath}", context.Request.Path);
                }
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolviendo tenant para {RequestPath}", context.Request.Path);
            await _next(context);
        }
    }

    private async Task<Models.Tenant?> ResolveTenantAsync(HttpContext context, ITenantService tenantService)
    {
        // 1. Intentar resolver desde subdomain (producción)
        var subdomain = ExtractSubdomainFromHost(context.Request.Host.Host);
        if (!string.IsNullOrEmpty(subdomain))
        {
            var tenant = await tenantService.GetTenantBySubdomainAsync(subdomain);
            if (tenant != null)
            {
                return tenant;
            }
        }

        // 2. Resolver desde headers HTTP (para desarrollo y testing)
        if (context.Request.Headers.ContainsKey("X-Tenant-Subdomain"))
        {
            var headerSubdomain = context.Request.Headers["X-Tenant-Subdomain"].ToString();
            if (!string.IsNullOrEmpty(headerSubdomain))
            {
                var tenant = await tenantService.GetTenantBySubdomainAsync(headerSubdomain);
                if (tenant != null)
                {
                    return tenant;
                }
            }
        }

        // 3. (Eliminado) No resolvemos por query parameter; usar subdominio

        // 4. Fallback a tenant por defecto para desarrollo
        if (IsDevelopmentEnvironment(context))
        {
            return await tenantService.GetTenantBySubdomainAsync("honduras"); // Tenant por defecto
        }

        return null;
    }

    private string? ExtractSubdomainFromHost(string host)
    {
        if (string.IsNullOrEmpty(host))
            return null;

        // Eliminar puerto si existe
        var hostWithoutPort = host.Split(':')[0];
        
        // Para drokex.com y www.drokex.com
        var parts = hostWithoutPort.Split('.');
        
        // Si es subdomain.drokex.com
        if (parts.Length >= 3 && parts[^2] == "drokex" && parts[^1] == "com")
        {
            var subdomain = parts[0];
            
            // Excluir subdominios conocidos del sistema
            var systemSubdomains = new[] { "www", "api", "admin", "app" };
            if (!systemSubdomains.Contains(subdomain.ToLower()))
            {
                return subdomain;
            }
        }

        return null;
    }

    private bool IsPublicRoute(string path)
    {
        var publicRoutes = new[]
        {
            "/health",
            "/ping",
            "/swagger",
            "/api/tenants/setup",
            "/api/auth/register-tenant",
            "/_framework", // Blazor/SignalR
            "/favicon.ico"
        };

        return publicRoutes.Any(route => path.StartsWith(route, StringComparison.OrdinalIgnoreCase));
    }

    private bool IsDevelopmentEnvironment(HttpContext context)
    {
        // Detectar localhost o IPs de desarrollo
        var host = context.Request.Host.Host.ToLower();
        return host == "localhost" || 
               host.StartsWith("127.0.0.1") || 
               host.StartsWith("192.168.") ||
               host.StartsWith("10.0.") ||
               Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
    }
}

// Extensión para registrar el middleware fácilmente
public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
