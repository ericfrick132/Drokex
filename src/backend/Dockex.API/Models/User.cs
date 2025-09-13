using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class User : IMultiTenant
{
    public int Id { get; set; }
    
    // Multi-tenancy
    [Required]
    public int TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    public string LastName { get; set; } = string.Empty;
    
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
    
    [Required]
    public UserRole Role { get; set; } = UserRole.Buyer;
    
    public bool EmailConfirmed { get; set; } = false;
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
}

public enum UserRole
{
    Admin,
    Staff,
    Provider,
    Buyer
}
