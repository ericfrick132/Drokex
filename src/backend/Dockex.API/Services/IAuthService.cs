using Dockex.API.DTOs;
using Dockex.API.Models;

namespace Dockex.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto?> RegisterCompanyAsync(RegisterCompanyDto registerCompanyDto, int tenantId);
    Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string refreshToken);
    Task<User?> GetUserByIdAsync(int userId);
    Task<User?> GetUserByEmailAsync(string email);
    Task<bool> ConfirmEmailAsync(string email);
    string GenerateJwtToken(User user);
    string GenerateRefreshToken();
}
