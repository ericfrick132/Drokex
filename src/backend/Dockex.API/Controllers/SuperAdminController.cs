using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.Models;
using Dockex.API.DTOs;
using Dockex.API.Services;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/superadmin")]
[Authorize]
public class SuperAdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SuperAdminController> _logger;
    private readonly IAuthService _authService;

    public SuperAdminController(
        ApplicationDbContext context,
        ILogger<SuperAdminController> logger,
        IAuthService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    private bool IsSuperAdmin()
    {
        return User.FindFirst("IsSuperAdmin")?.Value == "true";
    }

    [HttpPost("impersonate")]
    public async Task<IActionResult> ImpersonateTenant([FromBody] ImpersonateRequest req)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageUsers"))
        {
            return Forbid();
        }

        try
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == req.TenantId && t.IsActive);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Elegir usuario para impersonar si no se especifica
            var query = _context.Users
                .Include(u => u.Company)
                .Include(u => u.Tenant)
                .Where(u => u.TenantId == tenant.Id && u.IsActive)
                .OrderByDescending(u => u.Role == UserRole.Admin)
                .ThenByDescending(u => u.CreatedAt);

            User? user = null;
            if (req.UserId.HasValue)
            {
                user = await query.FirstOrDefaultAsync(u => u.Id == req.UserId.Value);
            }
            else if (!string.IsNullOrEmpty(req.UserEmail))
            {
                user = await query.FirstOrDefaultAsync(u => u.Email == req.UserEmail);
            }
            else
            {
                user = await query.FirstOrDefaultAsync();
            }

            if (user == null)
            {
                return NotFound(new { message = "No active users to impersonate in this tenant" });
            }

            var token = _authService.GenerateJwtToken(user);

            var devBase = $"http://{tenant.Subdomain}.localhost:3100";
            var devRedirect = $"{devBase}/api/auth/impersonate-login?token={Uri.EscapeDataString(token)}&redirect={Uri.EscapeDataString($"{devBase}/dashboard")}";
            var prodRedirect = $"https://{tenant.Subdomain}.drokex.com/api/auth/impersonate-login?token={Uri.EscapeDataString(token)}&redirect={Uri.EscapeDataString($"https://{tenant.Subdomain}.drokex.com/dashboard")}";

            return Ok(new
            {
                success = true,
                data = new
                {
                    tenant = new { tenant.Id, tenant.Name, tenant.Subdomain },
                    user = new { user.Id, user.Email, user.FirstName, user.LastName, role = user.Role.ToString() },
                    devRedirectUrl = devRedirect,
                    prodRedirectUrl = prodRedirect
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating impersonation token");
            return StatusCode(500, new { message = "An error occurred creating impersonation token" });
        }
    }

    public class ImpersonateRequest
    {
        public int TenantId { get; set; }
        public string? UserEmail { get; set; }
        public int? UserId { get; set; }
    }

    private bool HasPermission(string permission)
    {
        return User.HasClaim("Permission", permission);
    }

    [HttpGet("tenants")]
    public async Task<IActionResult> GetAllTenants()
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            var tenants = await _context.Tenants
                .OrderBy(t => t.Country)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    subdomain = t.Subdomain,
                    country = t.Country,
                    countryCode = t.CountryCode,
                    currency = t.Currency,
                    currencySymbol = t.CurrencySymbol,
                    adminEmail = t.AdminEmail,
                    isActive = t.IsActive,
                    isPaid = t.IsPaid,
                    isTrialPeriod = t.IsTrialPeriod,
                    trialEndsAt = t.TrialEndsAt,
                    planType = t.PlanType,
                    transactionFeePercent = t.TransactionFeePercent,
                    totalRevenue = t.TotalRevenue,
                    totalOrders = t.TotalOrders,
                    createdAt = t.CreatedAt,
                    statistics = new
                    {
                        totalUsers = _context.Users.Count(u => u.TenantId == t.Id),
                        totalCompanies = _context.Companies.Count(c => c.TenantId == t.Id),
                        totalProducts = _context.Products.Count(p => p.TenantId == t.Id),
                        totalLeads = _context.Leads.Count(l => l.TenantId == t.Id)
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = tenants
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tenants");
            return StatusCode(500, new { message = "An error occurred fetching tenants" });
        }
    }

    [HttpGet("tenants/pending")]
    public async Task<IActionResult> GetPendingTenants()
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            var tenants = await _context.Tenants
                .Where(t => !t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    subdomain = t.Subdomain,
                    country = t.Country,
                    createdAt = t.CreatedAt,
                    adminEmail = t.AdminEmail
                })
                .ToListAsync();

            return Ok(new { success = true, data = tenants });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending tenants");
            return StatusCode(500, new { message = "An error occurred fetching pending tenants" });
        }
    }

    [HttpPost("tenants/{id}/approve")]
    public async Task<IActionResult> ApproveTenant(int id)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound(new { success = false, message = "Tenant not found" });
            }

            tenant.IsActive = true;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving tenant {TenantId}", id);
            return StatusCode(500, new { message = "An error occurred approving tenant" });
        }
    }

    [HttpGet("tenants/{id}")]
    public async Task<IActionResult> GetTenant(int id)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            var tenant = await _context.Tenants
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    subdomain = t.Subdomain,
                    country = t.Country,
                    countryCode = t.CountryCode,
                    currency = t.Currency,
                    currencySymbol = t.CurrencySymbol,
                    adminEmail = t.AdminEmail,
                    primaryColor = t.PrimaryColor,
                    secondaryColor = t.SecondaryColor,
                    logoUrl = t.LogoUrl,
                    customCss = t.CustomCss,
                    timeZone = t.TimeZone,
                    languageCode = t.LanguageCode,
                    isActive = t.IsActive,
                    isPaid = t.IsPaid,
                    isTrialPeriod = t.IsTrialPeriod,
                    trialEndsAt = t.TrialEndsAt,
                    planType = t.PlanType,
                    transactionFeePercent = t.TransactionFeePercent,
                    allowsInternationalShipping = t.AllowsInternationalShipping,
                    createdAt = t.CreatedAt,
                    statistics = new
                    {
                        totalUsers = _context.Users.Count(u => u.TenantId == t.Id),
                        activeUsers = _context.Users.Count(u => u.TenantId == t.Id && u.IsActive),
                        totalCompanies = _context.Companies.Count(c => c.TenantId == t.Id),
                        approvedCompanies = _context.Companies.Count(c => c.TenantId == t.Id && c.IsApproved),
                        totalProducts = _context.Products.Count(p => p.TenantId == t.Id),
                        activeProducts = _context.Products.Count(p => p.TenantId == t.Id && p.IsActive),
                        totalLeads = _context.Leads.Count(l => l.TenantId == t.Id),
                        newLeads = _context.Leads.Count(l => l.TenantId == t.Id && l.Status == LeadStatus.New)
                    }
                })
                .FirstOrDefaultAsync();

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            return Ok(new
            {
                success = true,
                data = tenant
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tenant details");
            return StatusCode(500, new { message = "An error occurred fetching tenant" });
        }
    }

    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto dto)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            // Verificar subdomain único
            if (await _context.Tenants.AnyAsync(t => t.Subdomain == dto.Subdomain))
            {
                return BadRequest(new { message = "Subdomain already exists" });
            }

            var tenant = new Tenant
            {
                Name = dto.Name,
                Subdomain = dto.Subdomain.ToLower(),
                Country = dto.Country,
                CountryCode = dto.CountryCode.ToUpper(),
                Currency = dto.Currency.ToUpper(),
                CurrencySymbol = dto.CurrencySymbol,
                AdminEmail = dto.AdminEmail,
                PrimaryColor = dto.PrimaryColor ?? "#abd305",
                SecondaryColor = dto.SecondaryColor ?? "#006d5a",
                TimeZone = dto.TimeZone ?? "UTC",
                LanguageCode = dto.LanguageCode ?? "es",
                PlanType = dto.PlanType ?? "Trial",
                IsTrialPeriod = dto.PlanType == "Trial",
                TrialEndsAt = dto.PlanType == "Trial" ? DateTime.UtcNow.AddDays(30) : null,
                TransactionFeePercent = dto.TransactionFeePercent ?? 2.0m,
                AllowsInternationalShipping = dto.AllowsInternationalShipping ?? false,
                IsActive = true,
                IsPaid = dto.PlanType != "Trial",
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Tenant {tenant.Name} created successfully");

            return Ok(new
            {
                success = true,
                data = new
                {
                    id = tenant.Id,
                    name = tenant.Name,
                    subdomain = tenant.Subdomain,
                    country = tenant.Country
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant");
            return StatusCode(500, new { message = "An error occurred creating tenant" });
        }
    }

    [HttpPut("tenants/{id}")]
    public async Task<IActionResult> UpdateTenant(int id, [FromBody] UpdateTenantDto dto)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageTenants"))
        {
            return Forbid();
        }

        try
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Actualizar campos
            if (!string.IsNullOrEmpty(dto.Name))
                tenant.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.AdminEmail))
                tenant.AdminEmail = dto.AdminEmail;
            if (!string.IsNullOrEmpty(dto.PrimaryColor))
                tenant.PrimaryColor = dto.PrimaryColor;
            if (!string.IsNullOrEmpty(dto.SecondaryColor))
                tenant.SecondaryColor = dto.SecondaryColor;
            if (!string.IsNullOrEmpty(dto.LogoUrl))
                tenant.LogoUrl = dto.LogoUrl;
            if (!string.IsNullOrEmpty(dto.CustomCss))
                tenant.CustomCss = dto.CustomCss;
            if (!string.IsNullOrEmpty(dto.TimeZone))
                tenant.TimeZone = dto.TimeZone;
            if (!string.IsNullOrEmpty(dto.LanguageCode))
                tenant.LanguageCode = dto.LanguageCode;
            if (!string.IsNullOrEmpty(dto.PlanType))
            {
                tenant.PlanType = dto.PlanType;
                tenant.IsPaid = dto.PlanType != "Trial";
                tenant.IsTrialPeriod = dto.PlanType == "Trial";
            }
            if (dto.TransactionFeePercent.HasValue)
                tenant.TransactionFeePercent = dto.TransactionFeePercent.Value;
            if (dto.AllowsInternationalShipping.HasValue)
                tenant.AllowsInternationalShipping = dto.AllowsInternationalShipping.Value;
            if (dto.IsActive.HasValue)
                tenant.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Tenant {tenant.Name} updated successfully");

            return Ok(new
            {
                success = true,
                message = "Tenant updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tenant");
            return StatusCode(500, new { message = "An error occurred updating tenant" });
        }
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> GetGlobalAnalytics()
    {
        if (!IsSuperAdmin() || !HasPermission("ViewAnalytics"))
        {
            return Forbid();
        }

        try
        {
            var analytics = new
            {
                summary = new
                {
                    totalTenants = await _context.Tenants.CountAsync(),
                    activeTenants = await _context.Tenants.CountAsync(t => t.IsActive),
                    paidTenants = await _context.Tenants.CountAsync(t => t.IsPaid),
                    trialTenants = await _context.Tenants.CountAsync(t => t.IsTrialPeriod),
                    totalUsers = await _context.Users.CountAsync(),
                    totalCompanies = await _context.Companies.CountAsync(),
                    totalProducts = await _context.Products.CountAsync(),
                    totalLeads = await _context.Leads.CountAsync()
                },
                tenantsByCountry = await _context.Tenants
                    .GroupBy(t => t.Country)
                    .Select(g => new
                    {
                        country = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync(),
                tenantsByPlan = await _context.Tenants
                    .GroupBy(t => t.PlanType)
                    .Select(g => new
                    {
                        plan = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync(),
                recentActivity = await _context.Tenants
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(10)
                    .Select(t => new
                    {
                        tenantName = t.Name,
                        country = t.Country,
                        createdAt = t.CreatedAt,
                        planType = t.PlanType
                    })
                    .ToListAsync()
            };

            return Ok(new
            {
                success = true,
                data = analytics
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics");
            return StatusCode(500, new { message = "An error occurred fetching analytics" });
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] int? tenantId = null)
    {
        if (!IsSuperAdmin() || !HasPermission("ManageUsers"))
        {
            return Forbid();
        }

        try
        {
            var query = _context.Users
                .Include(u => u.Tenant)
                .Include(u => u.Company)
                .AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(u => u.TenantId == tenantId.Value);
            }

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    id = u.Id,
                    email = u.Email,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    role = u.Role.ToString(),
                    isActive = u.IsActive,
                    tenant = new
                    {
                        id = u.Tenant.Id,
                        name = u.Tenant.Name,
                        country = u.Tenant.Country
                    },
                    company = u.Company != null ? new
                    {
                        id = u.Company.Id,
                        name = u.Company.Name
                    } : null,
                    createdAt = u.CreatedAt,
                    lastLoginAt = u.LastLoginAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                data = users
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, new { message = "An error occurred fetching users" });
        }
    }
}

public class CreateTenantDto
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public string CurrencySymbol { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? TimeZone { get; set; }
    public string? LanguageCode { get; set; }
    public string? PlanType { get; set; }
    public decimal? TransactionFeePercent { get; set; }
    public bool? AllowsInternationalShipping { get; set; }
}

public class UpdateTenantDto
{
    public string? Name { get; set; }
    public string? AdminEmail { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? CustomCss { get; set; }
    public string? TimeZone { get; set; }
    public string? LanguageCode { get; set; }
    public string? PlanType { get; set; }
    public decimal? TransactionFeePercent { get; set; }
    public bool? AllowsInternationalShipping { get; set; }
    public bool? IsActive { get; set; }
}
