using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dockex.API.Data;
using Dockex.API.DTOs;
using Dockex.API.Models;

namespace Dockex.API.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        try
        {
            // Ignorar filtros globales para poder buscar usuarios de cualquier tenant
            var user = await _context.Users
                .IgnoreQueryFilters()
                .Include(u => u.Company)
                .Include(u => u.Tenant)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash) || !user.IsActive)
            {
                return null;
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            user.UpdatedAt = DateTime.UtcNow;
            user.LastLoginAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Expires = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", loginDto.Email);
            return null;
        }
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        try
        {
            // Check if user already exists (ignorar filtros para verificar en todos los tenants)
            if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == registerDto.Email))
            {
                return null;
            }

            // Validate company if provided
            if (registerDto.CompanyId.HasValue)
            {
                var company = await _context.Companies.FindAsync(registerDto.CompanyId.Value);
                if (company == null || !company.IsApproved || !company.IsActive)
                {
                    return null;
                }
            }

            // Si no se especifica TenantId, usar el de Honduras por defecto (ID 1)
            var tenantId = registerDto.TenantId ?? 1;
            
            var user = new User
            {
                TenantId = tenantId,
                Email = registerDto.Email,
                PasswordHash = HashPassword(registerDto.Password),
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                CompanyId = registerDto.CompanyId,
                Role = Enum.Parse<UserRole>(registerDto.Role),
                EmailConfirmed = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Load company information for response
            await _context.Entry(user).Reference(u => u.Company).LoadAsync();

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Expires = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for email: {Email}", registerDto.Email);
            return null;
        }
    }

    public async Task<AuthResponseDto?> RegisterCompanyAsync(RegisterCompanyDto registerCompanyDto, int tenantId)
    {
        // Create user and company atomically
        using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            // Email uniqueness across tenants
            if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == registerCompanyDto.Email))
            {
                return null;
            }

            // Create company (pending approval by default)
            var company = new Company
            {
                TenantId = tenantId,
                Name = registerCompanyDto.Company.Name,
                Description = registerCompanyDto.Company.Description,
                ContactEmail = registerCompanyDto.Company.ContactEmail,
                Phone = registerCompanyDto.Company.Phone,
                // If City provided, append to address
                Address = string.IsNullOrWhiteSpace(registerCompanyDto.Company.City)
                    ? registerCompanyDto.Company.Address
                    : $"{registerCompanyDto.Company.Address}, {registerCompanyDto.Company.City}",
                Website = registerCompanyDto.Company.Website ?? string.Empty,
                TaxId = registerCompanyDto.Company.TaxId,
                BusinessType = registerCompanyDto.Company.BusinessType,
                IsApproved = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Create provider user linked to the company
            var user = new User
            {
                TenantId = tenantId,
                Email = registerCompanyDto.Email,
                PasswordHash = HashPassword(registerCompanyDto.Password),
                FirstName = registerCompanyDto.FirstName,
                LastName = registerCompanyDto.LastName,
                CompanyId = company.Id,
                Role = UserRole.Provider,
                EmailConfirmed = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await _context.Entry(user).Reference(u => u.Company).LoadAsync();
            await _context.Entry(user).Reference(u => u.Tenant).LoadAsync();

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await tx.CommitAsync();

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                Expires = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            _logger.LogError(ex, "Error during register-company for email: {Email}", registerCompanyDto.Email);
            return null;
        }
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiryTime > DateTime.UtcNow);

            if (user == null || !user.IsActive)
            {
                return null;
            }

            var newToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                Expires = DateTime.UtcNow.AddHours(1),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return null;
        }
    }

    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
            if (user == null) return false;

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation");
            return false;
        }
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
    }

    public async Task<bool> ConfirmEmailAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return false;
        if (user.EmailConfirmed) return true;
        user.EmailConfirmed = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("TenantId", user.TenantId.ToString())
        };

        if (user.CompanyId.HasValue)
        {
            claims.Add(new Claim("CompanyId", user.CompanyId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string hashedPassword)
    {
        return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            CompanyId = user.CompanyId,
            CompanyName = user.Company?.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            TenantId = user.TenantId,
            TenantName = user.Tenant?.Name,
            TenantSubdomain = user.Tenant?.Subdomain
        };
    }
}
