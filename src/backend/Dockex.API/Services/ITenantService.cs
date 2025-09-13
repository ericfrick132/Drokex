using Dockex.API.Models;

namespace Dockex.API.Services;

public interface ITenantService
{
    // Resolución de tenants
    Task<Tenant?> GetTenantBySubdomainAsync(string subdomain);
    Task<Tenant?> GetTenantByIdAsync(int tenantId);
    Task<Tenant?> GetCurrentTenantAsync();
    
    // Gestión de tenants
    Task<IEnumerable<Tenant>> GetAllTenantsAsync();
    Task<Tenant> CreateTenantAsync(Tenant tenant);
    Task<Tenant> UpdateTenantAsync(Tenant tenant);
    Task<bool> DeleteTenantAsync(int tenantId);
    
    // Validaciones
    Task<bool> IsSubdomainAvailableAsync(string subdomain);
    Task<bool> ValidateTenantAccessAsync(int tenantId, string userEmail);
    
    // Métricas y estadísticas
    Task<TenantStatistics> GetTenantStatisticsAsync(int tenantId);
    Task UpdateTenantMetricsAsync(int tenantId);
    
    // Configuración regional
    Task<TenantConfiguration> GetTenantConfigurationAsync(int tenantId);
    Task UpdateTenantConfigurationAsync(int tenantId, TenantConfiguration config);
}

public class TenantStatistics
{
    public int TotalCompanies { get; set; }
    public int ActiveCompanies { get; set; }
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int TotalUsers { get; set; }
    public int PendingApprovals { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public DateTime LastActivity { get; set; }
}

public class TenantConfiguration
{
    public string PrimaryColor { get; set; } = "#abd305";
    public string SecondaryColor { get; set; } = "#006d5a";
    public string Currency { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public string TimeZone { get; set; } = "UTC";
    public string LanguageCode { get; set; } = "es";
    public decimal TransactionFee { get; set; } = 2.0m;
    public bool AllowsInternationalShipping { get; set; } = true;
    public string? CustomCss { get; set; }
    public string? LogoUrl { get; set; }
}