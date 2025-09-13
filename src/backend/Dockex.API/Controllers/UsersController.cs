using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.DTOs;
using Dockex.API.Models;
using Dockex.API.Services;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : BaseTenantController
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public UsersController(
        ApplicationDbContext context,
        ITenantResolutionService tenantResolution,
        ITenantService tenantService,
        IEmailService emailService,
        ILogger<UsersController> logger) : base(tenantResolution, tenantService, logger)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<UserDto>>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;

        var query = _context.Users
            .Include(u => u.Company)
            .Include(u => u.Tenant)
            .Where(u => u.TenantId == CurrentTenantId!.Value)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u => u.Email.Contains(search) || u.FirstName.Contains(search) || u.LastName.Contains(search));
        }
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var r))
        {
            query = query.Where(u => u.Role == r);
        }
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var total = await query.CountAsync();
        var data = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role.ToString(),
                CompanyId = u.CompanyId,
                CompanyName = u.Company != null ? u.Company.Name : null,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                TenantId = u.TenantId,
                TenantName = u.Tenant.Name
            })
            .ToListAsync();

        return Ok(new ApiResponseDto<PagedResponseDto<UserDto>>(new PagedResponseDto<UserDto>(data, total, page, pageSize)));
    }

    public class CreateUserReq
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = "Staff";
        public int? CompanyId { get; set; }
        public string? Password { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<UserDto>>> CreateUser([FromBody] CreateUserReq req)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;

        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == req.Email))
        {
            return BadRequest(new ApiResponseDto<UserDto>("Email already exists"));
        }

        if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
        {
            role = UserRole.Buyer; // fallback
        }

        var user = new User
        {
            TenantId = CurrentTenantId!.Value,
            Email = req.Email,
            FirstName = req.FirstName,
            LastName = req.LastName,
            CompanyId = req.CompanyId,
            Role = role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrEmpty(req.Password) ? CreateTempPassword() : req.Password),
            EmailConfirmed = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Notificar por email (si configurado)
        var pwd = string.IsNullOrEmpty(req.Password) ? "(contraseña temporal enviada)" : "";
        await _emailService.SendEmailAsync(user.Email, "Bienvenido a Drokex",
            $"<p>Hola {user.FirstName}, tu cuenta fue creada en Drokex.</p><p>Correo: {user.Email}</p><p>Rol: {user.Role}</p>");

        var dto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            CompanyId = user.CompanyId,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            TenantId = user.TenantId
        };
        return Ok(new ApiResponseDto<UserDto>(dto, "User created"));
    }

    public class UpdateUserReq
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public int? CompanyId { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<UserDto>>> UpdateUser(int id, [FromBody] UpdateUserReq req)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == CurrentTenantId!.Value);
        if (user == null) return NotFound(new ApiResponseDto<UserDto>("User not found"));

        if (!string.IsNullOrEmpty(req.FirstName)) user.FirstName = req.FirstName;
        if (!string.IsNullOrEmpty(req.LastName)) user.LastName = req.LastName;
        if (!string.IsNullOrEmpty(req.Role) && Enum.TryParse<UserRole>(req.Role, true, out var role)) user.Role = role;
        if (req.CompanyId.HasValue) user.CompanyId = req.CompanyId;
        if (req.IsActive.HasValue) user.IsActive = req.IsActive.Value;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var dto = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            CompanyId = user.CompanyId,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            TenantId = user.TenantId
        };
        return Ok(new ApiResponseDto<UserDto>(dto, "User updated"));
    }

    public class ResetPasswordReq { public string? NewPassword { get; set; } }

    [HttpPost("{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<bool>>> ResetPassword(int id, [FromBody] ResetPasswordReq req)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == CurrentTenantId!.Value);
        if (user == null) return NotFound(new ApiResponseDto<bool>("User not found"));
        var pwd = string.IsNullOrEmpty(req.NewPassword) ? CreateTempPassword() : req.NewPassword!;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(pwd);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _emailService.SendEmailAsync(user.Email, "Restablecimiento de contraseña - Drokex", $"<p>Tu contraseña fue restablecida.</p>");
        return Ok(new ApiResponseDto<bool>(true, "Password reset"));
    }

    private static string CreateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#";
        var rnd = new Random();
        return new string(Enumerable.Repeat(chars, 10).Select(s => s[rnd.Next(s.Length)]).ToArray());
    }
}
