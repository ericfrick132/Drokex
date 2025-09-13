using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dockex.API.Data;
using Dockex.API.Models;
using Dockex.API.DTOs;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/superadmin/auth")]
public class SuperAdminAuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SuperAdminAuthController> _logger;

    public SuperAdminAuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<SuperAdminAuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            // Buscar super admin por email
            var superAdmin = await _context.SuperAdmins
                .Include(sa => sa.CurrentTenant)
                .FirstOrDefaultAsync(sa => sa.Email == dto.Email);

            if (superAdmin == null || !superAdmin.IsActive)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Verificar contraseña
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, superAdmin.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Actualizar último login
            superAdmin.LastLoginAt = DateTime.UtcNow;
            superAdmin.LastLoginIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            // Generar tokens
            var accessToken = GenerateAccessToken(superAdmin);
            var refreshToken = GenerateRefreshToken();

            superAdmin.RefreshToken = refreshToken;
            superAdmin.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            _logger.LogInformation($"SuperAdmin {superAdmin.Email} logged in successfully");

            return Ok(new
            {
                success = true,
                data = new
                {
                    accessToken,
                    refreshToken,
                    expiresIn = 3600,
                    superAdmin = new
                    {
                        id = superAdmin.Id,
                        email = superAdmin.Email,
                        firstName = superAdmin.FirstName,
                        lastName = superAdmin.LastName,
                        isMasterAdmin = superAdmin.IsMasterAdmin,
                        permissions = new
                        {
                            canManageTenants = superAdmin.CanManageTenants,
                            canViewAnalytics = superAdmin.CanViewAnalytics,
                            canManageUsers = superAdmin.CanManageUsers,
                            canManageBilling = superAdmin.CanManageBilling,
                            canAccessAllTenants = superAdmin.CanAccessAllTenants
                        },
                        currentTenant = superAdmin.CurrentTenant != null ? new
                        {
                            id = superAdmin.CurrentTenant.Id,
                            name = superAdmin.CurrentTenant.Name,
                            subdomain = superAdmin.CurrentTenant.Subdomain,
                            country = superAdmin.CurrentTenant.Country,
                            countryCode = superAdmin.CurrentTenant.CountryCode
                        } : null
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during SuperAdmin login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        try
        {
            var superAdmin = await _context.SuperAdmins
                .Include(sa => sa.CurrentTenant)
                .FirstOrDefaultAsync(sa => sa.RefreshToken == dto.RefreshToken);

            if (superAdmin == null || !superAdmin.IsActive || 
                superAdmin.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            // Generar nuevos tokens
            var accessToken = GenerateAccessToken(superAdmin);
            var refreshToken = GenerateRefreshToken();

            superAdmin.RefreshToken = refreshToken;
            superAdmin.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                data = new
                {
                    accessToken,
                    refreshToken,
                    expiresIn = 3600
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing SuperAdmin token");
            return StatusCode(500, new { message = "An error occurred refreshing token" });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var superAdminId = User.FindFirst("SuperAdminId")?.Value;
            if (!string.IsNullOrEmpty(superAdminId))
            {
                var superAdmin = await _context.SuperAdmins
                    .FirstOrDefaultAsync(sa => sa.Id == int.Parse(superAdminId));

                if (superAdmin != null)
                {
                    superAdmin.RefreshToken = null;
                    superAdmin.RefreshTokenExpiryTime = null;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { success = true, message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during SuperAdmin logout");
            return StatusCode(500, new { message = "An error occurred during logout" });
        }
    }

    [HttpPost("switch-tenant")]
    public async Task<IActionResult> SwitchTenant([FromBody] SwitchTenantDto dto)
    {
        try
        {
            var superAdminId = User.FindFirst("SuperAdminId")?.Value;
            if (string.IsNullOrEmpty(superAdminId))
            {
                return Unauthorized();
            }

            var superAdmin = await _context.SuperAdmins
                .FirstOrDefaultAsync(sa => sa.Id == int.Parse(superAdminId));

            if (superAdmin == null || !superAdmin.IsActive || !superAdmin.CanAccessAllTenants)
            {
                return Forbid("You don't have permission to switch tenants");
            }

            // Verificar que el tenant existe
            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(t => t.Id == dto.TenantId && t.IsActive);

            if (tenant == null)
            {
                return NotFound(new { message = "Tenant not found" });
            }

            // Actualizar tenant actual
            superAdmin.CurrentTenantId = tenant.Id;
            await _context.SaveChangesAsync();

            // Generar nuevo token con el tenant actualizado
            var accessToken = GenerateAccessToken(superAdmin);

            _logger.LogInformation($"SuperAdmin {superAdmin.Email} switched to tenant {tenant.Name}");

            return Ok(new
            {
                success = true,
                data = new
                {
                    accessToken,
                    tenant = new
                    {
                        id = tenant.Id,
                        name = tenant.Name,
                        subdomain = tenant.Subdomain,
                        country = tenant.Country,
                        countryCode = tenant.CountryCode,
                        currency = tenant.Currency,
                        currencySymbol = tenant.CurrencySymbol
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error switching tenant");
            return StatusCode(500, new { message = "An error occurred switching tenant" });
        }
    }

    private string GenerateAccessToken(SuperAdmin superAdmin)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim("SuperAdminId", superAdmin.Id.ToString()),
            new Claim(ClaimTypes.Email, superAdmin.Email),
            new Claim(ClaimTypes.Name, $"{superAdmin.FirstName} {superAdmin.LastName}"),
            new Claim("IsSuperAdmin", "true"),
            new Claim("IsMasterAdmin", superAdmin.IsMasterAdmin.ToString())
        };

        // Agregar tenant actual si existe
        if (superAdmin.CurrentTenantId.HasValue)
        {
            claims.Add(new Claim("CurrentTenantId", superAdmin.CurrentTenantId.Value.ToString()));
        }

        // Agregar permisos
        if (superAdmin.CanManageTenants)
            claims.Add(new Claim("Permission", "ManageTenants"));
        if (superAdmin.CanViewAnalytics)
            claims.Add(new Claim("Permission", "ViewAnalytics"));
        if (superAdmin.CanManageUsers)
            claims.Add(new Claim("Permission", "ManageUsers"));
        if (superAdmin.CanManageBilling)
            claims.Add(new Claim("Permission", "ManageBilling"));
        if (superAdmin.CanAccessAllTenants)
            claims.Add(new Claim("Permission", "AccessAllTenants"));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}

public class SwitchTenantDto
{
    public int TenantId { get; set; }
}