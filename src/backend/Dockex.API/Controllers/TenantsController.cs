using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Dockex.API.Services;
using Dockex.API.Models;
using Dockex.API.DTOs;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
    public class TenantsController : BaseTenantController
{
    public TenantsController(
        ITenantResolutionService tenantResolution,
        ITenantService tenantService,
        ILogger<TenantsController> logger)
        : base(tenantResolution, tenantService, logger)
    {
    }

    private static (string? heroTitle, string? heroSubtitle, string? ctaText) ExtractCmsFromCustomCss(string? customCss)
    {
        if (string.IsNullOrEmpty(customCss)) return (null, null, null);
        var markerStart = "/*CMS:";
        var idx = customCss.IndexOf(markerStart);
        if (idx < 0) return (null, null, null);
        var endIdx = customCss.IndexOf("*/", idx + markerStart.Length);
        if (endIdx < 0) return (null, null, null);
        var json = customCss.Substring(idx + markerStart.Length, endIdx - (idx + markerStart.Length));
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(json);
            string? gt(string name) => doc.RootElement.TryGetProperty(name, out var p) ? p.GetString() : null;
            return (gt("heroTitle"), gt("heroSubtitle"), gt("ctaText"));
        }
        catch { return (null, null, null); }
    }

    private static string UpsertCmsInCustomCss(string? customCss, object cms)
    {
        var cmsJson = System.Text.Json.JsonSerializer.Serialize(cms);
        var markerStart = "/*CMS:";
        var startIdx = customCss?.IndexOf(markerStart) ?? -1;
        if (startIdx >= 0)
        {
            var endIdx = customCss!.IndexOf("*/", startIdx + markerStart.Length);
            if (endIdx > startIdx)
            {
                var before = customCss.Substring(0, startIdx);
                var after = customCss.Substring(endIdx + 2);
                return $"{before}{markerStart}{cmsJson}*/{after}";
            }
        }
        return $"{markerStart}{cmsJson}*/" + (customCss ?? string.Empty);
    }

    /// <summary>
    /// Obtiene contenido mínimo de Landing (CMS) por tenant (desde CustomCss comment)
    /// </summary>
    [HttpGet("cms")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLandingCms()
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;
        var t = await _tenantService.GetTenantByIdAsync(CurrentTenantId!.Value);
        if (t == null) return NotFound(CreateTenantErrorResponse("Tenant no encontrado"));
        var (heroTitle, heroSubtitle, ctaText) = ExtractCmsFromCustomCss(t.CustomCss);
        return Ok(CreateTenantResponse(new { heroTitle, heroSubtitle, ctaText }, "CMS obtenido"));
    }

    /// <summary>
    /// Actualiza contenido mínimo de Landing (CMS) por tenant
    /// </summary>
    [HttpPut("cms")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateLandingCms([FromBody] LandingCmsDto dto)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;
        var t = await _tenantService.GetTenantByIdAsync(CurrentTenantId!.Value);
        if (t == null) return NotFound(CreateTenantErrorResponse("Tenant no encontrado"));
        t.CustomCss = UpsertCmsInCustomCss(t.CustomCss, new { dto.HeroTitle, dto.HeroSubtitle, dto.CtaText });
        await (_tenantService as TenantService)!.UpdateTenantAsync(t);
        return Ok(CreateTenantResponse(new { success = true }, "CMS actualizado"));
    }


    /// <summary>
    /// Obtiene información del tenant actual
    /// </summary>
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentTenant()
    {
        var tenant = await GetCurrentTenantAsync();
        if (tenant == null)
        {
            return NotFound(CreateTenantErrorResponse("Tenant no encontrado", 
                "No se pudo identificar el tenant. Verifique el subdominio o headers."));
        }

        var config = await _tenantService.GetTenantConfigurationAsync(tenant.Id);
        var stats = await _tenantService.GetTenantStatisticsAsync(tenant.Id);

        await LogTenantActivityAsync("GetCurrentTenant", new { tenant.Subdomain });

        return Ok(CreateTenantResponse(new
        {
            tenant.Id,
            tenant.Name,
            tenant.Subdomain,
            tenant.Country,
            tenant.CountryCode,
            tenant.Currency,
            tenant.CurrencySymbol,
            tenant.PlanType,
            tenant.IsTrialPeriod,
            tenant.TrialEndsAt,
            Configuration = config,
            Statistics = stats,
            DrokexBranding = new
            {
                PrimaryColor = "#abd305",
                SecondaryColor = "#006d5a",
                LogoUrl = "/assets/drokex-logo.svg",
                Tagline = "Connecting LATAM Businesses"
            }
        }, "Información del tenant obtenida exitosamente"));
    }

    /// <summary>
    /// Lista todos los tenants disponibles (solo para desarrollo)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllTenants()
    {
        // Solo permitir en desarrollo
        if (!Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.Equals("Development", StringComparison.OrdinalIgnoreCase) == true)
        {
            return Forbid("Esta función solo está disponible en desarrollo");
        }

        var tenants = await _tenantService.GetAllTenantsAsync();
        
        var response = tenants.Select(t => new
        {
            t.Id,
            t.Name,
            t.Subdomain,
            t.Country,
            t.CountryCode,
            t.Currency,
            t.CurrencySymbol,
            t.PlanType,
            t.IsActive,
            t.CreatedAt,
            Url = $"https://{t.Subdomain}.drokex.com",
            DevUrl = $"http://{t.Subdomain}.localhost:3100"
        });

            return Ok(CreateTenantResponse(response, "Lista de tenants obtenida exitosamente"));
        }

    /// <summary>
    /// Crea un nuevo tenant (setup)
    /// </summary>
    [HttpPost("setup")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupNewTenant([FromBody] TenantSetupDto setupDto)
    {
        try
        {
            // Validar que el subdominio esté disponible
            var isAvailable = await _tenantService.IsSubdomainAvailableAsync(setupDto.Subdomain);
            if (!isAvailable)
            {
                return BadRequest(CreateTenantErrorResponse("Subdominio no disponible", 
                    $"El subdominio '{setupDto.Subdomain}' ya está en uso. Pruebe con otro."));
            }

            var tenant = new Tenant
            {
                Name = setupDto.Subdomain, // provisional; se suele renombrar luego
                Subdomain = setupDto.Subdomain.ToLower(),
                Country = setupDto.Country,
                CountryCode = setupDto.CountryCode,
                Currency = setupDto.Currency,
                CurrencySymbol = setupDto.CurrencySymbol,
                AdminEmail = setupDto.AdminEmail,
                TimeZone = setupDto.TimeZone ?? "UTC",
                LanguageCode = setupDto.LanguageCode ?? "es",
                IsActive = false // Queda pendiente hasta aprobación de Super Admin
            };

            var createdTenant = await _tenantService.CreateTenantAsync(tenant);

            _logger.LogInformation("Nuevo tenant Drokex creado: {TenantName} ({Subdomain})", 
                createdTenant.Name, createdTenant.Subdomain);

            var response = new
            {
                createdTenant.Id,
                createdTenant.Name,
                createdTenant.Subdomain,
                createdTenant.Country,
                ProductionUrl = $"https://{createdTenant.Subdomain}.drokex.com",
                DevelopmentUrl = $"http://{createdTenant.Subdomain}.localhost:3100",
                TrialEndsAt = createdTenant.TrialEndsAt,
                Message = "¡Bienvenido a Drokex! Su marketplace regional está listo.",
                NextSteps = new[]
                {
                    "Acceda a su marketplace usando la URL proporcionada",
                    "Complete el registro de su primera empresa",
                    "Comience a subir productos al catálogo",
                    "Invite compradores a explorar sus productos"
                }
            };

            return Ok(CreateTenantResponse(response, "Tenant creado exitosamente"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creando tenant: {Subdomain}", setupDto.Subdomain);
            return BadRequest(CreateTenantErrorResponse("Error creando tenant", ex.Message));
        }
    }

    /// <summary>
    /// Actualiza la configuración del tenant actual
    /// </summary>
    [HttpPut("configuration")]
    [Authorize]
    public async Task<IActionResult> UpdateTenantConfiguration([FromBody] TenantConfiguration config)
    {
        var validationResult = ValidateTenantRequired();
        if (validationResult != null) return validationResult;

        try
        {
            await _tenantService.UpdateTenantConfigurationAsync(CurrentTenantId!.Value, config);
            
            await LogTenantActivityAsync("UpdateConfiguration", new 
            { 
                PrimaryColor = config.PrimaryColor,
                Currency = config.Currency,
                TransactionFee = config.TransactionFee
            });

            return Ok(CreateTenantResponse(config, "Configuración actualizada exitosamente"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error actualizando configuración del tenant {TenantId}", CurrentTenantId);
            return BadRequest(CreateTenantErrorResponse("Error actualizando configuración", ex.Message));
        }
    }

    /// <summary>
    /// Obtiene estadísticas del tenant actual
    /// </summary>
    [HttpGet("statistics")]
    [Authorize]
    public async Task<IActionResult> GetTenantStatistics()
    {
        var validationResult = ValidateTenantRequired();
        if (validationResult != null) return validationResult;

        try
        {
            var stats = await _tenantService.GetTenantStatisticsAsync(CurrentTenantId!.Value);
            
            await LogTenantActivityAsync("ViewStatistics");

            return Ok(CreateTenantResponse(stats, "Estadísticas obtenidas exitosamente"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo estadísticas del tenant {TenantId}", CurrentTenantId);
            return BadRequest(CreateTenantErrorResponse("Error obteniendo estadísticas", ex.Message));
        }
    }

    /// <summary>
    /// Valida disponibilidad de subdominio
    /// </summary>
    [HttpGet("check-subdomain/{subdomain}")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckSubdomainAvailability(string subdomain)
    {
        if (string.IsNullOrEmpty(subdomain) || subdomain.Length < 3)
        {
            return BadRequest(CreateTenantErrorResponse("Subdominio inválido", 
                "El subdominio debe tener al menos 3 caracteres"));
        }

        var isAvailable = await _tenantService.IsSubdomainAvailableAsync(subdomain);
        
        var response = new
        {
            Subdomain = subdomain,
            IsAvailable = isAvailable,
            SuggestedUrl = $"https://{subdomain}.drokex.com",
            Message = isAvailable 
                ? "¡Subdominio disponible!" 
                : "Subdominio ya está en uso"
        };

        return Ok(CreateTenantResponse(response, "Validación de subdominio completada"));
    }
}

public class TenantSetupDto
{
    public string Subdomain { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public string CurrencySymbol { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string? TimeZone { get; set; }
    public string? LanguageCode { get; set; }
}

public class LandingCmsDto
{
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }
    public string? CtaText { get; set; }
}
