namespace Dockex.API.Services;

public interface ITenantResolutionService
{
    int? GetCurrentTenantId();
    string? GetCurrentTenantSubdomain();
    void SetCurrentTenant(int tenantId, string subdomain);
    void ClearCurrentTenant();
    bool HasCurrentTenant();
}

public class TenantResolutionService : ITenantResolutionService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<TenantResolutionService> _logger;

    private const string TenantIdKey = "CurrentTenantId";
    private const string TenantSubdomainKey = "CurrentTenantSubdomain";

    public TenantResolutionService(
        IHttpContextAccessor httpContextAccessor,
        ILogger<TenantResolutionService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public int? GetCurrentTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.ContainsKey(TenantIdKey) == true)
        {
            return (int?)httpContext.Items[TenantIdKey];
        }

        return null;
    }

    public string? GetCurrentTenantSubdomain()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.ContainsKey(TenantSubdomainKey) == true)
        {
            return (string?)httpContext.Items[TenantSubdomainKey];
        }

        return null;
    }

    public void SetCurrentTenant(int tenantId, string subdomain)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            httpContext.Items[TenantIdKey] = tenantId;
            httpContext.Items[TenantSubdomainKey] = subdomain;
            
            _logger.LogDebug("Tenant establecido: {TenantId} - {Subdomain}", tenantId, subdomain);
        }
    }

    public void ClearCurrentTenant()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            httpContext.Items.Remove(TenantIdKey);
            httpContext.Items.Remove(TenantSubdomainKey);
        }
    }

    public bool HasCurrentTenant()
    {
        return GetCurrentTenantId().HasValue;
    }
}