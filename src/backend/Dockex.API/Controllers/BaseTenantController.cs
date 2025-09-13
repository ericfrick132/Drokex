using Microsoft.AspNetCore.Mvc;
using Dockex.API.Services;
using Dockex.API.Models;

namespace Dockex.API.Controllers;

[ApiController]
public abstract class BaseTenantController : ControllerBase
{
    protected readonly ITenantResolutionService _tenantResolution;
    protected readonly ITenantService _tenantService;
    protected readonly ILogger _logger;

    protected BaseTenantController(
        ITenantResolutionService tenantResolution,
        ITenantService tenantService,
        ILogger logger)
    {
        _tenantResolution = tenantResolution;
        _tenantService = tenantService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el ID del tenant actual
    /// </summary>
    protected int? CurrentTenantId => _tenantResolution.GetCurrentTenantId();

    /// <summary>
    /// Obtiene el subdomain del tenant actual
    /// </summary>
    protected string? CurrentTenantSubdomain => _tenantResolution.GetCurrentTenantSubdomain();

    /// <summary>
    /// Obtiene el tenant actual completo
    /// </summary>
    protected async Task<Tenant?> GetCurrentTenantAsync()
    {
        return await _tenantService.GetCurrentTenantAsync();
    }

    /// <summary>
    /// Valida que existe un tenant activo para esta request
    /// </summary>
    protected ActionResult? ValidateTenantRequired()
    {
        if (!CurrentTenantId.HasValue)
        {
            return BadRequest(new { 
                error = "Tenant requerido",
                message = "Esta operación requiere un tenant válido. Verifique el subdominio o headers.",
                drokexRegions = new[] { "honduras", "guatemala", "mexico", "dominicana", "elsalvador" }
            });
        }

        return null;
    }

    /// <summary>
    /// Valida que la entidad pertenece al tenant actual
    /// </summary>
    protected bool ValidateEntityTenant(IMultiTenant entity)
    {
        if (!CurrentTenantId.HasValue)
            return false;

        return entity.TenantId == CurrentTenantId.Value;
    }

    /// <summary>
    /// Asigna el tenant actual a una nueva entidad
    /// </summary>
    protected void AssignCurrentTenant(IMultiTenant entity)
    {
        if (CurrentTenantId.HasValue)
        {
            entity.TenantId = CurrentTenantId.Value;
        }
    }

    /// <summary>
    /// Crea respuesta estándar con información de tenant
    /// </summary>
    protected object CreateTenantResponse(object data, string? message = null)
    {
        return new
        {
            success = true,
            message = message,
            data = data,
            tenant = new
            {
                id = CurrentTenantId,
                subdomain = CurrentTenantSubdomain,
                region = CurrentTenantSubdomain?.ToUpperInvariant()
            },
            timestamp = DateTime.UtcNow,
            drokexBrand = "Connecting LATAM Businesses"
        };
    }

    /// <summary>
    /// Crea respuesta de error con información de tenant
    /// </summary>
    protected object CreateTenantErrorResponse(string error, string? message = null)
    {
        return new
        {
            success = false,
            error = error,
            message = message,
            tenant = new
            {
                id = CurrentTenantId,
                subdomain = CurrentTenantSubdomain
            },
            timestamp = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Registra actividad del tenant
    /// </summary>
    protected async Task LogTenantActivityAsync(string action, object? details = null)
    {
        if (CurrentTenantId.HasValue)
        {
            _logger.LogInformation(
                "Tenant Activity - {Action} | Tenant: {TenantId} ({Subdomain}) | Details: {@Details} | User: {UserId}",
                action,
                CurrentTenantId,
                CurrentTenantSubdomain,
                details,
                User.Identity?.Name
            );

            // Actualizar métricas del tenant de forma síncrona dentro del scope del request
            try
            {
                await _tenantService.UpdateTenantMetricsAsync(CurrentTenantId.Value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error actualizando métricas del tenant {TenantId}", CurrentTenantId);
                // No lanzar la excepción para no interrumpir el flujo principal
            }
        }
    }
}
