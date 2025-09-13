using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.Models;

namespace Dockex.API.Services;

public class TenantService : ITenantService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TenantService> _logger;
    private readonly ITenantResolutionService _tenantResolution;

    public TenantService(
        ApplicationDbContext context,
        ILogger<TenantService> logger,
        ITenantResolutionService tenantResolution)
    {
        _context = context;
        _logger = logger;
        _tenantResolution = tenantResolution;
    }

    public async Task<Tenant?> GetTenantBySubdomainAsync(string subdomain)
    {
        if (string.IsNullOrEmpty(subdomain))
            return null;

        return await _context.Tenants
            .FirstOrDefaultAsync(t => t.Subdomain.ToLower() == subdomain.ToLower() && t.IsActive);
    }

    public async Task<Tenant?> GetTenantByIdAsync(int tenantId)
    {
        return await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId && t.IsActive);
    }

    public async Task<Tenant?> GetCurrentTenantAsync()
    {
        var currentTenantId = _tenantResolution.GetCurrentTenantId();
        if (currentTenantId == null)
            return null;

        return await GetTenantByIdAsync(currentTenantId.Value);
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync()
    {
        return await _context.Tenants
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        // Validar subdomain único
        var existingTenant = await GetTenantBySubdomainAsync(tenant.Subdomain);
        if (existingTenant != null)
        {
            throw new InvalidOperationException($"El subdominio '{tenant.Subdomain}' ya está en uso.");
        }

        // Configurar valores por defecto para Drokex
        tenant.PrimaryColor = "#abd305"; // Verde lima Drokex
        tenant.SecondaryColor = "#006d5a"; // Verde teal Drokex
        tenant.IsTrialPeriod = true;
        tenant.TrialEndsAt = DateTime.UtcNow.AddDays(30);
        tenant.CreatedAt = DateTime.UtcNow;
        tenant.IsActive = true;

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Nuevo tenant creado: {TenantName} ({Subdomain})", tenant.Name, tenant.Subdomain);
        
        return tenant;
    }

    public async Task<Tenant> UpdateTenantAsync(Tenant tenant)
    {
        var existingTenant = await GetTenantByIdAsync(tenant.Id);
        if (existingTenant == null)
        {
            throw new ArgumentException("Tenant no encontrado");
        }

        // Actualizar campos
        existingTenant.Name = tenant.Name;
        existingTenant.Country = tenant.Country;
        existingTenant.Currency = tenant.Currency;
        existingTenant.CurrencySymbol = tenant.CurrencySymbol;
        existingTenant.AdminEmail = tenant.AdminEmail;
        existingTenant.PrimaryColor = tenant.PrimaryColor;
        existingTenant.SecondaryColor = tenant.SecondaryColor;
        existingTenant.LogoUrl = tenant.LogoUrl;
        existingTenant.TransactionFeePercent = tenant.TransactionFeePercent;
        existingTenant.MaxCompanies = tenant.MaxCompanies;
        existingTenant.MaxProducts = tenant.MaxProducts;
        existingTenant.TimeZone = tenant.TimeZone;
        existingTenant.LanguageCode = tenant.LanguageCode;
        existingTenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existingTenant;
    }

    public async Task<bool> DeleteTenantAsync(int tenantId)
    {
        var tenant = await GetTenantByIdAsync(tenantId);
        if (tenant == null)
            return false;

        // Soft delete
        tenant.IsActive = false;
        tenant.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        _logger.LogWarning("Tenant desactivado: {TenantName} (ID: {TenantId})", tenant.Name, tenantId);
        return true;
    }

    public async Task<bool> IsSubdomainAvailableAsync(string subdomain)
    {
        if (string.IsNullOrEmpty(subdomain))
            return false;

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Subdomain.ToLower() == subdomain.ToLower());

        return tenant == null;
    }

    public async Task<bool> ValidateTenantAccessAsync(int tenantId, string userEmail)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == userEmail && u.TenantId == tenantId);

        return user != null;
    }

    public async Task<TenantStatistics> GetTenantStatisticsAsync(int tenantId)
    {
        var stats = new TenantStatistics();

        // Estadísticas de empresas
        stats.TotalCompanies = await _context.Companies
            .Where(c => c.TenantId == tenantId)
            .CountAsync();

        stats.ActiveCompanies = await _context.Companies
            .Where(c => c.TenantId == tenantId && c.IsActive && c.IsApproved)
            .CountAsync();

        // Estadísticas de productos
        stats.TotalProducts = await _context.Products
            .Where(p => p.TenantId == tenantId)
            .CountAsync();

        stats.ActiveProducts = await _context.Products
            .Where(p => p.TenantId == tenantId && p.IsActive)
            .CountAsync();

        // Estadísticas de usuarios
        stats.TotalUsers = await _context.Users
            .Where(u => u.TenantId == tenantId)
            .CountAsync();

        // Empresas pendientes de aprobación
        stats.PendingApprovals = await _context.Companies
            .Where(c => c.TenantId == tenantId && !c.IsApproved)
            .CountAsync();

        // Última actividad
        var lastActivity = await _context.Products
            .Where(p => p.TenantId == tenantId)
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => p.UpdatedAt)
            .FirstOrDefaultAsync();

        stats.LastActivity = lastActivity;

        return stats;
    }

    public async Task UpdateTenantMetricsAsync(int tenantId)
    {
        var tenant = await GetTenantByIdAsync(tenantId);
        if (tenant == null) return;

        var stats = await GetTenantStatisticsAsync(tenantId);

        tenant.TotalCompanies = stats.TotalCompanies;
        tenant.TotalProducts = stats.TotalProducts;
        tenant.LastActivityAt = stats.LastActivity;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<TenantConfiguration> GetTenantConfigurationAsync(int tenantId)
    {
        var tenant = await GetTenantByIdAsync(tenantId);
        if (tenant == null)
            throw new ArgumentException("Tenant no encontrado");

        return new TenantConfiguration
        {
            PrimaryColor = tenant.PrimaryColor,
            SecondaryColor = tenant.SecondaryColor,
            Currency = tenant.Currency,
            CurrencySymbol = tenant.CurrencySymbol,
            TimeZone = tenant.TimeZone ?? "UTC",
            LanguageCode = tenant.LanguageCode ?? "es",
            TransactionFee = tenant.TransactionFeePercent,
            AllowsInternationalShipping = tenant.AllowsInternationalShipping,
            CustomCss = tenant.CustomCss,
            LogoUrl = tenant.LogoUrl
        };
    }

    public async Task UpdateTenantConfigurationAsync(int tenantId, TenantConfiguration config)
    {
        var tenant = await GetTenantByIdAsync(tenantId);
        if (tenant == null)
            throw new ArgumentException("Tenant no encontrado");

        tenant.PrimaryColor = config.PrimaryColor;
        tenant.SecondaryColor = config.SecondaryColor;
        tenant.Currency = config.Currency;
        tenant.CurrencySymbol = config.CurrencySymbol;
        tenant.TimeZone = config.TimeZone;
        tenant.LanguageCode = config.LanguageCode;
        tenant.TransactionFeePercent = config.TransactionFee;
        tenant.AllowsInternationalShipping = config.AllowsInternationalShipping;
        tenant.CustomCss = config.CustomCss;
        tenant.LogoUrl = config.LogoUrl;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}