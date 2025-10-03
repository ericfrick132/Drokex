using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Dockex.API.DTOs;
using Dockex.API.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthController(IAuthService authService, ILogger<AuthController> logger, IConfiguration configuration, IEmailService emailService)
    {
        _authService = authService;
        _logger = logger;
        _configuration = configuration;
        _emailService = emailService;
    }

    [HttpGet("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long"));
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            var principal = handler.ValidateToken(token, parameters, out _);
            if (!principal.HasClaim(c => c.Type == "ec")) return BadRequest("Invalid token");
            var email = principal.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
            var ok = await _authService.ConfirmEmailAsync(email);
            if (!ok) return NotFound("User not found");
            return Content("Email confirmado. Ya puedes cerrar esta pestaña y volver a la app.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming email");
            return BadRequest("Invalid or expired token");
        }
    }

    private string GenerateEmailToken(string email)
    {
        var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim> {
            new("ec","1"),
            new(ClaimTypes.Email, email)
        };
        var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddDays(1), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    [HttpGet("impersonate-login")]
    [AllowAnonymous]
    public IActionResult ImpersonateLogin([FromQuery] string token, [FromQuery] string? redirect = null)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new ApiResponseDto<bool>("Token requerido"));
            }

            // Opcional: validar token mínimamente
            // Si el token es inválido, la autenticación posterior lo rechazará igualmente.

            // Determinar si la solicitud es segura para setear cookie Secure en producción
            var isSecure = HttpContext.Request.IsHttps || string.Equals(HttpContext.Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = isSecure,
                Expires = DateTimeOffset.UtcNow.AddHours(1),
                Path = "/"
                // No establecer Domain: que el navegador use el host exacto (incluye subdominio)
            };

            Response.Cookies.Append("drokex_auth", token, cookieOptions);

            var target = redirect;
            if (string.IsNullOrEmpty(target))
            {
                target = "/dashboard";
            }
            return Redirect(target);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in impersonate-login");
            return StatusCode(500, new ApiResponseDto<bool>("Error realizando impersonación"));
        }
    }

    [HttpPost("login")]
    [EnableRateLimiting("Auth")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<AuthResponseDto>(errors));
            }

            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
            {
                return Unauthorized(new ApiResponseDto<AuthResponseDto>("Invalid email or password"));
            }

            return Ok(new ApiResponseDto<AuthResponseDto>(result, "Login successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new ApiResponseDto<AuthResponseDto>("Internal server error"));
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<AuthResponseDto>(errors));
            }

            var result = await _authService.RegisterAsync(registerDto);
            if (result == null)
            {
                return BadRequest(new ApiResponseDto<AuthResponseDto>("Email already exists or invalid company"));
            }

            // Send email confirmation
            var confToken = GenerateEmailToken(registerDto.Email);
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var confirmUrl = $"{baseUrl}/api/auth/confirm-email?token={Uri.EscapeDataString(confToken)}";
            await _emailService.SendEmailAsync(registerDto.Email, "Confirma tu correo - Drokex", $"<p>Bienvenido a Drokex</p><p>Confirma tu correo haciendo clic <a href=\"{confirmUrl}\">aquí</a>.</p>");

            return CreatedAtAction(nameof(GetProfile), new { }, new ApiResponseDto<AuthResponseDto>(result, "Registration successful. Please confirm your email."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new ApiResponseDto<AuthResponseDto>("Internal server error"));
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<ActionResult<ApiResponseDto<bool>>> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return Ok(new ApiResponseDto<bool>(true, "Si el correo existe, enviaremos un enlace."));

            // Buscar usuario por email (ignora filtros de tenant)
            var user = await _authService.GetUserByEmailAsync(dto.Email);
            if (user == null)
                return Ok(new ApiResponseDto<bool>(true, "Si el correo existe, enviaremos un enlace."));

            // Generar token JWT temporal para reset
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new List<Claim> {
                new Claim("pwd","1"),
                new Claim(ClaimTypes.Email, user.Email)
            };
            var token = new JwtSecurityToken(claims: claims, expires: DateTime.UtcNow.AddMinutes(30), signingCredentials: creds);
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Construir URL de reset (misma autoridad)
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";
            var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(tokenString)}";
            _logger.LogInformation("Password reset link for {Email}: {Url}", user.Email, resetUrl);
            await _emailService.SendEmailAsync(user.Email, "Restablecer contraseña - Drokex", $"<p>Para restablecer tu contraseña haz clic <a href=\"{resetUrl}\">aquí</a>.</p>");
            return Ok(new ApiResponseDto<bool>(true, "Si el correo existe, enviaremos un enlace."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in forgot-password");
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("Auth")]
    public async Task<ActionResult<ApiResponseDto<bool>>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long"));
            var parameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = handler.ValidateToken(dto.Token, parameters, out _);
            var hasPwdClaim = principal.HasClaim(c => c.Type == "pwd");
            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            if (!hasPwdClaim || string.IsNullOrEmpty(email))
                return BadRequest(new ApiResponseDto<bool>("Invalid token"));

            var user = await _authService.GetUserByEmailAsync(email);
            if (user == null)
                return BadRequest(new ApiResponseDto<bool>("Invalid token"));

            // Actualizar contraseña
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await (HttpContext.RequestServices.GetRequiredService<Dockex.API.Data.ApplicationDbContext>()).SaveChangesAsync();

            return Ok(new ApiResponseDto<bool>(true, "Password reset successfully"));
        }
        catch (SecurityTokenException)
        {
            return BadRequest(new ApiResponseDto<bool>("Invalid or expired token"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in reset-password");
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }
    [HttpPost("register-company")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> RegisterCompany(
        [FromServices] ITenantResolutionService tenantResolution,
        [FromBody] RegisterCompanyDto registerCompanyDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<AuthResponseDto>(errors));
            }

            // Determine tenant from request context or payload, fallback to 1 (HN) for dev
            var tenantId = registerCompanyDto.TenantId
                           ?? tenantResolution.GetCurrentTenantId()
                           ?? 1;

            var result = await _authService.RegisterCompanyAsync(registerCompanyDto, tenantId);
            if (result == null)
            {
                return BadRequest(new ApiResponseDto<AuthResponseDto>("Email already exists or invalid data"));
            }

            return CreatedAtAction(nameof(GetProfile), new { }, new ApiResponseDto<AuthResponseDto>(result, "Company registration successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during company registration");
            return StatusCode(500, new ApiResponseDto<AuthResponseDto>("Internal server error"));
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponseDto<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);
            if (result == null)
            {
                return Unauthorized(new ApiResponseDto<AuthResponseDto>("Invalid refresh token"));
            }

            return Ok(new ApiResponseDto<AuthResponseDto>(result, "Token refreshed successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, new ApiResponseDto<AuthResponseDto>("Internal server error"));
        }
    }

    [HttpPost("revoke-token")]
    [Authorize]
    public async Task<ActionResult<ApiResponseDto<bool>>> RevokeToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            var result = await _authService.RevokeTokenAsync(refreshTokenDto.RefreshToken);
            if (!result)
            {
                return BadRequest(new ApiResponseDto<bool>("Invalid refresh token"));
            }

            return Ok(new ApiResponseDto<bool>(true, "Token revoked successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token revocation");
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponseDto<UserDto>>> GetProfile()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponseDto<UserDto>("Invalid token"));
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ApiResponseDto<UserDto>("User not found"));
            }

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CompanyId = user.CompanyId,
                CompanyName = user.Company?.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt
            };

            return Ok(new ApiResponseDto<UserDto>(userDto, "Profile retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return StatusCode(500, new ApiResponseDto<UserDto>("Internal server error"));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponseDto<bool>>> Logout([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            await _authService.RevokeTokenAsync(refreshTokenDto.RefreshToken);
            return Ok(new ApiResponseDto<bool>(true, "Logout successful"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }
}

public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
